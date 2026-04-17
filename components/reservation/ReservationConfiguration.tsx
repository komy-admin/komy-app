import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Switch, ActivityIndicator, Platform, ScrollView, useWindowDimensions } from 'react-native';
import { Plus, Pencil, Trash2, X, ChevronLeft, ChevronRight, ChevronDown, CalendarDays, Clock, CalendarOff, Info } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import { useToast } from '~/components/ToastProvider';
import { DeleteConfirmationModal } from '~/components/ui/DeleteConfirmationModal';
import type {
  ReservationService,
  ReservationSchedule,
  ReservationOverride,
  CreateReservationServiceDto,
  UpdateReservationServiceDto,
  CreateReservationScheduleDto,
  CreateReservationOverrideDto,
} from '~/types/reservation.types';

// === Constants ===

const DAYS = [
  { value: 1, label: 'Lundi', short: 'Lun' },
  { value: 2, label: 'Mardi', short: 'Mar' },
  { value: 3, label: 'Mercredi', short: 'Mer' },
  { value: 4, label: 'Jeudi', short: 'Jeu' },
  { value: 5, label: 'Vendredi', short: 'Ven' },
  { value: 6, label: 'Samedi', short: 'Sam' },
  { value: 7, label: 'Dimanche', short: 'Dim' },
];

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#A855F7', '#EC4899', '#06B6D4', '#84CC16'];
const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

// === Props ===

interface ReservationConfigurationProps {
  reservation: {
    services: ReservationService[];
    schedules: ReservationSchedule[];
    overrides: ReservationOverride[];
    loadServices: () => Promise<ReservationService[]>;
    loadSchedules: () => Promise<ReservationSchedule[]>;
    loadOverrides: (month?: number, year?: number) => Promise<ReservationOverride[]>;
    createService: (data: CreateReservationServiceDto) => Promise<ReservationService>;
    updateService: (id: string, data: UpdateReservationServiceDto) => Promise<ReservationService>;
    deleteService: (id: string) => Promise<void>;
    createSchedule: (data: CreateReservationScheduleDto) => Promise<ReservationSchedule>;
    deleteSchedule: (id: string) => Promise<void>;
    createOverride: (data: CreateReservationOverrideDto) => Promise<ReservationOverride>;
    deleteOverride: (id: string) => Promise<void>;
  };
}

interface ServiceFormData {
  name: string;
  maxCapacity: string;
  slotIntervalMinutes: string;
  serviceDurationMinutes: string;
  color: string;
  isActive: boolean;
}

const INITIAL_SERVICE_FORM: ServiceFormData = {
  name: '',
  maxCapacity: '50',
  slotIntervalMinutes: '30',
  serviceDurationMinutes: '90',
  color: '#3B82F6',
  isActive: true,
};

// === Helpers ===

interface SelectOption { label: string; value: string; }

function StyledSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: SelectOption[] }) {
  if (Platform.OS === 'web') {
    return (
      <View style={{ position: 'relative' }}>
        <select
          value={value}
          onChange={(e) => onChange((e.target as HTMLSelectElement).value)}
          style={{ height: 38, width: '100%', paddingLeft: 10, paddingRight: 32, fontSize: 13, color: '#1E293B', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, outline: 'none', appearance: 'none', cursor: 'pointer' } as any}
        >
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <View style={{ position: 'absolute', right: 8, top: 0, bottom: 0, justifyContent: 'center', pointerEvents: 'none' } as any}>
          <ChevronDown size={14} color="#64748B" />
        </View>
      </View>
    );
  }
  return (
    <View style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, backgroundColor: '#FFFFFF', overflow: 'hidden' }}>
      <Picker selectedValue={value} onValueChange={onChange} style={{ height: 38 }}>
        {options.map(o => <Picker.Item key={o.value} label={o.label} value={o.value} />)}
      </Picker>
    </View>
  );
}

// === Main Component ===

const TOOLTIPS: Record<string, { title: string; items: string[] }> = {
  services: {
    title: 'Services de réservation',
    items: [
      'Un service correspond à un type de repas : Déjeuner, Dîner, Brunch, etc.',
      'Capacité maximale : nombre de couverts que vous pouvez accueillir en même temps sur ce service.',
      'Intervalle : l\'écart entre chaque créneau proposé au client (ex: 30 min → 12h00, 12h30, 13h00…).',
      'Durée du service : la durée estimée d\'un repas. Sert à gérer les chevauchements entre réservations et vérifier la capacité. Ne limite pas les créneaux proposés.',
      'Vous pouvez désactiver un service temporairement sans le supprimer.',
    ],
  },
  horaires: {
    title: 'Créneaux horaires',
    items: [
      'Définissez l\'heure de début et de fin pour chaque service, chaque jour de la semaine.',
      'Les créneaux proposés aux clients sont générés entre ces deux horaires selon l\'intervalle du service.',
      'L\'heure de fin est incluse : un horaire 12h00–14h00 avec un intervalle de 30 min propose 12h00, 12h30, 13h00, 13h30 et 14h00.',
      'Vous pouvez avoir des horaires différents selon les jours.',
    ],
  },
  fermetures: {
    title: 'Fermetures exceptionnelles',
    items: [
      'Bloquez des dates ponctuelles : jours fériés, congés annuels, événements privés.',
      'Vous pouvez fermer un jour complet ou seulement un service spécifique.',
      'Il est aussi possible de modifier les horaires d\'un service pour une date donnée au lieu de le fermer.',
      'Les créneaux concernés ne seront plus proposés aux clients.',
    ],
  },
};

function SectionTooltip({ tooltipKey, visible, onToggle }: { tooltipKey: keyof typeof TOOLTIPS; visible: string | null; onToggle: (key: string | null) => void }) {
  const isVisible = visible === tooltipKey;
  const tooltip = TOOLTIPS[tooltipKey];
  if (!tooltip) return null;
  return (
    <View style={{ position: 'relative', zIndex: 9999 }}>
      <Pressable onPress={() => onToggle(isVisible ? null : tooltipKey)} style={tooltipStyles.tooltipBtn}>
        <Info size={15} color={isVisible ? '#3B82F6' : '#94A3B8'} />
      </Pressable>
      {isVisible && (
        <>
          <Pressable style={tooltipStyles.overlay} onPress={() => onToggle(null)} />
          <View style={tooltipStyles.tooltipBubble}>
            <Text style={tooltipStyles.tooltipTitle}>{tooltip.title}</Text>
            {tooltip.items.map((item, i) => (
              <View key={i} style={tooltipStyles.tooltipItem}>
                <Text style={tooltipStyles.tooltipBullet}>•</Text>
                <Text style={tooltipStyles.tooltipText}>{item}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

export function ReservationConfiguration({ reservation }: ReservationConfigurationProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [visibleTooltip, setVisibleTooltip] = useState<string | null>(null);
  const { showToast } = useToast();
  const { width } = useWindowDimensions();
  const isCompact = width < 1100;

  // Service state
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState<ReservationService | null>(null);
  const [serviceForm, setServiceForm] = useState<ServiceFormData>(INITIAL_SERVICE_FORM);
  const [isSavingService, setIsSavingService] = useState(false);
  const [deleteServiceTarget, setDeleteServiceTarget] = useState<ReservationService | null>(null);
  const [isDeletingService, setIsDeletingService] = useState(false);

  // Schedule state
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleServiceId, setScheduleServiceId] = useState<string>('');
  const [scheduleDay, setScheduleDay] = useState<number>(1);
  const [schedStartHour, setSchedStartHour] = useState('12');
  const [schedStartMinute, setSchedStartMinute] = useState('00');
  const [schedEndHour, setSchedEndHour] = useState('14');
  const [schedEndMinute, setSchedEndMinute] = useState('00');
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [deleteScheduleTarget, setDeleteScheduleTarget] = useState<ReservationSchedule | null>(null);
  const [isDeletingSchedule, setIsDeletingSchedule] = useState(false);

  // Override state
  const now = new Date();
  const [overrideMonth, setOverrideMonth] = useState(now.getMonth() + 1);
  const [overrideYear, setOverrideYear] = useState(now.getFullYear());
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [overrideDate, setOverrideDate] = useState('');
  const [overrideIsClosed, setOverrideIsClosed] = useState(true);
  const [overrideStartHour, setOverrideStartHour] = useState('10');
  const [overrideStartMinute, setOverrideStartMinute] = useState('00');
  const [overrideEndHour, setOverrideEndHour] = useState('14');
  const [overrideEndMinute, setOverrideEndMinute] = useState('00');
  const [overrideServiceId, setOverrideServiceId] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [isSavingOverride, setIsSavingOverride] = useState(false);
  const [deleteOverrideTarget, setDeleteOverrideTarget] = useState<ReservationOverride | null>(null);
  const [isDeletingOverride, setIsDeletingOverride] = useState(false);

  // === Load data ===

  useEffect(() => {
    Promise.all([
      reservation.loadServices(),
      reservation.loadSchedules(),
      reservation.loadOverrides(overrideMonth, overrideYear),
    ])
      .catch(() => showToast('Erreur chargement', 'error'))
      .finally(() => setIsLoading(false));
  }, []);

  // Reload overrides when month changes
  useEffect(() => {
    if (!isLoading) {
      reservation.loadOverrides(overrideMonth, overrideYear).catch(() => {});
    }
  }, [overrideMonth, overrideYear]);

  useEffect(() => {
    if (reservation.services.length > 0 && !scheduleServiceId) {
      setScheduleServiceId(reservation.services[0].id);
    }
  }, [reservation.services]);

  // === Service handlers ===

  const openCreateService = useCallback(() => {
    setServiceForm(INITIAL_SERVICE_FORM);
    setEditingService(null);
    setShowServiceForm(true);
  }, []);

  const openEditService = useCallback((service: ReservationService) => {
    setServiceForm({
      name: service.name,
      maxCapacity: String(service.maxCapacity),
      slotIntervalMinutes: String(service.slotIntervalMinutes),
      serviceDurationMinutes: String(service.serviceDurationMinutes),
      color: service.color || '#3B82F6',
      isActive: service.isActive,
    });
    setEditingService(service);
    setShowServiceForm(true);
  }, []);

  const handleSaveService = async () => {
    if (!serviceForm.name.trim()) {
      showToast('Le nom est requis', 'error');
      return;
    }
    setIsSavingService(true);
    try {
      const data = {
        name: serviceForm.name.trim(),
        maxCapacity: parseInt(serviceForm.maxCapacity) || 50,
        slotIntervalMinutes: parseInt(serviceForm.slotIntervalMinutes) || 30,
        serviceDurationMinutes: parseInt(serviceForm.serviceDurationMinutes) || 90,
        color: serviceForm.color,
        isActive: serviceForm.isActive,
      };
      if (editingService) {
        await reservation.updateService(editingService.id, data);
        showToast('Service modifié', 'success');
      } else {
        await reservation.createService(data);
        showToast('Service créé', 'success');
      }
      setShowServiceForm(false);
      setEditingService(null);
    } catch (error: any) {
      showToast(error?.response?.data?.error || 'Erreur', 'error');
    } finally {
      setIsSavingService(false);
    }
  };

  const handleDeleteService = async () => {
    if (!deleteServiceTarget) return;
    setIsDeletingService(true);
    try {
      await reservation.deleteService(deleteServiceTarget.id);
      showToast('Service supprimé', 'success');
      setDeleteServiceTarget(null);
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Erreur', 'error');
    } finally {
      setIsDeletingService(false);
    }
  };

  // === Schedule handlers ===

  const handleCreateSchedule = async () => {
    if (!scheduleServiceId) {
      showToast('Sélectionnez un service', 'error');
      return;
    }
    setIsSavingSchedule(true);
    try {
      await reservation.createSchedule({
        serviceId: scheduleServiceId,
        dayOfWeek: scheduleDay,
        startTime: `${schedStartHour}:${schedStartMinute}`,
        endTime: `${schedEndHour}:${schedEndMinute}`,
      });
      showToast('Créneau ajouté', 'success');
      setShowScheduleForm(false);
    } catch (error: any) {
      const message = error?.response?.data?.errors?.[0]?.message
        || error?.response?.data?.error?.message
        || (typeof error?.response?.data?.error === 'string' ? error.response.data.error : null)
        || 'Erreur lors de la création';
      showToast(message, 'error');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const handleDeleteSchedule = async () => {
    if (!deleteScheduleTarget) return;
    setIsDeletingSchedule(true);
    try {
      await reservation.deleteSchedule(deleteScheduleTarget.id);
      showToast('Créneau supprimé', 'success');
      setDeleteScheduleTarget(null);
    } catch {
      showToast('Erreur lors de la suppression', 'error');
    } finally {
      setIsDeletingSchedule(false);
    }
  };

  // === Override handlers ===

  const navigateOverrideMonth = (direction: number) => {
    let m = overrideMonth + direction;
    let y = overrideYear;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    setOverrideMonth(m);
    setOverrideYear(y);
  };

  const handleCreateOverride = async () => {
    if (!overrideDate) {
      showToast('La date est requise', 'error');
      return;
    }
    setIsSavingOverride(true);
    try {
      const data: CreateReservationOverrideDto = {
        date: overrideDate,
        isClosed: overrideIsClosed,
      };
      if (!overrideIsClosed) {
        data.startTime = `${overrideStartHour}:${overrideStartMinute}`;
        data.endTime = `${overrideEndHour}:${overrideEndMinute}`;
      }
      if (overrideServiceId) data.serviceId = overrideServiceId;
      if (overrideReason) data.reason = overrideReason;
      await reservation.createOverride(data);
      showToast('Fermeture ajoutée', 'success');
      setShowOverrideForm(false);
      setOverrideDate('');
      setOverrideReason('');
      setOverrideIsClosed(true);
      setOverrideServiceId('');
    } catch (error: any) {
      showToast(error?.response?.data?.error || 'Erreur', 'error');
    } finally {
      setIsSavingOverride(false);
    }
  };

  const handleDeleteOverride = async () => {
    if (!deleteOverrideTarget) return;
    setIsDeletingOverride(true);
    try {
      await reservation.deleteOverride(deleteOverrideTarget.id);
      showToast('Fermeture supprimée', 'success');
      setDeleteOverrideTarget(null);
    } catch {
      showToast('Erreur lors de la suppression', 'error');
    } finally {
      setIsDeletingOverride(false);
    }
  };

  // === Helpers ===

  const getServiceName = useCallback((serviceId: string) => {
    return reservation.services.find(s => s.id === serviceId)?.name || 'Service inconnu';
  }, [reservation.services]);

  const getServiceColor = useCallback((serviceId: string) => {
    return reservation.services.find(s => s.id === serviceId)?.color || '#3B82F6';
  }, [reservation.services]);

  const schedulesByDay = useMemo(() => {
    const grouped: Record<number, ReservationSchedule[]> = {};
    DAYS.forEach(d => { grouped[d.value] = []; });
    reservation.schedules.forEach(schedule => {
      if (grouped[schedule.dayOfWeek]) {
        grouped[schedule.dayOfWeek].push(schedule);
      }
    });
    return grouped;
  }, [reservation.schedules]);

  const navigateCalendar = (direction: number) => {
    let m = calMonth + direction;
    let y = calYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setCalMonth(m);
    setCalYear(y);
  };

  const getCalendarDays = () => {
    const firstDay = new Date(calYear, calMonth, 1);
    const startWeekday = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const days: (number | null)[] = Array(startWeekday).fill(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    while (days.length % 7 !== 0) days.push(null);
    return days;
  };

  const selectCalendarDay = (day: number) => {
    const m = String(calMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    setOverrideDate(`${calYear}-${m}-${d}`);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
  };

  const getOverrideServiceName = (serviceId?: string | null) => {
    if (!serviceId) return 'Tous les services';
    return reservation.services.find(s => s.id === serviceId)?.name || 'Service inconnu';
  };

  // === Render ===

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2A2E33" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.pageTitle}>Configuration</Text>
          <Text style={styles.pageSubtitle}>Services, horaires hebdomadaires et fermetures exceptionnelles</Text>
        </View>
      </View>

      {/* ============ ROW 1: SERVICES + FERMETURES ============ */}
      <View style={[styles.row, isCompact && styles.rowCompact]}>
        {/* --- Services --- */}
        <View style={[styles.section, { flex: 1, marginBottom: 0, minHeight: 250 }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionIconWrap}>
                <CalendarDays size={18} color="#10B981" />
              </View>
              <View>
                <View style={tooltipStyles.titleRow}>
                  <Text style={styles.sectionTitle}>Services</Text>
                  <SectionTooltip tooltipKey="services" visible={visibleTooltip} onToggle={setVisibleTooltip} />
                </View>
                <Text style={styles.sectionSubtitle}>Vos services de restauration</Text>
              </View>
            </View>
            <Pressable style={styles.addButton} onPress={openCreateService}>
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Ajouter</Text>
            </Pressable>
          </View>

          {/* Service Form */}
          {showServiceForm && (
            <View style={styles.inlineForm}>
              <View style={styles.inlineFormHeader}>
                <Text style={styles.inlineFormTitle}>
                  {editingService ? 'Modifier le service' : 'Nouveau service'}
                </Text>
                <Pressable onPress={() => { setShowServiceForm(false); setEditingService(null); }}>
                  <X size={18} color="#64748B" />
                </Pressable>
              </View>

              <View style={styles.formFieldsCol}>
                <View>
                  <Text style={styles.fieldLabel}>Nom</Text>
                  <TextInput
                    style={styles.textInput}
                    value={serviceForm.name}
                    onChangeText={(t) => setServiceForm(p => ({ ...p, name: t }))}
                    placeholder="Ex: Déjeuner, Dîner..."
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={styles.formFieldsRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Capacité</Text>
                    <TextInput
                      style={styles.textInput}
                      value={serviceForm.maxCapacity}
                      onChangeText={(t) => setServiceForm(p => ({ ...p, maxCapacity: t }))}
                      keyboardType="number-pad"
                      placeholder="50"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Intervalle (min)</Text>
                    <TextInput
                      style={styles.textInput}
                      value={serviceForm.slotIntervalMinutes}
                      onChangeText={(t) => setServiceForm(p => ({ ...p, slotIntervalMinutes: t }))}
                      keyboardType="number-pad"
                      placeholder="30"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Durée (min)</Text>
                    <TextInput
                      style={styles.textInput}
                      value={serviceForm.serviceDurationMinutes}
                      onChangeText={(t) => setServiceForm(p => ({ ...p, serviceDurationMinutes: t }))}
                      keyboardType="number-pad"
                      placeholder="90"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>
                <View style={styles.formFieldsRow}>
                  <View>
                    <Text style={styles.fieldLabel}>Couleur</Text>
                    <View style={styles.colorPicker}>
                      {COLORS.map((color) => (
                        <Pressable
                          key={color}
                          style={[
                            styles.colorOption,
                            { backgroundColor: color },
                            serviceForm.color === color && styles.colorOptionSelected,
                          ]}
                          onPress={() => setServiceForm(p => ({ ...p, color }))}
                        />
                      ))}
                    </View>
                  </View>
                  <View style={styles.switchRow}>
                    <Text style={styles.fieldLabel}>Actif</Text>
                    <Switch
                      value={serviceForm.isActive}
                      onValueChange={(v) => setServiceForm(p => ({ ...p, isActive: v }))}
                      trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                      thumbColor={serviceForm.isActive ? '#10B981' : '#9CA3AF'}
                    />
                  </View>
                </View>
                <View style={styles.inlineFormActions}>
                  <Pressable
                    style={[styles.saveBtn, isSavingService && styles.saveBtnDisabled]}
                    onPress={handleSaveService}
                    disabled={isSavingService}
                  >
                    <Text style={styles.saveBtnText}>
                      {isSavingService ? 'Sauvegarde...' : editingService ? 'Modifier' : 'Créer'}
                    </Text>
                  </Pressable>
                  <Pressable style={styles.cancelBtn} onPress={() => { setShowServiceForm(false); setEditingService(null); }}>
                    <Text style={styles.cancelBtnText}>Annuler</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}

          {/* Service cards (scrollable) */}
          {reservation.services.length === 0 ? (
            <View style={styles.emptyInline}>
              <Text style={styles.emptyText}>Aucun service configuré</Text>
              <Text style={styles.emptySubtext}>Créez votre premier service pour commencer</Text>
            </View>
          ) : (
            <ScrollView style={styles.servicesScroll} contentContainerStyle={styles.servicesScrollContent} nestedScrollEnabled>
              {reservation.services.map((service) => (
                <View key={service.id} style={styles.serviceCard}>
                  <View style={[styles.serviceColorBar, { backgroundColor: service.color || '#3B82F6' }]} />
                  <View style={styles.serviceCardBody}>
                    <View style={styles.serviceNameRow}>
                      <Text style={styles.serviceName}>{service.name}</Text>
                      {!service.isActive && (
                        <View style={styles.inactiveBadge}>
                          <Text style={styles.inactiveBadgeText}>Inactif</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.serviceDetails}>
                      {service.maxCapacity} couv. · {service.slotIntervalMinutes}min · {service.serviceDurationMinutes}min
                    </Text>
                  </View>
                  <View style={styles.serviceActions}>
                    <Switch
                      value={service.isActive}
                      onValueChange={(v) => { reservation.updateService(service.id, { isActive: v }); }}
                      trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                      thumbColor={service.isActive ? '#10B981' : '#9CA3AF'}
                    />
                    <Pressable style={styles.iconBtn} onPress={() => openEditService(service)}>
                      <Pencil size={14} color="#64748B" />
                    </Pressable>
                    <Pressable style={styles.iconBtn} onPress={() => setDeleteServiceTarget(service)}>
                      <Trash2 size={14} color="#EF4444" />
                    </Pressable>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* --- Fermetures --- */}
        <View style={[styles.section, { flex: 1, marginBottom: 0, minHeight: 250 }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionIconWrap}>
                <CalendarOff size={18} color="#EF4444" />
              </View>
              <View>
                <View style={tooltipStyles.titleRow}>
                  <Text style={styles.sectionTitle}>Fermetures exceptionnelles</Text>
                  <SectionTooltip tooltipKey="fermetures" visible={visibleTooltip} onToggle={setVisibleTooltip} />
                </View>
                <Text style={styles.sectionSubtitle}>Jours fériés et horaires spéciaux</Text>
              </View>
            </View>
            <Pressable style={styles.addButton} onPress={() => setShowOverrideForm(true)}>
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Ajouter</Text>
            </Pressable>
          </View>

          <View style={styles.monthFilterRow}>
            <Pressable onPress={() => navigateOverrideMonth(-1)} style={styles.monthFilterBtn}>
              <ChevronLeft size={14} color="#64748B" />
            </Pressable>
            <Text style={styles.monthFilterText}>{MONTHS[overrideMonth - 1]} {overrideYear}</Text>
            <Pressable onPress={() => navigateOverrideMonth(1)} style={styles.monthFilterBtn}>
              <ChevronRight size={14} color="#64748B" />
            </Pressable>
          </View>

          {/* Override Form */}
          {showOverrideForm && (
            <View style={styles.inlineForm}>
              <View style={styles.inlineFormHeader}>
                <Text style={styles.inlineFormTitle}>Nouvelle fermeture</Text>
                <Pressable onPress={() => setShowOverrideForm(false)}>
                  <X size={18} color="#64748B" />
                </Pressable>
              </View>

              <View style={styles.overrideFormCol}>
                {/* Mini calendar */}
                <View style={styles.miniCalendar}>
                  <View style={styles.calNav}>
                    <Pressable onPress={() => navigateCalendar(-1)} style={styles.calNavBtn}>
                      <ChevronLeft size={16} color="#64748B" />
                    </Pressable>
                    <Text style={styles.calNavText}>{MONTHS[calMonth]} {calYear}</Text>
                    <Pressable onPress={() => navigateCalendar(1)} style={styles.calNavBtn}>
                      <ChevronRight size={16} color="#64748B" />
                    </Pressable>
                  </View>
                  <View style={styles.calWeekdays}>
                    {WEEKDAY_LABELS.map(l => (
                      <Text key={l} style={styles.calWeekdayText}>{l}</Text>
                    ))}
                  </View>
                  <View style={styles.calGrid}>
                    {getCalendarDays().map((day, i) => {
                      if (day === null) return <View key={`e-${i}`} style={styles.calDayEmpty} />;
                      const m = String(calMonth + 1).padStart(2, '0');
                      const d = String(day).padStart(2, '0');
                      const dateStr = `${calYear}-${m}-${d}`;
                      const isSelected = overrideDate === dateStr;
                      const hasOverride = reservation.overrides.some(o => o.date.startsWith(dateStr));
                      return (
                        <Pressable
                          key={`d-${day}`}
                          style={[styles.calDay, isSelected && styles.calDaySelected, hasOverride && !isSelected && styles.calDayHasOverride]}
                          onPress={() => selectCalendarDay(day)}
                        >
                          <Text style={[styles.calDayText, isSelected && styles.calDayTextSelected]}>
                            {day}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  {overrideDate ? (
                    <Text style={styles.selectedDateText}>Sélectionné : {overrideDate}</Text>
                  ) : null}
                </View>

                {/* Override fields */}
                <View style={styles.overrideFormFields}>
                  <View style={styles.switchRow}>
                    <Text style={styles.fieldLabel}>Fermé toute la journée</Text>
                    <Switch
                      value={overrideIsClosed}
                      onValueChange={setOverrideIsClosed}
                      trackColor={{ false: '#D1D5DB', true: '#FECACA' }}
                      thumbColor={overrideIsClosed ? '#EF4444' : '#9CA3AF'}
                    />
                  </View>

                  {!overrideIsClosed && (
                    <View style={styles.formFieldsRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabel}>Début</Text>
                        <View style={styles.timeRow}>
                          <View style={[styles.pickerContainer, { flex: 1 }]}>
                            <Picker selectedValue={overrideStartHour} onValueChange={setOverrideStartHour} style={styles.picker}>
                              {HOURS.map(h => <Picker.Item key={h} label={`${h}h`} value={h} />)}
                            </Picker>
                          </View>
                          <View style={[styles.pickerContainer, { flex: 1 }]}>
                            <Picker selectedValue={overrideStartMinute} onValueChange={setOverrideStartMinute} style={styles.picker}>
                              {MINUTES.map(m => <Picker.Item key={m} label={m} value={m} />)}
                            </Picker>
                          </View>
                        </View>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabel}>Fin</Text>
                        <View style={styles.timeRow}>
                          <View style={[styles.pickerContainer, { flex: 1 }]}>
                            <Picker selectedValue={overrideEndHour} onValueChange={setOverrideEndHour} style={styles.picker}>
                              {HOURS.map(h => <Picker.Item key={h} label={`${h}h`} value={h} />)}
                            </Picker>
                          </View>
                          <View style={[styles.pickerContainer, { flex: 1 }]}>
                            <Picker selectedValue={overrideEndMinute} onValueChange={setOverrideEndMinute} style={styles.picker}>
                              {MINUTES.map(m => <Picker.Item key={m} label={m} value={m} />)}
                            </Picker>
                          </View>
                        </View>
                      </View>
                    </View>
                  )}

                  <View>
                    <Text style={styles.fieldLabel}>Service concerné (optionnel)</Text>
                    <StyledSelect
                      value={overrideServiceId}
                      onChange={setOverrideServiceId}
                      options={[
                        { label: 'Tous les services', value: '' },
                        ...reservation.services.map(s => ({ label: s.name, value: s.id })),
                      ]}
                    />
                  </View>

                  <View>
                    <Text style={styles.fieldLabel}>Raison (optionnel)</Text>
                    <TextInput
                      style={styles.textInput}
                      value={overrideReason}
                      onChangeText={setOverrideReason}
                      placeholder="Ex: Jour férié, Travaux..."
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>
              </View>

              <View style={[styles.inlineFormActions, { marginTop: 4 }]}>
                <Pressable
                  style={[styles.saveBtn, isSavingOverride && styles.saveBtnDisabled]}
                  onPress={handleCreateOverride}
                  disabled={isSavingOverride}
                >
                  <Text style={styles.saveBtnText}>{isSavingOverride ? 'Ajout...' : 'Ajouter'}</Text>
                </Pressable>
                <Pressable style={styles.cancelBtn} onPress={() => setShowOverrideForm(false)}>
                  <Text style={styles.cancelBtnText}>Annuler</Text>
                </Pressable>
              </View>
            </View>
          )}

          {reservation.overrides.length === 0 ? (
            <View style={styles.emptyInline}>
              <Text style={styles.emptyText}>Aucune fermeture ce mois-ci</Text>
            </View>
          ) : (
            <View style={styles.overridesList}>
              {reservation.overrides.map((override) => (
                <View key={override.id} style={styles.serviceCard}>
                  <View style={[styles.serviceColorBar, { backgroundColor: override.isClosed ? '#EF4444' : '#F59E0B' }]} />
                  <View style={styles.serviceCardBody}>
                    <View style={styles.serviceNameRow}>
                      <Text style={styles.serviceName}>{formatDate(override.date)}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: override.isClosed ? '#FEF2F2' : '#FEF3C7' }]}>
                        <Text style={[styles.statusBadgeText, { color: override.isClosed ? '#EF4444' : '#D97706' }]}>
                          {override.isClosed ? 'Fermé' : 'Horaires spéciaux'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.serviceDetails}>
                      {getOverrideServiceName(override.serviceId)}
                      {!override.isClosed && override.startTime && override.endTime
                        ? ` · ${override.startTime} - ${override.endTime}` : ''}
                      {override.reason ? ` · ${override.reason}` : ''}
                    </Text>
                  </View>
                  <View style={styles.serviceActions}>
                    <Pressable style={styles.iconBtn} onPress={() => setDeleteOverrideTarget(override)}>
                      <Trash2 size={14} color="#EF4444" />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* ============ ROW 2: HORAIRES (pleine largeur) ============ */}
      <View style={[styles.section, { marginBottom: 20 }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionIconWrap}>
              <Clock size={18} color="#F59E0B" />
            </View>
            <View>
              <View style={tooltipStyles.titleRow}>
                <Text style={styles.sectionTitle}>Horaires hebdomadaires</Text>
                <SectionTooltip tooltipKey="horaires" visible={visibleTooltip} onToggle={setVisibleTooltip} />
              </View>
              <Text style={styles.sectionSubtitle}>Plages horaires par service et par jour</Text>
            </View>
          </View>
          {reservation.services.length > 0 && (
            <Pressable style={styles.addButton} onPress={() => setShowScheduleForm(true)}>
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Ajouter</Text>
            </Pressable>
          )}
        </View>

        {/* Schedule Form */}
        {showScheduleForm && (
          <View style={styles.inlineForm}>
            <View style={styles.inlineFormHeader}>
              <Text style={styles.inlineFormTitle}>Nouveau créneau</Text>
              <Pressable onPress={() => setShowScheduleForm(false)}>
                <X size={18} color="#64748B" />
              </Pressable>
            </View>
            <View style={styles.formFieldsCol}>
              <View style={styles.formFieldsRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Service</Text>
                  <View style={styles.pickerContainer}>
                    <Picker selectedValue={scheduleServiceId} onValueChange={setScheduleServiceId} style={styles.picker}>
                      {reservation.services.map((s) => (
                        <Picker.Item key={s.id} label={s.name} value={s.id} />
                      ))}
                    </Picker>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Jour</Text>
                  <View style={styles.pickerContainer}>
                    <Picker selectedValue={scheduleDay} onValueChange={setScheduleDay} style={styles.picker}>
                      {DAYS.map((d) => <Picker.Item key={d.value} label={d.label} value={d.value} />)}
                    </Picker>
                  </View>
                </View>
              </View>
              <View style={styles.formFieldsRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Début</Text>
                  <View style={styles.timeRow}>
                    <View style={[styles.pickerContainer, { flex: 1 }]}>
                      <Picker selectedValue={schedStartHour} onValueChange={setSchedStartHour} style={styles.picker}>
                        {HOURS.map(h => <Picker.Item key={h} label={`${h}h`} value={h} />)}
                      </Picker>
                    </View>
                    <View style={[styles.pickerContainer, { flex: 1 }]}>
                      <Picker selectedValue={schedStartMinute} onValueChange={setSchedStartMinute} style={styles.picker}>
                        {MINUTES.map(m => <Picker.Item key={m} label={m} value={m} />)}
                      </Picker>
                    </View>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Fin</Text>
                  <View style={styles.timeRow}>
                    <View style={[styles.pickerContainer, { flex: 1 }]}>
                      <Picker selectedValue={schedEndHour} onValueChange={setSchedEndHour} style={styles.picker}>
                        {HOURS.map(h => <Picker.Item key={h} label={`${h}h`} value={h} />)}
                      </Picker>
                    </View>
                    <View style={[styles.pickerContainer, { flex: 1 }]}>
                      <Picker selectedValue={schedEndMinute} onValueChange={setSchedEndMinute} style={styles.picker}>
                        {MINUTES.map(m => <Picker.Item key={m} label={m} value={m} />)}
                      </Picker>
                    </View>
                  </View>
                </View>
              </View>
            </View>
            <View style={styles.inlineFormActions}>
              <Pressable
                style={[styles.saveBtn, isSavingSchedule && styles.saveBtnDisabled]}
                onPress={handleCreateSchedule}
                disabled={isSavingSchedule}
              >
                <Text style={styles.saveBtnText}>{isSavingSchedule ? 'Ajout...' : 'Ajouter'}</Text>
              </Pressable>
              <Pressable style={styles.cancelBtn} onPress={() => setShowScheduleForm(false)}>
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Schedule table */}
        {reservation.services.length === 0 ? (
          <View style={styles.emptyInline}>
            <Text style={styles.emptyText}>Créez d'abord un service</Text>
            <Text style={styles.emptySubtext}>Les horaires sont liés aux services</Text>
          </View>
        ) : (
          <View style={styles.scheduleTable}>
            {/* Day headers */}
            <View style={styles.scheduleHeaderRow}>
              {DAYS.map((day) => (
                <View key={day.value} style={styles.scheduleHeaderCell}>
                  <Text style={styles.scheduleHeaderText}>{day.label.slice(0, 3)}.</Text>
                </View>
              ))}
            </View>
            {/* Day columns */}
            <View style={styles.scheduleBodyRow}>
              {DAYS.map((day) => {
                const daySchedules = schedulesByDay[day.value] || [];
                return (
                  <View key={day.value} style={styles.scheduleBodyCell}>
                    {daySchedules.length === 0 ? (
                      <Text style={styles.noSlotText}>—</Text>
                    ) : (
                      daySchedules.map((schedule) => (
                        <View
                          key={schedule.id}
                          style={[styles.scheduleSlot, {
                            backgroundColor: getServiceColor(schedule.serviceId) + '12',
                            borderLeftColor: getServiceColor(schedule.serviceId),
                          }]}
                        >
                          <Text style={[styles.scheduleSlotService, { color: getServiceColor(schedule.serviceId) }]} numberOfLines={1}>
                            {getServiceName(schedule.serviceId)}
                          </Text>
                          <Text style={styles.scheduleSlotTime}>
                            {schedule.startTime} - {schedule.endTime}
                          </Text>
                          <Pressable style={styles.scheduleSlotDelete} onPress={() => setDeleteScheduleTarget(schedule)}>
                            <Trash2 size={11} color="#EF4444" />
                          </Pressable>
                        </View>
                      ))
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </View>

      {/* Delete modals */}
      <DeleteConfirmationModal
        isVisible={!!deleteServiceTarget}
        onClose={() => setDeleteServiceTarget(null)}
        onConfirm={handleDeleteService}
        entityName={deleteServiceTarget?.name || ''}
        entityType="le service"
        isLoading={isDeletingService}
      />
      <DeleteConfirmationModal
        isVisible={!!deleteScheduleTarget}
        onClose={() => setDeleteScheduleTarget(null)}
        onConfirm={handleDeleteSchedule}
        entityName={deleteScheduleTarget ? `${getServiceName(deleteScheduleTarget.serviceId)} - ${DAYS.find(d => d.value === deleteScheduleTarget.dayOfWeek)?.label}` : ''}
        entityType="le créneau"
        isLoading={isDeletingSchedule}
      />
      <DeleteConfirmationModal
        isVisible={!!deleteOverrideTarget}
        onClose={() => setDeleteOverrideTarget(null)}
        onConfirm={handleDeleteOverride}
        entityName={deleteOverrideTarget ? formatDate(deleteOverrideTarget.date) : ''}
        entityType="la fermeture"
        isLoading={isDeletingOverride}
      />
    </View>
  );
}

// === Styles ===

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  pageTitle: { fontSize: 22, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  pageSubtitle: { fontSize: 14, color: '#64748B' },

  // Layout
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 20,
    marginBottom: 20,
    zIndex: 10,
  },
  rowCompact: {
    flexDirection: 'column',
  },
section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    ...(Platform.OS === 'web' && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      overflow: 'visible',
    }),
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    zIndex: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 10,
  },
  sectionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  sectionSubtitle: { fontSize: 12, color: '#94A3B8', marginTop: 1 },

  monthFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 4,
    marginBottom: 14,
  },
  monthFilterBtn: {
    padding: 4,
    borderRadius: 6,
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  monthFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    minWidth: 80,
    textAlign: 'center',
  },

  // Buttons
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2A2E33',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  addButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },

  // Inline form
  inlineForm: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inlineFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  inlineFormTitle: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  formFieldsCol: {
    gap: 12,
  },
  formFieldsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-end',
  },
  inlineFormActions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },

  // Form fields
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 4 },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#1E293B',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 38,
    ...(Platform.OS === 'web' && {
      paddingHorizontal: 8,
      fontSize: 13,
      borderWidth: 0,
    }),
  },
  timeRow: { flexDirection: 'row', gap: 6 },
  colorPicker: { flexDirection: 'row', gap: 6 },
  colorOption: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: { borderColor: '#1E293B', borderWidth: 3 },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  saveBtn: {
    backgroundColor: '#2A2E33',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },
  cancelBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  cancelBtnText: { color: '#64748B', fontWeight: '500', fontSize: 13 },

  // Empty
  emptyInline: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { fontSize: 14, fontWeight: '600', color: '#94A3B8', marginBottom: 4 },
  emptySubtext: { fontSize: 13, color: '#CBD5E1' },

  // Services scroll
  servicesScroll: { maxHeight: 280 },
  servicesScrollContent: { gap: 8 },

  // Services grid
  servicesGrid: { gap: 8 },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    minHeight: 56,
  },
  serviceColorBar: { width: 4, alignSelf: 'stretch' },
  serviceCardBody: { flex: 1, paddingVertical: 10, paddingHorizontal: 14 },
  serviceNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  serviceName: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  inactiveBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  inactiveBadgeText: { fontSize: 10, color: '#EF4444', fontWeight: '600' },
  serviceDetails: { fontSize: 12, color: '#64748B' },
  serviceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingRight: 10,
  },
  iconBtn: {
    padding: 6,
    borderRadius: 6,
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },

  // Schedule table
  scheduleTable: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  scheduleHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  scheduleHeaderCell: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  scheduleHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scheduleBodyRow: {
    flexDirection: 'row',
    minHeight: 80,
  },
  scheduleBodyCell: {
    flex: 1,
    padding: 6,
    gap: 4,
    borderRightWidth: 1,
    borderRightColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  noSlotText: { fontSize: 12, color: '#CBD5E1' },
  scheduleSlot: {
    width: '100%',
    borderRadius: 6,
    borderLeftWidth: 3,
    paddingHorizontal: 6,
    paddingVertical: 5,
    position: 'relative',
  },
  scheduleSlotService: {
    fontSize: 11,
    fontWeight: '700',
  },
  scheduleSlotTime: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  scheduleSlotDelete: {
    position: 'absolute',
    top: 2,
    right: 2,
    padding: 2,
    borderRadius: 4,
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },

  // Overrides
  overridesList: { gap: 8 },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  statusBadgeText: { fontSize: 10, fontWeight: '600' },

  // Mini calendar (override form)
  miniCalendar: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
  },
  calNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  calNavBtn: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    ...(Platform.OS === 'web' && { cursor: 'pointer', userSelect: 'none' } as any),
  },
  calNavText: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
  calWeekdays: { flexDirection: 'row', marginBottom: 4 },
  calWeekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calDayEmpty: { width: '14.28%', height: 28 },
  calDay: {
    width: '14.28%',
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  calDaySelected: { backgroundColor: '#2A2E33' },
  calDayHasOverride: { backgroundColor: '#FEF2F2' },
  calDayText: { fontSize: 12, color: '#1E293B' },
  calDayTextSelected: { color: '#FFFFFF', fontWeight: '700' },
  selectedDateText: { fontSize: 11, color: '#64748B', marginTop: 6 },
  overrideFormCol: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 12,
  },
  overrideFormFields: { gap: 10 },
});

const tooltipStyles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    position: 'relative',
    zIndex: 9999,
  },
  overlay: {
    position: 'fixed' as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9998,
  },
  tooltipBtn: {
    padding: 2,
    borderRadius: 10,
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  tooltipBubble: {
    position: 'absolute',
    top: 28,
    left: -8,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    width: 320,
    gap: 6,
    zIndex: 9999,
    elevation: 20,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
      overflow: 'visible',
    } as any),
  },
  tooltipTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  tooltipItem: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
  },
  tooltipBullet: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
    marginTop: 1,
  },
  tooltipText: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 18,
    flex: 1,
  },
});
