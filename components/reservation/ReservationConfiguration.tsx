import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Pressable, Platform, useWindowDimensions } from 'react-native';
import { Pencil, Trash2, Power, Users, Clock, CalendarOff, Plus, X as XIcon, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { SlidePanel } from '~/components/ui/SlidePanel';
import { DeleteConfirmationModal } from '~/components/ui/DeleteConfirmationModal';
import { usePanelPortal } from '~/hooks/usePanelPortal';
import { useToast } from '~/components/ToastProvider';
import { ServiceFormPanel } from '~/components/reservation/forms/ServiceFormPanel';
import { ScheduleFormPanel } from '~/components/reservation/forms/ScheduleFormPanel';
import { OverrideFormPanel } from '~/components/reservation/forms/OverrideFormPanel';
import type {
  ReservationService,
  ReservationSchedule,
  ReservationOverride,
  CreateReservationServiceDto,
  UpdateReservationServiceDto,
  CreateReservationScheduleDto,
  CreateReservationOverrideDto,
} from '~/types/reservation.types';

const DAYS = [
  { value: 1, short: 'Lun', label: 'Lundi' },
  { value: 2, short: 'Mar', label: 'Mardi' },
  { value: 3, short: 'Mer', label: 'Mercredi' },
  { value: 4, short: 'Jeu', label: 'Jeudi' },
  { value: 5, short: 'Ven', label: 'Vendredi' },
  { value: 6, short: 'Sam', label: 'Samedi' },
  { value: 7, short: 'Dim', label: 'Dimanche' },
];

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

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

type PanelType = 'service' | 'schedule' | 'override' | null;

export function ReservationConfiguration({ reservation }: ReservationConfigurationProps) {
  const { showToast } = useToast();
  const { renderPanel, clearPanel } = usePanelPortal();
  const { width } = useWindowDimensions();
  const isNarrow = width < 1280;
  const isCompact = width < 900;

  const [isLoading, setIsLoading] = useState(true);

  const [panelType, setPanelType] = useState<PanelType>(null);
  const [editingService, setEditingService] = useState<ReservationService | null>(null);
  const [initialOverrideDate, setInitialOverrideDate] = useState<string | undefined>(undefined);

  const [serviceToDelete, setServiceToDelete] = useState<ReservationService | null>(null);
  const [scheduleToDelete, setScheduleToDelete] = useState<ReservationSchedule | null>(null);
  const [overrideToDelete, setOverrideToDelete] = useState<ReservationOverride | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const now = new Date();
  const [overrideMonth] = useState(now.getMonth() + 1);
  const [overrideYear] = useState(now.getFullYear());

  useEffect(() => {
    Promise.all([
      reservation.loadServices(),
      reservation.loadSchedules(),
      reservation.loadOverrides(overrideMonth, overrideYear),
    ])
      .catch(() => showToast('Erreur de chargement', 'error'))
      .finally(() => setIsLoading(false));
  }, []);

  const getServiceName = useCallback((serviceId: string | null | undefined) => {
    if (!serviceId) return 'Tous les services';
    return reservation.services.find(s => s.id === serviceId)?.name || 'Service inconnu';
  }, [reservation.services]);

  const formatFullDate = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    const dayName = DAYS[(date.getUTCDay() + 6) % 7]?.label || '';
    return `${dayName} ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
  }, []);

  const handleClosePanel = useCallback(() => {
    setPanelType(null);
    setEditingService(null);
    setInitialOverrideDate(undefined);
    clearPanel();
  }, [clearPanel]);

  const openOverridePanel = useCallback((presetDate?: string) => {
    setInitialOverrideDate(presetDate);
    setPanelType('override');
  }, []);

  const handleSaveService = useCallback(async (data: CreateReservationServiceDto | UpdateReservationServiceDto) => {
    if (editingService) {
      await reservation.updateService(editingService.id, data);
      showToast('Service modifié', 'success');
    } else {
      await reservation.createService(data as CreateReservationServiceDto);
      showToast('Service créé', 'success');
    }
    handleClosePanel();
  }, [editingService, reservation, showToast, handleClosePanel]);

  const handleToggleServiceActive = useCallback(async (service: ReservationService) => {
    try {
      await reservation.updateService(service.id, { isActive: !service.isActive });
      showToast(service.isActive ? 'Service désactivé' : 'Service activé', 'success');
    } catch {
      showToast('Erreur', 'error');
    }
  }, [reservation, showToast]);

  const confirmDeleteService = useCallback(async () => {
    if (!serviceToDelete) return;
    setIsDeleting(true);
    try {
      await reservation.deleteService(serviceToDelete.id);
      showToast('Service supprimé', 'success');
      setServiceToDelete(null);
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Erreur', 'error');
    } finally {
      setIsDeleting(false);
    }
  }, [serviceToDelete, reservation, showToast]);

  const handleSaveSchedule = useCallback(async (data: CreateReservationScheduleDto) => {
    await reservation.createSchedule(data);
    showToast('Créneau ajouté', 'success');
    handleClosePanel();
  }, [reservation, showToast, handleClosePanel]);

  const confirmDeleteSchedule = useCallback(async () => {
    if (!scheduleToDelete) return;
    setIsDeleting(true);
    try {
      await reservation.deleteSchedule(scheduleToDelete.id);
      showToast('Créneau supprimé', 'success');
      setScheduleToDelete(null);
    } catch {
      showToast('Erreur lors de la suppression', 'error');
    } finally {
      setIsDeleting(false);
    }
  }, [scheduleToDelete, reservation, showToast]);

  const handleSaveOverride = useCallback(async (data: CreateReservationOverrideDto) => {
    await reservation.createOverride(data);
    showToast('Fermeture ajoutée', 'success');
    handleClosePanel();
  }, [reservation, showToast, handleClosePanel]);

  const confirmDeleteOverride = useCallback(async () => {
    if (!overrideToDelete) return;
    setIsDeleting(true);
    try {
      await reservation.deleteOverride(overrideToDelete.id);
      showToast('Fermeture supprimée', 'success');
      setOverrideToDelete(null);
    } catch {
      showToast('Erreur lors de la suppression', 'error');
    } finally {
      setIsDeleting(false);
    }
  }, [overrideToDelete, reservation, showToast]);

  useEffect(() => {
    if (panelType === 'service') {
      renderPanel(
        <SlidePanel visible={true} onClose={handleClosePanel} width={430}>
          <ServiceFormPanel
            service={editingService}
            onSave={handleSaveService}
            onCancel={handleClosePanel}
          />
        </SlidePanel>
      );
    } else if (panelType === 'schedule') {
      renderPanel(
        <SlidePanel visible={true} onClose={handleClosePanel} width={430}>
          <ScheduleFormPanel
            services={reservation.services}
            onSave={handleSaveSchedule}
            onCancel={handleClosePanel}
          />
        </SlidePanel>
      );
    } else if (panelType === 'override') {
      renderPanel(
        <SlidePanel visible={true} onClose={handleClosePanel} width={460}>
          <OverrideFormPanel
            services={reservation.services}
            existingOverrides={reservation.overrides}
            onSave={handleSaveOverride}
            onCancel={handleClosePanel}
            initialDate={initialOverrideDate}
          />
        </SlidePanel>
      );
    } else {
      clearPanel();
    }
  }, [panelType, editingService, initialOverrideDate, reservation.services, reservation.overrides, handleClosePanel, renderPanel, clearPanel, handleSaveService, handleSaveSchedule, handleSaveOverride]);

  const schedulesByDay = useMemo(() => {
    const map: Record<number, ReservationSchedule[]> = {};
    DAYS.forEach(d => { map[d.value] = []; });
    reservation.schedules.forEach(s => {
      if (map[s.dayOfWeek]) map[s.dayOfWeek].push(s);
    });
    Object.values(map).forEach(arr => arr.sort((a, b) => a.startTime.localeCompare(b.startTime)));
    return map;
  }, [reservation.schedules]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2A2E33" />
      </View>
    );
  }

  const noServices = reservation.services.length === 0;

  return (
    <View style={styles.container}>
      <View style={[styles.body, isCompact && styles.bodyCompact]}>
        {/* Top row : Services + Fermetures */}
        <View style={[styles.topRow, isNarrow && styles.topRowStacked]}>
          {/* Services */}
          <SectionCard
            title="Services"
            subtitle="Périodes d'ouverture de votre restaurant"
            actionLabel="Nouveau service"
            onAction={() => { setEditingService(null); setPanelType('service'); }}
          >
            {reservation.services.length === 0 ? (
              <EmptyState
                icon={<Users size={28} color="#94A3B8" strokeWidth={1.5} />}
                title="Aucun service configuré"
                text="Créez votre premier service pour commencer"
                actionLabel="Créer un service"
                onAction={() => { setEditingService(null); setPanelType('service'); }}
              />
            ) : (
              <ScrollView
                style={styles.list}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              >
                {reservation.services.map(service => (
                  <ServiceListItem
                    key={service.id}
                    service={service}
                    onEdit={() => { setEditingService(service); setPanelType('service'); }}
                    onToggleActive={() => handleToggleServiceActive(service)}
                    onDelete={() => setServiceToDelete(service)}
                  />
                ))}
              </ScrollView>
            )}
          </SectionCard>

          {/* Fermetures */}
          <SectionCard
            title="Fermetures exceptionnelles"
            subtitle="Jours fériés, vacances et horaires spéciaux"
            actionLabel="Nouvelle fermeture"
            onAction={() => openOverridePanel()}
            actionDisabled={noServices}
          >
            {noServices ? (
              <EmptyState
                icon={<CalendarOff size={28} color="#94A3B8" strokeWidth={1.5} />}
                title="Créez d'abord un service"
                text="Aucun service à fermer pour le moment"
              />
            ) : (
              <View style={styles.overridesScroll}>
                <OverridesCalendar
                  overrides={reservation.overrides}
                  getServiceName={getServiceName}
                  formatFullDate={formatFullDate}
                  onAddForDate={(d) => openOverridePanel(d)}
                  onDeleteOverride={(o) => setOverrideToDelete(o)}
                />
              </View>
            )}
          </SectionCard>
        </View>

        {/* Horaires d'ouverture — pleine largeur */}
        <SectionCard
          title="Horaires d'ouverture"
          subtitle="Définissez les créneaux de réservation pour chaque jour"
          actionLabel="Nouveau créneau"
          onAction={() => setPanelType('schedule')}
          actionDisabled={noServices}
          bodyFixed
        >
          {noServices ? (
            <EmptyState
              icon={<Clock size={28} color="#94A3B8" strokeWidth={1.5} />}
              title="Créez d'abord un service"
              text="Vous devez avoir au moins un service pour définir des horaires"
            />
          ) : (
            <WeeklyCalendar
              schedulesByDay={schedulesByDay}
              getServiceName={getServiceName}
              onDeleteSchedule={(s) => setScheduleToDelete(s)}
              isCompact={isCompact}
            />
          )}
        </SectionCard>
      </View>

      <DeleteConfirmationModal
        isVisible={!!serviceToDelete}
        onClose={() => setServiceToDelete(null)}
        onConfirm={confirmDeleteService}
        entityName={serviceToDelete?.name || ''}
        entityType="le service"
        isLoading={isDeleting}
      />
      <DeleteConfirmationModal
        isVisible={!!scheduleToDelete}
        onClose={() => setScheduleToDelete(null)}
        onConfirm={confirmDeleteSchedule}
        entityName={scheduleToDelete ? `${getServiceName(scheduleToDelete.serviceId)} – ${DAYS.find(d => d.value === scheduleToDelete.dayOfWeek)?.label}` : ''}
        entityType="le créneau"
        isLoading={isDeleting}
      />
      <DeleteConfirmationModal
        isVisible={!!overrideToDelete}
        onClose={() => setOverrideToDelete(null)}
        onConfirm={confirmDeleteOverride}
        entityName={overrideToDelete ? formatFullDate(overrideToDelete.date) : ''}
        entityType="la fermeture"
        isLoading={isDeleting}
      />
    </View>
  );
}

// ===========================================================================
// SectionCard — carte blanche avec header (titre + sous-titre + action)
// ===========================================================================

interface SectionCardProps {
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  bodyFixed?: boolean;
  children: React.ReactNode;
}

function SectionCard({ title, subtitle, actionLabel, onAction, actionDisabled, bodyFixed, children }: SectionCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle} numberOfLines={1}>{title}</Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>{subtitle}</Text>
        </View>
        {actionLabel && onAction && (
          <Pressable
            onPress={actionDisabled ? undefined : onAction}
            disabled={actionDisabled}
            style={({ hovered, pressed }: any) => [
              styles.createButton,
              (hovered || pressed) && !actionDisabled && styles.createButtonHover,
              actionDisabled && styles.createButtonDisabled,
            ]}
          >
            <Plus size={15} color="#FFFFFF" strokeWidth={2.2} />
            <Text style={styles.createButtonText}>{actionLabel}</Text>
          </Pressable>
        )}
      </View>
      <View style={[styles.cardBody, bodyFixed && styles.cardBodyFixed]}>{children}</View>
    </View>
  );
}

// ===========================================================================
// Empty state
// ===========================================================================

function EmptyState({ icon, title, text, actionLabel, onAction }: {
  icon: React.ReactNode;
  title: string;
  text: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.emptyState}>
      {icon}
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          style={({ hovered, pressed }: any) => [
            styles.emptyButton,
            (hovered || pressed) && styles.emptyButtonHover,
          ]}
        >
          <Plus size={16} color="#1E293B" strokeWidth={2} />
          <Text style={styles.emptyButtonText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

// ===========================================================================
// Service list item
// ===========================================================================

interface ServiceListItemProps {
  service: ReservationService;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

function ServiceListItem({ service, onEdit, onToggleActive, onDelete }: ServiceListItemProps) {
  const isActive = service.isActive;
  const meta = `${service.maxCapacity} couverts · Créneaux ${service.slotIntervalMinutes} min · Durée ${formatDuration(service.serviceDurationMinutes)}`;
  return (
    <View style={[styles.listItem, isActive ? styles.serviceItemActive : styles.serviceItemInactive]}>
      <View style={[styles.serviceAccentBar, !isActive && { backgroundColor: '#CBD5E1' }]} />
      <View style={[styles.listItemIcon, isActive ? styles.serviceIconActive : styles.serviceIconInactive]}>
        <Users size={18} color={isActive ? '#3B82F6' : '#94A3B8'} strokeWidth={2} />
      </View>
      <View style={styles.listItemContent}>
        <View style={styles.listItemTitleRow}>
          <Text style={styles.listItemTitle} numberOfLines={1}>{service.name}</Text>
          {!isActive && <Text style={styles.inactivePill}>Inactif</Text>}
        </View>
        <Text style={styles.serviceMeta} numberOfLines={1}>{meta}</Text>
      </View>
      <View style={styles.listItemActions}>
        <Pressable
          onPress={onToggleActive}
          style={({ hovered, pressed }: any) => [
            styles.iconButton,
            (hovered || pressed) && styles.iconButtonHover,
          ]}
        >
          <Power size={14} color={isActive ? '#10B981' : '#94A3B8'} strokeWidth={2} />
        </Pressable>
        <Pressable
          onPress={onEdit}
          style={({ hovered, pressed }: any) => [
            styles.iconButton,
            (hovered || pressed) && styles.iconButtonHover,
          ]}
        >
          <Pencil size={14} color="#64748B" strokeWidth={2} />
        </Pressable>
        <Pressable
          onPress={onDelete}
          style={({ hovered, pressed }: any) => [
            styles.iconButton,
            (hovered || pressed) && styles.iconButtonDangerHover,
          ]}
        >
          <Trash2 size={14} color="#EF4444" strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  );
}

// ===========================================================================
// Overrides monthly calendar
// ===========================================================================

interface OverridesCalendarProps {
  overrides: ReservationOverride[];
  getServiceName: (id: string | null | undefined) => string;
  formatFullDate: (dateStr: string) => string;
  onAddForDate: (date: string) => void;
  onDeleteOverride: (o: ReservationOverride) => void;
}

function OverridesCalendar({ overrides, getServiceName, formatFullDate, onAddForDate, onDeleteOverride }: OverridesCalendarProps) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const overridesByDate = useMemo(() => {
    const map: Record<string, ReservationOverride[]> = {};
    for (const o of overrides) {
      const key = o.date.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(o);
    }
    return map;
  }, [overrides]);

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const startWeekday = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const arr: (number | null)[] = Array(startWeekday).fill(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [month, year]);

  const navigate = (d: number) => {
    let m = month + d;
    let y = year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setMonth(m);
    setYear(y);
    setSelectedDate(null);
  };

  const selectedOverrides = selectedDate ? overridesByDate[selectedDate] || [] : [];

  return (
    <View style={styles.overridesCalRoot}>
      <View style={styles.overridesCalNav}>
        <Pressable onPress={() => navigate(-1)} style={styles.overridesCalNavBtn}>
          <ChevronLeft size={16} color="#64748B" />
        </Pressable>
        <Text style={styles.overridesCalNavText}>{MONTHS[month]} {year}</Text>
        <Pressable onPress={() => navigate(1)} style={styles.overridesCalNavBtn}>
          <ChevronRight size={16} color="#64748B" />
        </Pressable>
      </View>

      <View style={styles.overridesCalWeekdays}>
        {DAYS.map(d => (
          <Text key={d.value} style={styles.overridesCalWeekdayText}>{d.short}</Text>
        ))}
      </View>

      <View style={styles.overridesCalGridWrapper}>
        <View style={styles.overridesCalGrid} pointerEvents={selectedDate ? 'none' : 'auto'}>
          {days.map((day, i) => {
            if (day === null) return <View key={`e-${i}`} style={styles.overridesCalDayEmpty} />;
            const m = String(month + 1).padStart(2, '0');
            const d = String(day).padStart(2, '0');
            const dateStr = `${year}-${m}-${d}`;
            const dayOverrides = overridesByDate[dateStr] || [];
            const hasClosed = dayOverrides.some(o => o.isClosed);
            const hasSpecial = dayOverrides.some(o => !o.isClosed);
            const isSelected = selectedDate === dateStr;
            const isToday = dateStr === todayStr;

            return (
              <Pressable
                key={`d-${i}`}
                onPress={() => setSelectedDate(dateStr)}
                style={({ hovered }: any) => [
                  styles.overridesCalDay,
                  hovered && !isSelected && styles.overridesCalDayHover,
                  isToday && !isSelected && styles.overridesCalDayToday,
                  isSelected && styles.overridesCalDaySelected,
                ]}
              >
                <Text style={[
                  styles.overridesCalDayText,
                  isSelected && styles.overridesCalDayTextSelected,
                  isToday && !isSelected && styles.overridesCalDayTextToday,
                ]}>
                  {day}
                </Text>
                {(hasClosed || hasSpecial) && (
                  <View style={styles.overridesCalDots}>
                    {hasClosed && <View style={[styles.overridesCalDot, { backgroundColor: '#EF4444' }]} />}
                    {hasSpecial && <View style={[styles.overridesCalDot, { backgroundColor: '#F59E0B' }]} />}
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.overridesCalLegend}>
        <View style={styles.overridesCalLegendItem}>
          <View style={[styles.overridesCalDot, { backgroundColor: '#EF4444' }]} />
          <Text style={styles.overridesCalLegendText}>Fermé</Text>
        </View>
        <View style={styles.overridesCalLegendItem}>
          <View style={[styles.overridesCalDot, { backgroundColor: '#F59E0B' }]} />
          <Text style={styles.overridesCalLegendText}>Horaire spécial</Text>
        </View>
      </View>

      {selectedDate && (
        <View style={styles.overridesPopoverLayer} pointerEvents="box-none">
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setSelectedDate(null)}
          />
            <View style={styles.overridesPopover}>
              <View style={styles.overridesPopoverHeader}>
                <Text style={styles.overridesPopoverTitle} numberOfLines={1}>
                  {formatFullDate(selectedDate)}
                </Text>
                <Pressable onPress={() => setSelectedDate(null)} hitSlop={6} style={styles.overridesPopoverClose}>
                  <XIcon size={14} color="#94A3B8" strokeWidth={2} />
                </Pressable>
              </View>

              <ScrollView
                style={styles.overridesPopoverScroll}
                contentContainerStyle={styles.overridesPopoverScrollContent}
                showsVerticalScrollIndicator={false}
              >
              {selectedOverrides.length === 0 ? (
                <Pressable
                  onPress={() => onAddForDate(selectedDate)}
                  style={({ hovered, pressed }: any) => [
                    styles.overridesDetailAdd,
                    (hovered || pressed) && styles.overridesDetailAddHover,
                  ]}
                >
                  <Plus size={14} color="#1E293B" strokeWidth={2} />
                  <Text style={styles.overridesDetailAddText}>Ajouter une fermeture</Text>
                </Pressable>
              ) : (
                <>
                  {selectedOverrides.map(o => {
                    const accent = o.isClosed ? '#EF4444' : '#F59E0B';
                    return (
                      <View key={o.id} style={styles.overridesDetailItem}>
                        <View style={[styles.overridesDetailAccent, { backgroundColor: accent }]} />
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={styles.overridesDetailItemTitle} numberOfLines={1}>
                            {o.isClosed ? 'Fermé' : `Horaire spécial · ${o.startTime} – ${o.endTime}`}
                          </Text>
                          <Text style={styles.overridesDetailItemMeta} numberOfLines={1}>
                            {getServiceName(o.serviceId)}{o.reason ? ` · ${o.reason}` : ''}
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => onDeleteOverride(o)}
                          style={({ hovered, pressed }: any) => [
                            styles.iconButton,
                            (hovered || pressed) && styles.iconButtonDangerHover,
                          ]}
                        >
                          <Trash2 size={13} color="#EF4444" strokeWidth={2} />
                        </Pressable>
                      </View>
                    );
                  })}
                  <Pressable
                    onPress={() => onAddForDate(selectedDate)}
                    style={({ hovered, pressed }: any) => [
                      styles.overridesDetailAdd,
                      (hovered || pressed) && styles.overridesDetailAddHover,
                    ]}
                  >
                    <Plus size={14} color="#1E293B" strokeWidth={2} />
                    <Text style={styles.overridesDetailAddText}>Ajouter</Text>
                  </Pressable>
                </>
              )}
              </ScrollView>
            </View>
        </View>
      )}
    </View>
  );
}

// ===========================================================================
// Weekly calendar (grid 7 colonnes, style neutre)
// ===========================================================================

interface WeeklyCalendarProps {
  schedulesByDay: Record<number, ReservationSchedule[]>;
  getServiceName: (id: string | null | undefined) => string;
  onDeleteSchedule: (s: ReservationSchedule) => void;
  isCompact?: boolean;
}

function WeeklyCalendar({ schedulesByDay, getServiceName, onDeleteSchedule, isCompact }: WeeklyCalendarProps) {
  const inner = (
    <View style={[styles.calendarContainer, isCompact && styles.calendarContainerCompact]}>
      {DAYS.map((day, idx) => {
        const slots = schedulesByDay[day.value] || [];
        const isLast = idx === DAYS.length - 1;
        return (
          <View
            key={day.value}
            style={[
              styles.calendarColumn,
              isCompact && styles.calendarColumnCompact,
              !isLast && styles.calendarColumnDivider,
            ]}
          >
            <View style={styles.calendarColumnHeader}>
              <Text style={styles.calendarDayName}>{day.short}</Text>
              <Text style={styles.calendarDayCount}>
                {slots.length === 0 ? 'Fermé' : `${slots.length} créneau${slots.length > 1 ? 'x' : ''}`}
              </Text>
            </View>

            <ScrollView style={styles.calendarColumnScroll} contentContainerStyle={styles.calendarColumnBody}>
              {slots.map(slot => (
                <CalendarSlot
                  key={slot.id}
                  slot={slot}
                  serviceName={getServiceName(slot.serviceId)}
                  onDelete={() => onDeleteSchedule(slot)}
                />
              ))}
            </ScrollView>
          </View>
        );
      })}
    </View>
  );

  if (isCompact) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.calendarHorizontalScroll}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {inner}
      </ScrollView>
    );
  }
  return inner;
}

interface CalendarSlotProps {
  slot: ReservationSchedule;
  serviceName: string;
  onDelete: () => void;
}

function CalendarSlot({ slot, serviceName, onDelete }: CalendarSlotProps) {
  const [hovered, setHovered] = useState(false);
  const showDelete = hovered || Platform.OS !== 'web';

  return (
    <View
      style={styles.calendarSlot}
      onPointerEnter={Platform.OS === 'web' ? () => setHovered(true) : undefined}
      onPointerLeave={Platform.OS === 'web' ? () => setHovered(false) : undefined}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.calendarSlotService} numberOfLines={1}>{serviceName}</Text>
        <Text style={styles.calendarSlotTime} numberOfLines={1} ellipsizeMode="clip">
          {slot.startTime}–{slot.endTime}
        </Text>
      </View>
      {showDelete && (
        <Pressable onPress={onDelete} hitSlop={8} style={styles.calendarSlotDelete}>
          <XIcon size={13} color="#94A3B8" strokeWidth={2} />
        </Pressable>
      )}
    </View>
  );
}

// ===========================================================================
// Styles
// ===========================================================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },

  body: {
    flex: 1,
    padding: 24,
    gap: 16,
  },
  bodyCompact: {
    padding: 16,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    gap: 16,
    minHeight: 280,
    maxHeight: 340,
  },
  topRowStacked: {
    flexDirection: 'column',
    maxHeight: undefined as any,
  },

  // ── Card (section) ────────────────────────────────────────────────────
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    minWidth: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cardHeaderText: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B', marginBottom: 2 },
  cardSubtitle: { fontSize: 13, color: '#64748B' },
  cardBody: { flex: 1, padding: 16, minHeight: 0 },
  cardBodyFixed: { padding: 16 },

  // ── Create button (dark neutre) ───────────────────────────────────────
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: '#2A2E33',
    borderRadius: 8,
    minHeight: 38,
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  createButtonHover: { backgroundColor: '#1E293B' },
  createButtonDisabled: { opacity: 0.4, ...(Platform.OS === 'web' && { cursor: 'not-allowed' } as any) },
  createButtonText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },

  // ── Empty state ───────────────────────────────────────────────────────
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    gap: 4,
  },
  emptyTitle: { fontSize: 14, fontWeight: '600', color: '#64748B', marginTop: 12 },
  emptyText: { fontSize: 12, color: '#94A3B8', textAlign: 'center', maxWidth: 260, marginBottom: 8 },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4,
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  emptyButtonHover: { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' },
  emptyButtonText: { fontSize: 13, fontWeight: '600', color: '#1E293B' },

  // ── List ──────────────────────────────────────────────────────────────
  list: { flex: 1 },
  listContent: { gap: 10, paddingBottom: 4 },

  // ── List item (inspiré de configuration.tsx tagItem) ──────────────────
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    paddingLeft: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    overflow: 'hidden',
  },
  serviceItemActive: {
    borderColor: '#DBEAFE',
  },
  serviceItemInactive: {
    borderColor: '#E2E8F0',
    backgroundColor: '#FAFBFC',
  },
  serviceAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#3B82F6',
  },
  listItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceIconActive: {
    backgroundColor: '#DBEAFE',
  },
  serviceIconInactive: {
    backgroundColor: '#F1F5F9',
  },
  listItemContent: { flex: 1, minWidth: 0, gap: 3 },
  listItemTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  listItemTitle: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  serviceMeta: { fontSize: 12, color: '#94A3B8' },
  inactivePill: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  listItemMeta: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  listItemNote: { fontSize: 12, color: '#94A3B8', fontStyle: 'italic', marginTop: 2 },
  listItemActions: { flexDirection: 'row', gap: 4, alignItems: 'center' },

  // ── Badges neutres ────────────────────────────────────────────────────
  mutedBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  mutedBadgeText: { fontSize: 11, fontWeight: '600', color: '#64748B' },

  // ── Boutons neutres ───────────────────────────────────────────────────
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  iconButtonHover: { backgroundColor: '#E2E8F0' },
  iconButtonDangerHover: { backgroundColor: '#FEF2F2' },

  // ── Calendrier hebdomadaire (neutre) ──────────────────────────────────
  calendarContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  calendarContainerCompact: {
    flex: 0,
    minWidth: 7 * 110,
  },
  calendarHorizontalScroll: {
    flex: 1,
  },
  calendarColumn: { flex: 1, minWidth: 0, flexDirection: 'column' },
  calendarColumnCompact: { flex: 0, width: 110 },
  calendarColumnDivider: { borderRightWidth: 1, borderRightColor: '#F1F5F9' },
  calendarColumnHeader: {
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    alignItems: 'center',
    gap: 2,
  },
  calendarDayName: { fontSize: 12, fontWeight: '700', color: '#1E293B', textTransform: 'uppercase', letterSpacing: 0.4 },
  calendarDayCount: { fontSize: 10, color: '#94A3B8', fontWeight: '500' },

  calendarColumnScroll: { flex: 1 },
  calendarColumnBody: { padding: 6, paddingBottom: 12, gap: 5 },
  calendarSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
    minHeight: 44,
  },
  calendarSlotService: { fontSize: 11, fontWeight: '700', color: '#1E293B' },
  calendarSlotTime: { fontSize: 10, color: '#64748B', marginTop: 2, fontVariant: ['tabular-nums'] },
  calendarSlotDelete: {
    width: 22,
    height: 22,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Overrides monthly calendar ────────────────────────────────────────
  overridesScroll: { flex: 1, overflow: 'hidden' },
  overridesCalRoot: {
    flex: 1,
    gap: 6,
    position: 'relative',
  },
  overridesCalNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  overridesCalNavBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    ...(Platform.OS === 'web' && { cursor: 'pointer' as any }),
  },
  overridesCalNavText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    textTransform: 'capitalize',
  },
  overridesCalWeekdays: {
    flexDirection: 'row',
    paddingHorizontal: 2,
  },
  overridesCalWeekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  overridesCalGridWrapper: {
    position: 'relative',
  },
  overridesCalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  overridesPopoverLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  overridesPopover: {
    width: '85%',
    maxWidth: 220,
    maxHeight: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 8,
    gap: 4,
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 8px 24px rgba(15, 23, 42, 0.15)',
    } as any : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 12,
    }),
  },
  overridesPopoverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  overridesPopoverTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
    textTransform: 'capitalize',
  },
  overridesPopoverClose: {
    width: 22,
    height: 22,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' && { cursor: 'pointer' as any }),
  },
  overridesPopoverScroll: {
    flexShrink: 1,
  },
  overridesPopoverScrollContent: {
    gap: 8,
    paddingBottom: 2,
  },
  overridesCalDayEmpty: {
    width: '14.2857%',
    height: 28,
  },
  overridesCalDay: {
    width: '14.2857%',
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    ...(Platform.OS === 'web' && { cursor: 'pointer' as any }),
  },
  overridesCalDayHover: {
    backgroundColor: '#F1F5F9',
  },
  overridesCalDayToday: {
    backgroundColor: '#EFF6FF',
  },
  overridesCalDaySelected: {
    backgroundColor: '#1E293B',
  },
  overridesCalDayText: {
    fontSize: 12,
    color: '#1E293B',
    fontVariant: ['tabular-nums'],
  },
  overridesCalDayTextToday: {
    color: '#3B82F6',
    fontWeight: '700',
  },
  overridesCalDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  overridesCalDots: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  overridesCalDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  overridesCalLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  overridesCalLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  overridesCalLegendText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  overridesDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    overflow: 'hidden',
  },
  overridesDetailAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  overridesDetailItemTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 4,
  },
  overridesDetailItemMeta: {
    fontSize: 11,
    color: '#94A3B8',
    marginLeft: 4,
    marginTop: 1,
  },
  overridesDetailAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    ...(Platform.OS === 'web' && { cursor: 'pointer' as any }),
  },
  overridesDetailAddHover: {
    backgroundColor: '#F1F5F9',
    borderColor: '#94A3B8',
  },
  overridesDetailAddText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
});
