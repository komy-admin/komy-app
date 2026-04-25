import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Pressable, Platform, useWindowDimensions } from 'react-native';
import { Pencil, Trash2, Power, Users, Clock, CalendarOff, Plus, X as XIcon, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { SlidePanel } from '~/components/ui/SlidePanel';
import { usePanelPortal } from '~/hooks/usePanelPortal';
import { useToast } from '~/components/ToastProvider';
import { ServiceFormPanel } from '~/components/reservation/forms/ServiceFormPanel';
import { ScheduleFormPanel } from '~/components/reservation/forms/ScheduleFormPanel';
import { OverrideFormPanel } from '~/components/reservation/forms/OverrideFormPanel';
import { DeleteConfirmPanel } from '~/components/ui/DeleteConfirmPanel';
import { getColorWithOpacity } from '~/lib/color-utils';
import { colors, shadows } from '~/theme';
import type {
  ReservationService,
  ReservationSchedule,
  ReservationOverride,
  CreateReservationServiceDto,
  UpdateReservationServiceDto,
  CreateReservationScheduleDto,
  CreateReservationOverrideDto,
} from '~/types/reservation.types';
import { nowInTz, todayIsoInTz } from '~/lib/date.utils';

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
    profile: { timezone: string } | null;
    services: ReservationService[];
    schedules: ReservationSchedule[];
    overrides: ReservationOverride[];
    loadProfile: () => Promise<unknown>;
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
  const isStacked = width < 1024;
  const isMobile = width < 640;

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
      reservation.loadProfile().catch(() => null),
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
            timezone={reservation.profile?.timezone}
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
        <ActivityIndicator size="large" color={colors.brand.dark} />
      </View>
    );
  }

  const noServices = reservation.services.length === 0;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, isMobile && styles.scrollContentMobile]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.tabHeader}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.tabTitle}>Configuration</Text>
            <Text style={styles.tabSubtitle}>Services, horaires et fermetures de votre établissement</Text>
          </View>
        </View>

        {/* Top row : Services + Fermetures */}
        <View style={[styles.topRow, isStacked && styles.topRowStacked]}>
          <SectionCard
            icon={<Users size={24} color={colors.brand.dark} strokeWidth={2} />}
            title="Services"
            subtitle="Périodes d'ouverture"
            actionLabel="Ajouter"
            onAction={() => { setEditingService(null); setPanelType('service'); }}
          >
            {reservation.services.length === 0 ? (
              <EmptyState
                icon={<Users size={36} color={colors.neutral[300]} strokeWidth={1.5} />}
                title="Aucun service configuré"
                text="Créez votre premier service pour commencer"
                actionLabel="Créer un service"
                onAction={() => { setEditingService(null); setPanelType('service'); }}
              />
            ) : (
              <View style={styles.list}>
                {reservation.services.map(service => (
                  <ServiceListItem
                    key={service.id}
                    service={service}
                    onEdit={() => { setEditingService(service); setPanelType('service'); }}
                    onToggleActive={() => handleToggleServiceActive(service)}
                    onDelete={() => setServiceToDelete(service)}
                  />
                ))}
              </View>
            )}
          </SectionCard>

          <SectionCard
            icon={<CalendarOff size={24} color={colors.brand.dark} strokeWidth={2} />}
            title="Fermetures"
            subtitle="Jours fériés et horaires spéciaux"
            actionLabel="Ajouter"
            onAction={() => openOverridePanel()}
            actionDisabled={noServices}
          >
            {noServices ? (
              <EmptyState
                icon={<CalendarOff size={36} color={colors.neutral[300]} strokeWidth={1.5} />}
                title="Créez d'abord un service"
                text="Aucun service à fermer pour le moment"
              />
            ) : (
              <OverridesCalendar
                overrides={reservation.overrides}
                getServiceName={getServiceName}
                formatFullDate={formatFullDate}
                timezone={reservation.profile?.timezone}
                onAddForDate={(d) => openOverridePanel(d)}
                onDeleteOverride={(o) => setOverrideToDelete(o)}
              />
            )}
          </SectionCard>
        </View>

        {/* Horaires d'ouverture */}
        <SectionCard
          icon={<Clock size={24} color={colors.brand.dark} strokeWidth={2} />}
          title="Horaires d'ouverture"
          subtitle="Définissez les créneaux de réservation pour chaque jour"
          actionLabel="Ajouter"
          onAction={() => setPanelType('schedule')}
          actionDisabled={noServices}
        >
          {noServices ? (
            <EmptyState
              icon={<Clock size={36} color={colors.neutral[300]} strokeWidth={1.5} />}
              title="Créez d'abord un service"
              text="Vous devez avoir au moins un service pour définir des horaires"
            />
          ) : (
            <WeeklyCalendar
              schedulesByDay={schedulesByDay}
              getServiceName={getServiceName}
              onDeleteSchedule={(s) => setScheduleToDelete(s)}
              isMobile={isMobile}
            />
          )}
        </SectionCard>
      </ScrollView>

      {/* Delete modals */}
      <DeleteConfirmPanel
        visible={!!serviceToDelete}
        onClose={() => setServiceToDelete(null)}
        onConfirm={confirmDeleteService}
        entityName={`"${serviceToDelete?.name || ''}"`}
        entityType="le service"
        isLoading={isDeleting}
      />
      <DeleteConfirmPanel
        visible={!!scheduleToDelete}
        onClose={() => setScheduleToDelete(null)}
        onConfirm={confirmDeleteSchedule}
        entityName={`"${scheduleToDelete ? `${getServiceName(scheduleToDelete.serviceId)} - ${DAYS.find(d => d.value === scheduleToDelete.dayOfWeek)?.label}` : ''}"`}
        entityType="le créneau"
        isLoading={isDeleting}
      />
      <DeleteConfirmPanel
        visible={!!overrideToDelete}
        onClose={() => setOverrideToDelete(null)}
        onConfirm={confirmDeleteOverride}
        entityName={`"${overrideToDelete ? formatFullDate(overrideToDelete.date) : ''}"`}
        entityType="la fermeture"
        isLoading={isDeleting}
      />
    </View>
  );
}

// ===========================================================================
// SectionCard — viewCard pattern (icon + title + action)
// ===========================================================================

interface SectionCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  children: React.ReactNode;
}

function SectionCard({ icon, title, subtitle, actionLabel, onAction, actionDisabled, children }: SectionCardProps) {
  return (
    <View style={styles.viewCard}>
      <View style={styles.viewCardHeader}>
        <View style={styles.viewIconWrapper}>{icon}</View>
        <View style={styles.viewCardContent}>
          <Text style={styles.viewCardTitle} numberOfLines={1}>{title}</Text>
          <Text style={styles.viewCardDescription} numberOfLines={2}>{subtitle}</Text>
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
            <Plus size={16} color={colors.white} strokeWidth={2.2} />
            <Text style={styles.createButtonText}>{actionLabel}</Text>
          </Pressable>
        )}
      </View>
      <View style={styles.viewModeSection}>{children}</View>
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
      <Text style={styles.emptyStateTitle}>{title}</Text>
      <Text style={styles.emptyStateText}>{text}</Text>
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          style={({ hovered, pressed }: any) => [
            styles.emptyStateButton,
            (hovered || pressed) && styles.emptyStateButtonHover,
          ]}
        >
          <Plus size={16} color={colors.brand.dark} strokeWidth={2} />
          <Text style={styles.emptyStateButtonText}>{actionLabel}</Text>
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
    <View style={[styles.tagItem, !isActive && styles.tagItemInactive]}>
      <View style={styles.tagItemHeader}>
        <View style={[styles.tagItemIcon, !isActive && styles.tagItemIconInactive]}>
          <Users size={20} color={isActive ? colors.brand.dark : colors.neutral[400]} strokeWidth={2} />
        </View>
        <View style={styles.tagItemContent}>
          <View style={styles.tagItemTitleRow}>
            <Text style={styles.tagItemTitle} numberOfLines={1}>{service.name}</Text>
            {!isActive && (
              <View style={styles.inactiveBadge}>
                <Text style={styles.inactiveBadgeText}>Inactif</Text>
              </View>
            )}
          </View>
          <Text style={styles.tagItemMeta} numberOfLines={2}>{meta}</Text>
        </View>
        <View style={styles.tagItemActions}>
          <Pressable
            onPress={onToggleActive}
            style={({ hovered, pressed }: any) => [
              styles.iconActionButton,
              (hovered || pressed) && styles.iconActionButtonHover,
            ]}
            hitSlop={4}
            accessibilityLabel={isActive ? 'Désactiver' : 'Activer'}
          >
            <Power size={16} color={isActive ? colors.success.base : colors.neutral[400]} strokeWidth={2} />
          </Pressable>
          <Pressable
            onPress={onEdit}
            style={({ hovered, pressed }: any) => [
              styles.iconActionButton,
              (hovered || pressed) && styles.iconActionButtonHover,
            ]}
            hitSlop={4}
            accessibilityLabel="Modifier"
          >
            <Pencil size={16} color={colors.neutral[500]} strokeWidth={2} />
          </Pressable>
          <Pressable
            onPress={onDelete}
            style={({ hovered, pressed }: any) => [
              styles.iconActionButton,
              styles.iconActionButtonDanger,
              (hovered || pressed) && styles.iconActionButtonDangerHover,
            ]}
            hitSlop={4}
            accessibilityLabel="Supprimer"
          >
            <Trash2 size={16} color={colors.error.base} strokeWidth={2} />
          </Pressable>
        </View>
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
  timezone?: string;
  onAddForDate: (date: string) => void;
  onDeleteOverride: (o: ReservationOverride) => void;
}

function OverridesCalendar({ overrides, getServiceName, formatFullDate, timezone, onAddForDate, onDeleteOverride }: OverridesCalendarProps) {
  const tz = timezone || 'Europe/Paris';
  const nowTz = nowInTz(tz);
  const [month, setMonth] = useState(nowTz.month - 1);
  const [year, setYear] = useState(nowTz.year);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const todayStr = useMemo(() => todayIsoInTz(tz), [tz]);

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
        <Pressable onPress={() => navigate(-1)} style={styles.overridesCalNavBtn} hitSlop={6}>
          <ChevronLeft size={18} color={colors.neutral[600]} />
        </Pressable>
        <Text style={styles.overridesCalNavText}>{MONTHS[month]} {year}</Text>
        <Pressable onPress={() => navigate(1)} style={styles.overridesCalNavBtn} hitSlop={6}>
          <ChevronRight size={18} color={colors.neutral[600]} />
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
                    {hasClosed && <View style={[styles.overridesCalDot, { backgroundColor: colors.error.base }]} />}
                    {hasSpecial && <View style={[styles.overridesCalDot, { backgroundColor: colors.warning.base }]} />}
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.overridesCalLegend}>
        <View style={styles.overridesCalLegendItem}>
          <View style={[styles.overridesCalDot, { backgroundColor: colors.error.base }]} />
          <Text style={styles.overridesCalLegendText}>Fermé</Text>
        </View>
        <View style={styles.overridesCalLegendItem}>
          <View style={[styles.overridesCalDot, { backgroundColor: colors.warning.base }]} />
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
              <Pressable onPress={() => setSelectedDate(null)} hitSlop={8} style={styles.overridesPopoverClose}>
                <XIcon size={16} color={colors.neutral[500]} strokeWidth={2} />
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
                  <Plus size={16} color={colors.brand.dark} strokeWidth={2} />
                  <Text style={styles.overridesDetailAddText}>Ajouter une fermeture</Text>
                </Pressable>
              ) : (
                <>
                  {selectedOverrides.map(o => {
                    const accent = o.isClosed ? colors.error.base : colors.warning.base;
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
                            styles.iconActionButton,
                            styles.iconActionButtonDanger,
                            (hovered || pressed) && styles.iconActionButtonDangerHover,
                          ]}
                          hitSlop={4}
                        >
                          <Trash2 size={16} color={colors.error.base} strokeWidth={2} />
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
                    <Plus size={16} color={colors.brand.dark} strokeWidth={2} />
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
// Weekly calendar
// ===========================================================================

interface WeeklyCalendarProps {
  schedulesByDay: Record<number, ReservationSchedule[]>;
  getServiceName: (id: string | null | undefined) => string;
  onDeleteSchedule: (s: ReservationSchedule) => void;
  isMobile?: boolean;
}

function WeeklyCalendar({ schedulesByDay, getServiceName, onDeleteSchedule, isMobile }: WeeklyCalendarProps) {
  // Sur mobile : liste verticale jour par jour. Sur tablet/desktop : grille 7 colonnes scrollable
  // horizontalement si pas assez large pour tout afficher.
  if (isMobile) {
    return (
      <View style={styles.weeklyMobileList}>
        {DAYS.map(day => {
          const slots = schedulesByDay[day.value] || [];
          return (
            <View key={day.value} style={styles.weeklyMobileDay}>
              <View style={styles.weeklyMobileDayHeader}>
                <Text style={styles.weeklyMobileDayName}>{day.label}</Text>
                <Text style={styles.weeklyMobileDayCount}>
                  {slots.length === 0 ? 'Fermé' : `${slots.length} créneau${slots.length > 1 ? 'x' : ''}`}
                </Text>
              </View>
              {slots.length > 0 && (
                <View style={styles.weeklyMobileDayBody}>
                  {slots.map(slot => (
                    <View key={slot.id} style={styles.weeklyMobileSlot}>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.weeklyMobileSlotService} numberOfLines={1}>{getServiceName(slot.serviceId)}</Text>
                        <Text style={styles.weeklyMobileSlotTime}>{slot.startTime} – {slot.endTime}</Text>
                      </View>
                      <Pressable
                        onPress={() => onDeleteSchedule(slot)}
                        style={({ hovered, pressed }: any) => [
                          styles.iconActionButton,
                          styles.iconActionButtonDanger,
                          (hovered || pressed) && styles.iconActionButtonDangerHover,
                        ]}
                        hitSlop={4}
                      >
                        <Trash2 size={16} color={colors.error.base} strokeWidth={2} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.calendarHorizontalScroll}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <View style={styles.calendarContainer}>
        {DAYS.map((day, idx) => {
          const slots = schedulesByDay[day.value] || [];
          const isLast = idx === DAYS.length - 1;
          return (
            <View
              key={day.value}
              style={[
                styles.calendarColumn,
                !isLast && styles.calendarColumnDivider,
              ]}
            >
              <View style={styles.calendarColumnHeader}>
                <Text style={styles.calendarDayName}>{day.short}</Text>
                <Text style={styles.calendarDayCount}>
                  {slots.length === 0 ? 'Fermé' : `${slots.length} créneau${slots.length > 1 ? 'x' : ''}`}
                </Text>
              </View>

              <View style={styles.calendarColumnBody}>
                {slots.map(slot => (
                  <CalendarSlot
                    key={slot.id}
                    slot={slot}
                    serviceName={getServiceName(slot.serviceId)}
                    onDelete={() => onDeleteSchedule(slot)}
                  />
                ))}
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
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
        <Text style={styles.calendarSlotTime} numberOfLines={1}>
          {slot.startTime} – {slot.endTime}
        </Text>
      </View>
      {showDelete && (
        <Pressable onPress={onDelete} hitSlop={6} style={styles.calendarSlotDelete}>
          <XIcon size={14} color={colors.neutral[400]} strokeWidth={2} />
        </Pressable>
      )}
    </View>
  );
}

// ===========================================================================
// Styles — alignés sur les autres écrans config (notifications, security…)
// ===========================================================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white },

  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 24, gap: 16 },
  scrollContentMobile: { padding: 16, gap: 12 },

  // Page header (iso autres écrans config)
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  tabTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: 4,
  },
  tabSubtitle: {
    fontSize: 14,
    color: colors.neutral[500],
  },

  // Top row (Services + Fermetures côte-à-côte)
  topRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'stretch',
  },
  topRowStacked: {
    flexDirection: 'column',
  },

  // viewCard pattern (iso security.tsx, configuration.tsx, notifications.tsx)
  viewCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  viewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  viewIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: getColorWithOpacity(colors.brand.dark, 0.08),
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewCardContent: {
    flex: 1,
    minWidth: 0,
  },
  viewCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: 4,
  },
  viewCardDescription: {
    fontSize: 13,
    color: colors.neutral[500],
    lineHeight: 18,
  },
  viewModeSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },

  // Create button (iso configuration.tsx)
  createButton: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.dark,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    minHeight: 44,
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  createButtonHover: { opacity: 0.9 },
  createButtonDisabled: { opacity: 0.4, ...(Platform.OS === 'web' && { cursor: 'not-allowed' } as any) },
  createButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Empty state (iso configuration.tsx)
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 16,
    gap: 6,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.neutral[500],
    marginTop: 12,
  },
  emptyStateText: {
    fontSize: 13,
    color: colors.neutral[400],
    textAlign: 'center',
    marginBottom: 8,
    maxWidth: 280,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.neutral[50],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.brand.dark,
    marginTop: 4,
    minHeight: 44,
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  emptyStateButtonHover: { backgroundColor: colors.neutral[100] },
  emptyStateButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.brand.dark,
  },

  // List (services)
  list: { gap: 10 },

  // tagItem pattern (iso configuration.tsx)
  tagItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  tagItemInactive: {
    backgroundColor: colors.neutral[50],
  },
  tagItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tagItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: getColorWithOpacity(colors.brand.dark, 0.08),
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagItemIconInactive: {
    backgroundColor: colors.neutral[100],
  },
  tagItemContent: { flex: 1, minWidth: 0, gap: 4 },
  tagItemTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  tagItemTitle: { fontSize: 15, fontWeight: '600', color: colors.neutral[800], flexShrink: 1 },
  tagItemMeta: { fontSize: 12, color: colors.neutral[500], lineHeight: 16 },
  inactiveBadge: {
    backgroundColor: colors.neutral[100],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inactiveBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  tagItemActions: { flexDirection: 'row', gap: 6, alignItems: 'center' },

  // Icon action buttons (min 36pt for tablet/desktop, used everywhere)
  iconActionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  iconActionButtonHover: { backgroundColor: colors.neutral[200] },
  iconActionButtonDanger: { backgroundColor: colors.error.bg },
  iconActionButtonDangerHover: { backgroundColor: colors.error.bg, opacity: 0.85 },

  // Weekly calendar (desktop/tablet — horizontal scroll)
  calendarHorizontalScroll: { flexGrow: 0 },
  calendarContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    overflow: 'hidden',
    minWidth: 7 * 130,
  },
  calendarColumn: { width: 130, flexDirection: 'column' },
  calendarColumnDivider: { borderRightWidth: 1, borderRightColor: colors.neutral[100] },
  calendarColumnHeader: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: colors.neutral[50],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
    alignItems: 'center',
    gap: 2,
  },
  calendarDayName: { fontSize: 12, fontWeight: '700', color: colors.neutral[800], textTransform: 'uppercase', letterSpacing: 0.4 },
  calendarDayCount: { fontSize: 11, color: colors.neutral[500], fontWeight: '500' },
  calendarColumnBody: { padding: 8, gap: 6 },
  calendarSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    gap: 6,
    minHeight: 50,
  },
  calendarSlotService: { fontSize: 12, fontWeight: '700', color: colors.neutral[800] },
  calendarSlotTime: { fontSize: 11, color: colors.neutral[500], marginTop: 2, fontVariant: ['tabular-nums'] },
  calendarSlotDelete: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[100],
  },

  // Weekly calendar (mobile — vertical list)
  weeklyMobileList: {
    gap: 12,
  },
  weeklyMobileDay: {
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    overflow: 'hidden',
  },
  weeklyMobileDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.neutral[50],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  weeklyMobileDayName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutral[800],
  },
  weeklyMobileDayCount: {
    fontSize: 12,
    color: colors.neutral[500],
    fontWeight: '500',
  },
  weeklyMobileDayBody: {
    padding: 12,
    gap: 8,
  },
  weeklyMobileSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.neutral[50],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 56,
  },
  weeklyMobileSlotService: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  weeklyMobileSlotTime: {
    fontSize: 13,
    color: colors.neutral[500],
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },

  // Overrides monthly calendar
  overridesCalRoot: {
    gap: 8,
    position: 'relative',
  },
  overridesCalNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  overridesCalNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' && { cursor: 'pointer' as any }),
  },
  overridesCalNavText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[800],
    textTransform: 'capitalize',
  },
  overridesCalWeekdays: {
    flexDirection: 'row',
    paddingHorizontal: 2,
  },
  overridesCalWeekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: colors.neutral[400],
    textTransform: 'uppercase',
    letterSpacing: 0.4,
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
    width: '100%',
    maxWidth: 280,
    maxHeight: 240,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    padding: 12,
    gap: 8,
    overflow: 'hidden',
    ...shadows.all,
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
    color: colors.neutral[800],
    flex: 1,
    textTransform: 'capitalize',
  },
  overridesPopoverClose: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' && { cursor: 'pointer' as any }),
  },
  overridesPopoverScroll: { flexShrink: 1 },
  overridesPopoverScrollContent: { gap: 8, paddingBottom: 4 },
  overridesCalDayEmpty: {
    width: '14.2857%',
    aspectRatio: 1,
    minHeight: 36,
  },
  overridesCalDay: {
    width: '14.2857%',
    aspectRatio: 1,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    ...(Platform.OS === 'web' && { cursor: 'pointer' as any }),
  },
  overridesCalDayHover: { backgroundColor: colors.neutral[100] },
  overridesCalDayToday: { backgroundColor: colors.neutral[100] },
  overridesCalDaySelected: { backgroundColor: colors.brand.dark },
  overridesCalDayText: {
    fontSize: 13,
    color: colors.neutral[800],
    fontVariant: ['tabular-nums'],
  },
  overridesCalDayTextToday: { color: colors.brand.dark, fontWeight: '700' },
  overridesCalDayTextSelected: { color: colors.white, fontWeight: '700' },
  overridesCalDots: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  overridesCalDot: { width: 5, height: 5, borderRadius: 3 },
  overridesCalLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  overridesCalLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  overridesCalLegendText: {
    fontSize: 11,
    color: colors.neutral[500],
    fontWeight: '500',
  },
  overridesDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.neutral[200],
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
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[800],
    marginLeft: 4,
  },
  overridesDetailItemMeta: {
    fontSize: 11,
    color: colors.neutral[500],
    marginLeft: 4,
    marginTop: 2,
  },
  overridesDetailAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.neutral[300],
    backgroundColor: colors.white,
    minHeight: 44,
    ...(Platform.OS === 'web' && { cursor: 'pointer' as any }),
  },
  overridesDetailAddHover: {
    backgroundColor: colors.neutral[50],
    borderColor: colors.neutral[400],
  },
  overridesDetailAddText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.brand.dark,
  },
});
