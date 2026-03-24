import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Switch, ActivityIndicator, Platform } from 'react-native';
import { Plus, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import { useToast } from '~/components/ToastProvider';
import { DeleteConfirmationModal } from '~/components/ui/DeleteConfirmationModal';
import type {
  ReservationService,
  ReservationOverride,
  CreateReservationOverrideDto,
} from '~/types/reservation.types';

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];
const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

interface ReservationOverridesProps {
  reservation: {
    services: ReservationService[];
    overrides: ReservationOverride[];
    loadServices: () => Promise<ReservationService[]>;
    loadOverrides: (month?: number, year?: number) => Promise<ReservationOverride[]>;
    createOverride: (data: CreateReservationOverrideDto) => Promise<ReservationOverride>;
    deleteOverride: (id: string) => Promise<void>;
  };
}

export function ReservationOverrides({ reservation }: ReservationOverridesProps) {
  const now = new Date();
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formDate, setFormDate] = useState('');
  const [formIsClosed, setFormIsClosed] = useState(true);
  const [startHour, setStartHour] = useState('10');
  const [startMinute, setStartMinute] = useState('00');
  const [endHour, setEndHour] = useState('14');
  const [endMinute, setEndMinute] = useState('00');
  const [formServiceId, setFormServiceId] = useState<string>('');
  const [formReason, setFormReason] = useState('');
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [isSaving, setIsSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ReservationOverride | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { showToast } = useToast();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        reservation.loadServices(),
        reservation.loadOverrides(currentMonth, currentYear),
      ]);
    } catch {
      showToast('Erreur chargement', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [currentMonth, currentYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const navigateMonth = (direction: number) => {
    let newMonth = currentMonth + direction;
    let newYear = currentYear;
    if (newMonth < 1) { newMonth = 12; newYear--; }
    if (newMonth > 12) { newMonth = 1; newYear++; }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const handleCreate = async () => {
    if (!formDate) {
      showToast('La date est requise', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const data: CreateReservationOverrideDto = {
        date: formDate,
        isClosed: formIsClosed,
      };
      if (!formIsClosed) {
        data.startTime = `${startHour}:${startMinute}`;
        data.endTime = `${endHour}:${endMinute}`;
      }
      if (formServiceId) data.serviceId = formServiceId;
      if (formReason) data.reason = formReason;

      await reservation.createOverride(data);
      showToast('Fermeture ajoutée', 'success');
      setShowForm(false);
      setFormDate('');
      setFormReason('');
      setFormIsClosed(true);
      setStartHour('10');
      setStartMinute('00');
      setEndHour('14');
      setEndMinute('00');
      setFormServiceId('');
    } catch (error: any) {
      showToast(error?.response?.data?.error || 'Erreur lors de la création', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await reservation.deleteOverride(deleteTarget.id);
      showToast('Fermeture supprimée', 'success');
      setDeleteTarget(null);
    } catch {
      showToast('Erreur lors de la suppression', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const getCalendarDays = () => {
    const firstDay = new Date(calYear, calMonth, 1);
    // Monday-based: 0=Mon, 6=Sun
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
    setFormDate(`${calYear}-${m}-${d}`);
  };

  const navigateCalendar = (direction: number) => {
    let newMonth = calMonth + direction;
    let newYear = calYear;
    if (newMonth < 0) { newMonth = 11; newYear--; }
    if (newMonth > 11) { newMonth = 0; newYear++; }
    setCalMonth(newMonth);
    setCalYear(newYear);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getUTCDate();
    const month = MONTHS[date.getUTCMonth()];
    const year = date.getUTCFullYear();
    return `${day} ${month} ${year}`;
  };

  const getServiceName = (serviceId?: string | null) => {
    if (!serviceId) return 'Tous les services';
    return reservation.services.find(s => s.id === serviceId)?.name || 'Service inconnu';
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2A2E33" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.pageTitle}>Fermetures exceptionnelles</Text>
          <Text style={styles.pageSubtitle}>Jours fériés, vacances et horaires spéciaux</Text>
        </View>
        <Pressable style={styles.addButton} onPress={() => setShowForm(true)}>
          <Plus size={18} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Ajouter</Text>
        </Pressable>
      </View>

      {/* Month navigation */}
      <View style={styles.monthNav}>
        <Pressable onPress={() => navigateMonth(-1)} style={styles.monthButton}>
          <ChevronLeft size={20} color="#64748B" />
        </Pressable>
        <Text style={styles.monthText}>{MONTHS[currentMonth - 1]} {currentYear}</Text>
        <Pressable onPress={() => navigateMonth(1)} style={styles.monthButton}>
          <ChevronRight size={20} color="#64748B" />
        </Pressable>
      </View>

      {/* Form */}
      {showForm && (
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Nouvelle fermeture</Text>
            <Pressable onPress={() => setShowForm(false)}>
              <X size={20} color="#64748B" />
            </Pressable>
          </View>

          <View style={styles.formFields}>
            {/* Calendar date picker */}
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Date</Text>
              <View style={styles.calendarContainer}>
                <View style={styles.calendarNav}>
                  <Pressable onPress={() => navigateCalendar(-1)} style={styles.calendarNavButton}>
                    <ChevronLeft size={16} color="#64748B" />
                  </Pressable>
                  <Text style={styles.calendarNavText}>{MONTHS[calMonth]} {calYear}</Text>
                  <Pressable onPress={() => navigateCalendar(1)} style={styles.calendarNavButton}>
                    <ChevronRight size={16} color="#64748B" />
                  </Pressable>
                </View>
                <View style={styles.calendarWeekdays}>
                  {WEEKDAY_LABELS.map(label => (
                    <Text key={label} style={styles.calendarWeekdayText}>{label}</Text>
                  ))}
                </View>
                <View style={styles.calendarGrid}>
                  {getCalendarDays().map((day, i) => {
                    if (day === null) return <View key={`e-${i}`} style={styles.calendarDayEmpty} />;
                    const m = String(calMonth + 1).padStart(2, '0');
                    const d = String(day).padStart(2, '0');
                    const dateStr = `${calYear}-${m}-${d}`;
                    const isSelected = formDate === dateStr;
                    return (
                      <Pressable
                        key={`d-${day}`}
                        style={[styles.calendarDay, isSelected && styles.calendarDaySelected]}
                        onPress={() => selectCalendarDay(day)}
                      >
                        <Text style={[styles.calendarDayText, isSelected && styles.calendarDayTextSelected]}>
                          {day}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
              {formDate ? (
                <Text style={styles.selectedDateText}>Sélectionné : {formDate}</Text>
              ) : null}
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.fieldLabel}>Fermé toute la journée</Text>
              <Switch
                value={formIsClosed}
                onValueChange={setFormIsClosed}
                trackColor={{ false: '#D1D5DB', true: '#FECACA' }}
                thumbColor={formIsClosed ? '#EF4444' : '#9CA3AF'}
              />
            </View>

            {!formIsClosed && (
              <View style={styles.formRow}>
                <View style={[styles.formField, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Heure début de service</Text>
                  <View style={styles.timeRow}>
                    <View style={[styles.pickerContainer, { flex: 1 }]}>
                      <Picker selectedValue={startHour} onValueChange={setStartHour} style={styles.picker}>
                        {HOURS.map(h => <Picker.Item key={h} label={`${h}h`} value={h} />)}
                      </Picker>
                    </View>
                    <View style={[styles.pickerContainer, { flex: 1 }]}>
                      <Picker selectedValue={startMinute} onValueChange={setStartMinute} style={styles.picker}>
                        {MINUTES.map(m => <Picker.Item key={m} label={m} value={m} />)}
                      </Picker>
                    </View>
                  </View>
                </View>
                <View style={[styles.formField, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Heure fin de service</Text>
                  <View style={styles.timeRow}>
                    <View style={[styles.pickerContainer, { flex: 1 }]}>
                      <Picker selectedValue={endHour} onValueChange={setEndHour} style={styles.picker}>
                        {HOURS.map(h => <Picker.Item key={h} label={`${h}h`} value={h} />)}
                      </Picker>
                    </View>
                    <View style={[styles.pickerContainer, { flex: 1 }]}>
                      <Picker selectedValue={endMinute} onValueChange={setEndMinute} style={styles.picker}>
                        {MINUTES.map(m => <Picker.Item key={m} label={m} value={m} />)}
                      </Picker>
                    </View>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Service concerné (optionnel)</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formServiceId}
                  onValueChange={setFormServiceId}
                  style={styles.picker}
                >
                  <Picker.Item label="Tous les services" value="" />
                  {reservation.services.map((service) => (
                    <Picker.Item key={service.id} label={service.name} value={service.id} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Raison (optionnel)</Text>
              <TextInput
                style={styles.textInput}
                value={formReason}
                onChangeText={setFormReason}
                placeholder="Ex: Jour férié, Travaux..."
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View style={styles.formActions}>
            <Pressable
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleCreate}
              disabled={isSaving}
            >
              <Text style={styles.saveButtonText}>{isSaving ? 'Ajout...' : 'Ajouter'}</Text>
            </Pressable>
            <Pressable style={styles.cancelButton} onPress={() => setShowForm(false)}>
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Overrides list */}
      {reservation.overrides.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Aucune fermeture ce mois-ci</Text>
        </View>
      ) : (
        <View style={styles.overridesList}>
          {reservation.overrides.map((override) => (
            <View key={override.id} style={styles.overrideCard}>
              <View style={styles.overrideInfo}>
                <View style={styles.overrideHeader}>
                  <Text style={styles.overrideDate}>{formatDate(override.date)}</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: override.isClosed ? '#FEF2F2' : '#F0FDF4' }
                  ]}>
                    <Text style={[
                      styles.statusBadgeText,
                      { color: override.isClosed ? '#EF4444' : '#10B981' }
                    ]}>
                      {override.isClosed ? 'Fermé' : 'Horaires spéciaux'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.overrideDetails}>
                  {getServiceName(override.serviceId)}
                  {!override.isClosed && override.startTime && override.endTime
                    ? ` · ${override.startTime} - ${override.endTime}`
                    : ''}
                </Text>
                {override.reason && (
                  <Text style={styles.overrideReason}>{override.reason}</Text>
                )}
              </View>
              <Pressable style={styles.iconButton} onPress={() => setDeleteTarget(override)}>
                <Trash2 size={16} color="#EF4444" />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <DeleteConfirmationModal
        isVisible={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        entityName={deleteTarget ? formatDate(deleteTarget.date) : ''}
        entityType="la fermeture"
        isLoading={isDeleting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  pageTitle: { fontSize: 22, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  pageSubtitle: { fontSize: 14, color: '#64748B' },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2A2E33',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  addButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  monthButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  monthText: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  formCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  formTitle: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  formFields: { gap: 16 },
  formRow: { flexDirection: 'row', gap: 16 },
  formField: {},
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E293B',
  },
  timeRow: { flexDirection: 'row', gap: 8 },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    maxWidth: 280,
  },
  calendarNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarNavButton: {
    padding: 4,
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  calendarNavText: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  calendarWeekdays: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  calendarWeekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayEmpty: {
    width: '14.28%',
    height: 32,
  },
  calendarDay: {
    width: '14.28%',
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  calendarDaySelected: {
    backgroundColor: '#2A2E33',
  },
  calendarDayText: {
    fontSize: 13,
    color: '#1E293B',
  },
  calendarDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  selectedDateText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 44,
    ...(Platform.OS === 'web' && {
      paddingHorizontal: 12,
      fontSize: 14,
      borderWidth: 0,
    }),
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#2A2E33',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  cancelButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  cancelButtonText: { color: '#64748B', fontWeight: '600', fontSize: 14 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#94A3B8' },
  overridesList: { gap: 12 },
  overrideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  overrideInfo: { flex: 1 },
  overrideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  overrideDate: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '600' },
  overrideDetails: { fontSize: 13, color: '#64748B' },
  overrideReason: { fontSize: 13, color: '#94A3B8', fontStyle: 'italic', marginTop: 2 },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
});
