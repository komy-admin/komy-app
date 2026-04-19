import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Modal, TextInput, useWindowDimensions } from 'react-native';
import { ChevronLeft, ChevronRight, X as XIcon, AlertTriangle, CheckCircle, CreditCard, RefreshCw } from 'lucide-react-native';
import { ForkTable, Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui';
import { TabsHeader } from '~/components/ui/TabsHeader';
import { TabBadgeItem } from '~/components/ui/TabBadgeItem';
import { HeaderActionButton } from '~/components/ui/HeaderActionButton';
import { SlidePanel } from '~/components/ui/SlidePanel';
import { SidePanel } from '~/components/SidePanel';
import { usePanelPortal } from '~/hooks/usePanelPortal';
import { useToast } from '~/components/ToastProvider';
import { ReservationFormPanel } from '~/components/reservation/forms/ReservationFormPanel';
import { getColorWithOpacity } from '~/lib/color-utils';
import type { ActionItem } from '~/components/ActionMenu';
import type {
  Reservation,
  ReservationService,
  ReservationSchedule,
  ReservationStatus,
  CreateManualReservationDto,
} from '~/types/reservation.types';

const IMPRINT_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Empreinte en attente', color: '#F59E0B', bg: '#FFFBEB' },
  authorized: { label: 'Empreinte autorisée', color: '#6366F1', bg: '#EEF2FF' },
  captured: { label: 'Débitée', color: '#EF4444', bg: '#FEF2F2' },
  released: { label: 'Libérée', color: '#10B981', bg: '#F0FDF4' },
  failed: { label: 'Échec empreinte', color: '#EF4444', bg: '#FEF2F2' },
};

const STATUS_CONFIG: Record<ReservationStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'En attente', color: '#F59E0B', bg: '#FFFBEB' },
  pending_payment: { label: 'Attente paiement', color: '#6366F1', bg: '#EEF2FF' },
  confirmed: { label: 'Confirmée', color: '#10B981', bg: '#F0FDF4' },
  cancelled: { label: 'Annulée', color: '#EF4444', bg: '#FEF2F2' },
  no_show: { label: 'No-show', color: '#64748B', bg: '#F1F5F9' },
  completed: { label: 'Terminée', color: '#3B82F6', bg: '#EFF6FF' },
};

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

interface ReservationListProps {
  reservation: {
    services: ReservationService[];
    schedules: ReservationSchedule[];
    reservations: Reservation[];
    reservationsMeta: any;
    loadServices: () => Promise<ReservationService[]>;
    loadSchedules: () => Promise<ReservationSchedule[]>;
    loadReservations: (params?: any) => Promise<any>;
    createReservation: (data: CreateManualReservationDto) => Promise<Reservation>;
    cancelReservation: (id: string, reason?: string) => Promise<Reservation>;
    noShowReservation: (id: string, charge?: boolean) => Promise<Reservation>;
    completeReservation: (id: string) => Promise<Reservation>;
    retryCharge: (id: string) => Promise<Reservation>;
  };
}

export function ReservationList({ reservation }: ReservationListProps) {
  const { showToast } = useToast();
  const { renderPanel, clearPanel } = usePanelPortal();
  const { width } = useWindowDimensions();

  const [isLoading, setIsLoading] = useState(true);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(true);

  const today = new Date().toISOString().split('T')[0];
  const [filterDate, setFilterDate] = useState(today);
  const [activeServiceTab, setActiveServiceTab] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const [showCalendar, setShowCalendar] = useState(false);
  const [calMonth, setCalMonth] = useState(() => new Date(today).getMonth());
  const [calYear, setCalYear] = useState(() => new Date(today).getFullYear());

  const [cancelModalId, setCancelModalId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [noShowModalId, setNoShowModalId] = useState<string | null>(null);
  const [completeModalId, setCompleteModalId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([reservation.loadServices(), reservation.loadSchedules()]);
      await reservation.loadReservations({
        date: filterDate || undefined,
        page: currentPage,
        limit: 100,
      });
    } catch {
      showToast('Erreur chargement des réservations', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [filterDate, currentPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredReservations = useMemo(() => {
    if (activeServiceTab === 'all') return reservation.reservations;
    return reservation.reservations.filter(r => r.serviceId === activeServiceTab);
  }, [reservation.reservations, activeServiceTab]);

  const reservationsCountByService = useMemo(() => {
    const counts: Record<string, number> = { all: reservation.reservations.length };
    for (const service of reservation.services) {
      counts[service.id] = reservation.reservations.filter(r => r.serviceId === service.id).length;
    }
    return counts;
  }, [reservation.reservations, reservation.services]);

  const navigateDate = (direction: number) => {
    const [year, month, day] = filterDate.split('-').map(Number);
    const date = new Date(year, month - 1, day + direction);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    setFilterDate(`${y}-${m}-${d}`);
    setCurrentPage(1);
  };

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
    setFilterDate(`${calYear}-${m}-${d}`);
    setCurrentPage(1);
    setShowCalendar(false);
  };

  const openCalendar = () => {
    const d = new Date(filterDate + 'T00:00:00');
    setCalMonth(d.getMonth());
    setCalYear(d.getFullYear());
    setShowCalendar(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalId) return;
    const id = cancelModalId;
    setCancelModalId(null);
    try {
      await reservation.cancelReservation(id, cancelReason.trim() || undefined);
      showToast('Réservation annulée', 'success');
    } catch (error: any) {
      showToast(error?.response?.data?.error || 'Erreur', 'error');
    } finally {
      setCancelReason('');
    }
  };

  const handleConfirmNoShow = async (charge: boolean) => {
    if (!noShowModalId) return;
    const id = noShowModalId;
    setNoShowModalId(null);
    try {
      const result = await reservation.noShowReservation(id, charge);
      if (charge && result.cardImprint?.status === 'failed') {
        showToast('No-show enregistré mais le débit a échoué', 'warning');
      } else {
        showToast(charge ? 'No-show enregistré et débit effectué' : 'Marqué no-show', 'success');
      }
    } catch (error: any) {
      showToast(error?.response?.data?.error || 'Erreur', 'error');
    }
  };

  const handleConfirmComplete = async () => {
    if (!completeModalId) return;
    const id = completeModalId;
    setCompleteModalId(null);
    try {
      await reservation.completeReservation(id);
      showToast('Réservation terminée', 'success');
    } catch (error: any) {
      showToast(error?.response?.data?.error || 'Erreur', 'error');
    }
  };

  const handleRetryCharge = async (id: string) => {
    try {
      await reservation.retryCharge(id);
      showToast('Débit effectué', 'success');
    } catch (error: any) {
      showToast(error?.response?.data?.error?.message || 'Échec du débit', 'error');
    }
  };

  const getServiceName = useCallback((serviceId: string | null) => {
    if (!serviceId) return 'Service supprimé';
    return reservation.services.find(s => s.id === serviceId)?.name || 'Service supprimé';
  }, [reservation.services]);

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
  };

  const isToday = filterDate === today;

  const handleClosePanel = useCallback(() => {
    setShowCreatePanel(false);
    clearPanel();
  }, [clearPanel]);

  const handleCreateReservation = useCallback(async (data: CreateManualReservationDto) => {
    await reservation.createReservation(data);
    showToast('Réservation créée', 'success');
    handleClosePanel();
    loadData();
  }, [reservation, showToast, handleClosePanel, loadData]);

  useEffect(() => {
    if (showCreatePanel) {
      renderPanel(
        <SlidePanel visible={true} onClose={handleClosePanel} width={460}>
          <ReservationFormPanel
            services={reservation.services}
            schedules={reservation.schedules}
            onSubmit={handleCreateReservation}
            onCancel={handleClosePanel}
          />
        </SlidePanel>
      );
    } else {
      clearPanel();
    }
  }, [showCreatePanel, reservation.services, reservation.schedules, handleClosePanel, handleCreateReservation, renderPanel, clearPanel]);

  const columns = useMemo(() => [
    {
      label: '',
      key: 'avatar',
      width: 64,
      render: (item: Reservation) => (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.guest.firstName?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>
      ),
    },
    {
      key: 'time',
      label: 'Heure',
      width: '0.6',
      render: (item: Reservation) => (
        <Text style={[styles.cellPrimary, { fontWeight: '700' }]}>{item.timeSlot}</Text>
      ),
    },
    {
      key: 'name',
      label: 'Nom',
      width: '1.2',
      render: (item: Reservation) => (
        <Text style={styles.cellPrimary} numberOfLines={1}>
          {item.guest.firstName} {item.guest.lastName}
        </Text>
      ),
    },
    {
      key: 'phone',
      label: 'Téléphone',
      width: '1',
      render: (item: Reservation) => (
        item.guest.phone
          ? <Text style={styles.cellSecondary} numberOfLines={1}>{item.guest.phone}</Text>
          : <Text style={styles.cellEmpty}>—</Text>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      width: '1.4',
      render: (item: Reservation) => (
        item.guest.email
          ? <Text style={styles.cellSecondary} numberOfLines={1}>{item.guest.email}</Text>
          : <Text style={styles.cellEmpty}>—</Text>
      ),
    },
    {
      key: 'partySize',
      label: 'Cvts',
      width: '0.4',
      render: (item: Reservation) => (
        <Text style={styles.cellPrimary}>{item.partySize}</Text>
      ),
    },
    {
      key: 'service',
      label: 'Service',
      width: '1',
      render: (item: Reservation) => (
        <Text style={[styles.cellSecondary, !item.serviceId && styles.deletedService]} numberOfLines={1}>
          {getServiceName(item.serviceId)}
        </Text>
      ),
    },
    {
      key: 'status',
      label: 'Statut',
      width: '1.2',
      render: (item: Reservation) => {
        const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
        return (
          <View>
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <Text style={[styles.statusBadgeText, { color: status.color }]} numberOfLines={1}>
                {status.label}
              </Text>
            </View>
            {item.status === 'cancelled' && item.cancellationReason ? (
              <Text style={styles.cancellationReason} numberOfLines={1}>
                {item.cancellationReason}
              </Text>
            ) : null}
          </View>
        );
      },
    },
    {
      key: 'payment',
      label: 'Paiement',
      width: '1.3',
      render: (item: Reservation) => {
        if (!item.cardImprint) {
          return <Text style={styles.cellEmpty}>—</Text>;
        }
        const imp = IMPRINT_STATUS_CONFIG[item.cardImprint.status];
        if (!imp) return <Text style={styles.cellEmpty}>—</Text>;
        const isDisputed = !!item.cardImprint.disputedAt;
        const imprintLabel = item.status === 'no_show' && item.cardImprint.status === 'failed'
          ? 'Débit échoué'
          : imp.label;

        const badgeColor = isDisputed ? '#EF4444' : imp.color;
        const badgeBg = isDisputed ? '#FEF2F2' : imp.bg;
        const primaryLabel = isDisputed ? 'Contestée' : imprintLabel;
        const secondaryLabel = isDisputed ? imprintLabel : null;
        const Icon = isDisputed ? AlertTriangle : CreditCard;

        const detail = !isDisputed && item.cardImprint.status === 'failed'
          ? item.cardImprint.failureReason
          : null;

        return (
          <View>
            <View style={[styles.imprintBadge, { backgroundColor: badgeBg }]}>
              <Icon size={11} color={badgeColor} />
              <Text style={[styles.imprintBadgeText, { color: badgeColor }]} numberOfLines={1}>
                {primaryLabel}
              </Text>
              {secondaryLabel ? (
                <Text style={[styles.imprintSecondary, { color: badgeColor }]} numberOfLines={1}>
                  · {secondaryLabel}
                </Text>
              ) : null}
              {item.cardImprint.cardLast4 ? (
                <Text style={[styles.imprintCardInfo, { color: badgeColor }]}>
                  ••{item.cardImprint.cardLast4}
                </Text>
              ) : null}
            </View>
            {detail ? (
              <Text style={styles.imprintFailureReason} numberOfLines={1}>
                {detail}
              </Text>
            ) : null}
          </View>
        );
      },
    },
  ], [getServiceName]);

  const getReservationActions = useCallback((r: Reservation): ActionItem[] => {
    const actions: ActionItem[] = [];

    if (r.status === 'pending' || r.status === 'confirmed') {
      actions.push({
        label: 'Annuler',
        icon: <XIcon size={16} color="#EF4444" />,
        onPress: () => { setCancelReason(''); setCancelModalId(r.id); },
        type: 'destructive',
      });
    }
    if (r.status === 'confirmed') {
      actions.push({
        label: 'No-show',
        icon: <AlertTriangle size={16} color="#64748B" />,
        onPress: () => setNoShowModalId(r.id),
      });
      actions.push({
        label: 'Terminer',
        icon: <CheckCircle size={16} color="#3B82F6" />,
        onPress: () => setCompleteModalId(r.id),
      });
    }
    if (r.status === 'no_show' && r.cardImprint?.status === 'failed') {
      actions.push({
        label: 'Retenter le débit',
        icon: <RefreshCw size={16} color="#F97316" />,
        onPress: () => handleRetryCharge(r.id),
      });
    }

    return actions;
  }, []);

  const formatStats = (count: number) => `${count} réservation${count !== 1 ? 's' : ''}`;

  return (
    <View style={styles.rootRow}>
      <SidePanel
        title="Filtrage"
        width={Math.max(280, Math.min(360, width / 4))}
        isCollapsed={isPanelCollapsed}
        onCollapsedChange={setIsPanelCollapsed}
      >
        <View style={styles.emptyFilters} />
      </SidePanel>

      <View style={styles.container}>
        <Tabs
          style={{ flex: 1, backgroundColor: '#FFFFFF' }}
          value={activeServiceTab}
          onValueChange={(v: string) => setActiveServiceTab(v)}
        >
          <TabsHeader
            rightSlot={
              <View style={styles.headerRightSlot}>
                <View style={styles.dateNav}>
                  <Pressable onPress={() => navigateDate(-1)} style={styles.dateArrowButton}>
                    <ChevronLeft size={18} color="#1E293B" />
                  </Pressable>
                  <Pressable onPress={openCalendar} style={styles.dateLabelButton}>
                    <Text style={styles.dateText}>{formatDateLabel(filterDate)}</Text>
                  </Pressable>
                  <Pressable onPress={() => navigateDate(1)} style={styles.dateArrowButton}>
                    <ChevronRight size={18} color="#1E293B" />
                  </Pressable>
                </View>

                {!isToday && (
                  <Pressable
                    onPress={() => { setFilterDate(today); setCurrentPage(1); }}
                    style={styles.todayChip}
                  >
                    <Text style={styles.todayChipText}>Aujourd'hui</Text>
                  </Pressable>
                )}

                <HeaderActionButton label="AJOUTER" onPress={() => setShowCreatePanel(true)} />
              </View>
            }
          >
            <TabsList className="flex-row justify-start h-full" style={{ height: 60 }}>
              <TabsTrigger value="all" className="">
                <TabBadgeItem
                  name="Tous"
                  stats={formatStats(reservationsCountByService['all'] || 0)}
                  isActive={activeServiceTab === 'all'}
                />
              </TabsTrigger>
              {reservation.services.map(service => (
                <TabsTrigger key={service.id} value={service.id} className="">
                  <TabBadgeItem
                    name={service.name}
                    stats={formatStats(reservationsCountByService[service.id] || 0)}
                    isActive={activeServiceTab === service.id}
                  />
                </TabsTrigger>
              ))}
            </TabsList>
          </TabsHeader>

          {showCalendar && (
            <View style={styles.calendarDropdownWrapper}>
              <Pressable style={styles.calendarBackdrop} onPress={() => setShowCalendar(false)} />
              <View style={styles.calendarDropdown}>
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
                    const isSelected = filterDate === dateStr;
                    const isTodayDay = dateStr === today;
                    return (
                      <Pressable
                        key={`d-${day}`}
                        style={[
                          styles.calDay,
                          isSelected && styles.calDaySelected,
                          isTodayDay && !isSelected && styles.calDayToday,
                        ]}
                        onPress={() => selectCalendarDay(day)}
                      >
                        <Text style={[
                          styles.calDayText,
                          isSelected && styles.calDayTextSelected,
                          isTodayDay && !isSelected && styles.calDayTextToday,
                        ]}>
                          {day}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>
          )}

          <TabsContent style={{ flex: 1 }} value={activeServiceTab}>
            <ForkTable
              data={filteredReservations}
              columns={columns}
              useActionMenu={true}
              getActions={getReservationActions}
              isLoading={isLoading}
              loadingMessage="Chargement des réservations..."
              emptyMessage="Aucune réservation pour cette date / ce service"
            />
          </TabsContent>
        </Tabs>

        {reservation.reservationsMeta && reservation.reservationsMeta.lastPage > 1 && (
          <View style={styles.pagination}>
            <Pressable
              style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
              onPress={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} color={currentPage === 1 ? '#CBD5E1' : '#64748B'} />
            </Pressable>
            <Text style={styles.pageText}>
              Page {currentPage} / {reservation.reservationsMeta.lastPage}
            </Text>
            <Pressable
              style={[styles.pageButton, currentPage === reservation.reservationsMeta.lastPage && styles.pageButtonDisabled]}
              onPress={() => currentPage < reservation.reservationsMeta.lastPage && setCurrentPage(currentPage + 1)}
              disabled={currentPage === reservation.reservationsMeta.lastPage}
            >
              <ChevronRight size={16} color={currentPage === reservation.reservationsMeta.lastPage ? '#CBD5E1' : '#64748B'} />
            </Pressable>
          </View>
        )}
      </View>

      <Modal
        visible={cancelModalId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setCancelModalId(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setCancelModalId(null)}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <Text style={styles.modalTitle}>Annuler la réservation</Text>
            <Text style={styles.modalDescription}>
              Vous pouvez indiquer une raison d'annulation (optionnel)
            </Text>
            <TextInput
              style={styles.modalTextInput}
              value={cancelReason}
              onChangeText={setCancelReason}
              placeholder="Raison de l'annulation..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelButton} onPress={() => setCancelModalId(null)}>
                <Text style={styles.modalCancelButtonText}>Retour</Text>
              </Pressable>
              <Pressable style={styles.modalConfirmButton} onPress={handleConfirmCancel}>
                <Text style={styles.modalConfirmButtonText}>Confirmer l'annulation</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {(() => {
        const r = reservation.reservations.find(res => res.id === noShowModalId);
        const hasImprint = r?.cardImprint?.status === 'authorized';
        const amount = r?.cardImprint?.amount;
        const currency = r?.cardImprint?.currency?.toUpperCase() || 'EUR';
        return (
          <Modal
            visible={noShowModalId !== null}
            transparent
            animationType="fade"
            onRequestClose={() => setNoShowModalId(null)}
          >
            <Pressable style={styles.modalOverlay} onPress={() => setNoShowModalId(null)}>
              <Pressable style={styles.modalContent} onPress={() => {}}>
                <Text style={styles.modalTitle}>Marquer no-show</Text>
                <Text style={styles.modalDescription}>
                  {hasImprint
                    ? `Le client ne s'est pas présenté. Souhaitez-vous débiter ${amount ? `${(amount / 100).toFixed(2)} ${currency}` : "l'empreinte"} enregistrée ?`
                    : 'Êtes-vous sûr de vouloir marquer cette réservation comme no-show ?'}
                </Text>
                <View style={styles.modalActions}>
                  <Pressable style={styles.modalCancelButton} onPress={() => setNoShowModalId(null)}>
                    <Text style={styles.modalCancelButtonText}>Retour</Text>
                  </Pressable>
                  {hasImprint ? (
                    <>
                      <Pressable
                        style={[styles.modalConfirmButton, { backgroundColor: '#64748B' }]}
                        onPress={() => handleConfirmNoShow(false)}
                      >
                        <Text style={styles.modalConfirmButtonText}>Sans débit</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.modalConfirmButton, { backgroundColor: '#F97316' }]}
                        onPress={() => handleConfirmNoShow(true)}
                      >
                        <Text style={styles.modalConfirmButtonText}>Débiter</Text>
                      </Pressable>
                    </>
                  ) : (
                    <Pressable
                      style={[styles.modalConfirmButton, { backgroundColor: '#64748B' }]}
                      onPress={() => handleConfirmNoShow(false)}
                    >
                      <Text style={styles.modalConfirmButtonText}>Confirmer no-show</Text>
                    </Pressable>
                  )}
                </View>
              </Pressable>
            </Pressable>
          </Modal>
        );
      })()}

      <Modal
        visible={completeModalId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setCompleteModalId(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setCompleteModalId(null)}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <Text style={styles.modalTitle}>Terminer la réservation</Text>
            <Text style={styles.modalDescription}>
              Êtes-vous sûr de vouloir marquer cette réservation comme terminée ?
            </Text>
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelButton} onPress={() => setCompleteModalId(null)}>
                <Text style={styles.modalCancelButtonText}>Retour</Text>
              </Pressable>
              <Pressable
                style={[styles.modalConfirmButton, { backgroundColor: '#3B82F6' }]}
                onPress={handleConfirmComplete}
              >
                <Text style={styles.modalConfirmButtonText}>Terminer</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  rootRow: { flex: 1, flexDirection: 'row', backgroundColor: '#FFFFFF' },
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  emptyFilters: { flex: 1 },

  headerRightSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 12,
    height: '100%',
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    height: 34,
  },
  dateArrowButton: {
    paddingHorizontal: 10,
    height: '100%',
    justifyContent: 'center',
    ...(Platform.OS === 'web' && { cursor: 'pointer', userSelect: 'none' } as any),
  },
  dateLabelButton: {
    width: 220,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    ...(Platform.OS === 'web' && { cursor: 'pointer' } as any),
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    textTransform: 'capitalize',
    ...(Platform.OS === 'web' && { userSelect: 'none' } as any),
  },
  todayChip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    height: 34,
    justifyContent: 'center',
    borderRadius: 8,
    ...(Platform.OS === 'web' && { cursor: 'pointer' } as any),
  },
  todayChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },

  calendarDropdownWrapper: {
    position: 'relative',
    alignItems: 'center',
    zIndex: 100,
  },
  calendarBackdrop: {
    position: 'absolute' as const,
    top: -200,
    left: -500,
    right: -500,
    bottom: -500,
  },
  calendarDropdown: {
    position: 'absolute',
    top: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: 320,
    ...(Platform.OS === 'web' && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
    }),
    zIndex: 101,
  },
  calNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calNavBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    ...(Platform.OS === 'web' && { cursor: 'pointer' } as any),
  },
  calNavText: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  calWeekdays: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  calWeekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calDayEmpty: { width: '14.28%', height: 36 },
  calDay: {
    width: '14.28%',
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    ...(Platform.OS === 'web' && { cursor: 'pointer' } as any),
  },
  calDaySelected: { backgroundColor: '#2A2E33' },
  calDayToday: { backgroundColor: '#EFF6FF' },
  calDayText: { fontSize: 14, color: '#1E293B' },
  calDayTextSelected: { color: '#FFFFFF', fontWeight: '700' },
  calDayTextToday: { color: '#3B82F6', fontWeight: '700' },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: getColorWithOpacity('#2A2E33', 0.12),
    borderWidth: 1.5,
    borderColor: '#2A2E33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#2A2E33',
    fontSize: 14,
    fontWeight: '600',
  },

  cellPrimary: { fontSize: 14, color: '#1E293B' },
  cellSecondary: { fontSize: 13, color: '#64748B' },
  cellSub: { fontSize: 12, color: '#94A3B8' },
  cellEmpty: { fontSize: 13, color: '#CBD5E1' },
  deletedService: { color: '#EF4444', fontStyle: 'italic' },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusBadgeText: { fontSize: 12, fontWeight: '600' },
  cancellationReason: {
    fontSize: 11,
    color: '#EF4444',
    fontStyle: 'italic',
    marginTop: 4,
  },
  imprintBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  imprintBadgeText: { fontSize: 11, fontWeight: '600' },
  imprintSecondary: { fontSize: 11, fontWeight: '500', opacity: 0.75 },
  imprintCardInfo: { fontSize: 11, fontWeight: '500', opacity: 0.65 },
  imprintFailureReason: {
    fontSize: 11,
    color: '#EF4444',
    fontStyle: 'italic',
    marginTop: 4,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
  },
  pageButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    ...(Platform.OS === 'web' && { cursor: 'pointer' } as any),
  },
  pageButtonDisabled: { opacity: 0.5 },
  pageText: { fontSize: 14, color: '#64748B' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 440,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  modalTextInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E293B',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...(Platform.OS === 'web' && { cursor: 'pointer' } as any),
  },
  modalCancelButtonText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  modalConfirmButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    ...(Platform.OS === 'web' && { cursor: 'pointer' } as any),
  },
  modalConfirmButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
