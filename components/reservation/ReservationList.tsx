import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Platform, Modal, TextInput } from 'react-native';
import { ChevronLeft, ChevronRight, ChevronDown, X as XIcon, AlertTriangle, CheckCircle, CreditCard, MoreHorizontal, Plus, RefreshCw } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import { useToast } from '~/components/ToastProvider';
import type {
  Reservation,
  ReservationService,
  ReservationSchedule,
  ReservationStatus,
  CreateManualReservationDto,
} from '~/types/reservation.types';
import { CreateReservationModal } from './CreateReservationModal';
import { colors } from '~/theme';
import { getColorWithOpacity } from '~/lib/color-utils';

interface FilterOption { label: string; value: string; }

function FilterSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: FilterOption[] }) {
  if (Platform.OS === 'web') {
    return (
      <View style={{ position: 'relative' }}>
        <select
          value={value}
          onChange={(e) => onChange((e.target as HTMLSelectElement).value)}
          style={{
            height: 38,
            width: '100%',
            paddingLeft: 10,
            paddingRight: 32,
            fontSize: 13,
            color: '#1E293B',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 8,
            outline: 'none',
            appearance: 'none',
            cursor: 'pointer',
          } as any}
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
      <Picker selectedValue={value} onValueChange={onChange} style={{ height: 40 }}>
        {options.map(o => <Picker.Item key={o.value} label={o.label} value={o.value} />)}
      </Picker>
    </View>
  );
}

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
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [cancelModalId, setCancelModalId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [noShowModalId, setNoShowModalId] = useState<string | null>(null);
  const [completeModalId, setCompleteModalId] = useState<string | null>(null);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { showToast } = useToast();

  // Filters
  const today = new Date().toISOString().split('T')[0];
  const [filterDate, setFilterDate] = useState(today);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterServiceId, setFilterServiceId] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

  // Calendar picker state
  const [showCalendar, setShowCalendar] = useState(false);
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date(today);
    return d.getMonth();
  });
  const [calYear, setCalYear] = useState(() => {
    const d = new Date(today);
    return d.getFullYear();
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([reservation.loadServices(), reservation.loadSchedules()]);
      await reservation.loadReservations({
        date: filterDate || undefined,
        status: filterStatus || undefined,
        serviceId: filterServiceId || undefined,
        page: currentPage,
        limit: 50,
      });
    } catch {
      showToast('Erreur chargement des réservations', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [filterDate, filterStatus, filterServiceId, currentPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const navigateDate = (direction: number) => {
    const [year, month, day] = filterDate.split('-').map(Number);
    const date = new Date(year, month - 1, day + direction);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    setFilterDate(`${y}-${m}-${d}`);
    setCurrentPage(1);
  };

  // Calendar helpers
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
    const dateStr = `${calYear}-${m}-${d}`;
    setFilterDate(dateStr);
    setCurrentPage(1);
    setShowCalendar(false);
  };

  const openCalendar = () => {
    // Sync calendar to currently selected date
    const d = new Date(filterDate + 'T00:00:00');
    setCalMonth(d.getMonth());
    setCalYear(d.getFullYear());
    setShowCalendar(true);
  };

  const handleAction = async (id: string, action: 'cancel' | 'no_show' | 'complete') => {
    if (action === 'cancel') {
      setCancelModalId(id);
      setCancelReason('');
      return;
    }
    if (action === 'no_show') {
      setNoShowModalId(id);
      return;
    }
    if (action === 'complete') {
      setCompleteModalId(id);
      return;
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalId) return;
    const id = cancelModalId;
    setCancelModalId(null);
    setActionLoading(id);
    try {
      await reservation.cancelReservation(id, cancelReason.trim() || undefined);
      showToast('Réservation annulée', 'success');
    } catch (error: any) {
      showToast(error?.response?.data?.error || 'Erreur', 'error');
    } finally {
      setActionLoading(null);
      setCancelReason('');
    }
  };

  const handleConfirmNoShow = async (charge: boolean) => {
    if (!noShowModalId) return;
    const id = noShowModalId;
    setNoShowModalId(null);
    setActionLoading(id);
    try {
      const result = await reservation.noShowReservation(id, charge);
      if (charge && result.cardImprint?.status === 'failed') {
        showToast('No-show enregistré mais le débit a échoué', 'warning');
      } else {
        showToast(charge ? 'No-show enregistré et débit effectué' : 'Marqué no-show', 'success');
      }
    } catch (error: any) {
      showToast(error?.response?.data?.error || 'Erreur', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRetryCharge = async (id: string) => {
    setActionMenuId(null);
    setActionLoading(id);
    try {
      await reservation.retryCharge(id);
      showToast('Débit effectué', 'success');
    } catch (error: any) {
      showToast(error?.response?.data?.error?.message || 'Échec du débit', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmComplete = async () => {
    if (!completeModalId) return;
    const id = completeModalId;
    setCompleteModalId(null);
    setActionLoading(id);
    try {
      await reservation.completeReservation(id);
      showToast('Réservation terminée', 'success');
    } catch (error: any) {
      showToast(error?.response?.data?.error || 'Erreur', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const getServiceName = (serviceId: string | null) => {
    if (!serviceId) return 'Service supprimé';
    return reservation.services.find(s => s.id === serviceId)?.name || 'Service supprimé';
  };

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
  };

  const isToday = filterDate === today;

  return (
    <View style={styles.container}>
      <View style={styles.pageTitleRow}>
        <Text style={styles.pageTitle}>Réservations</Text>
        <Pressable style={styles.createButton} onPress={() => setShowCreateModal(true)}>
          <Plus size={16} color="#FFFFFF" />
          <Text style={styles.createButtonText}>Nouvelle réservation</Text>
        </Pressable>
      </View>

      {/* Date navigation with calendar */}
      <View style={styles.dateNavContainer}>
        <View style={styles.dateNavSide} />

        <View style={styles.dateNav}>
          <Pressable onPress={() => navigateDate(-1)} style={styles.dateArrowButton}>
            <ChevronLeft size={20} color="#1E293B" />
          </Pressable>

          <Pressable onPress={openCalendar} style={styles.dateLabelButton}>
            <Text style={styles.dateText}>{formatDateLabel(filterDate)}</Text>
          </Pressable>

          <Pressable onPress={() => navigateDate(1)} style={styles.dateArrowButton}>
            <ChevronRight size={20} color="#1E293B" />
          </Pressable>
        </View>

        <View style={styles.dateNavSide}>
          {!isToday && (
            <Pressable onPress={() => { setFilterDate(today); setCurrentPage(1); }} style={styles.todayChip}>
              <Text style={styles.todayChipText}>Revenir à aujourd'hui</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Calendar dropdown */}
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

      {/* Filters */}
      <View style={styles.filtersRow}>
        <View style={styles.filterField}>
          <Text style={styles.filterLabel}>Statut</Text>
          <FilterSelect
            value={filterStatus}
            onChange={(v) => { setFilterStatus(v); setCurrentPage(1); }}
            options={[
              { label: 'Tous', value: '' },
              { label: 'En attente', value: 'pending' },
              { label: 'Attente paiement', value: 'pending_payment' },
              { label: 'Confirmée', value: 'confirmed' },
              { label: 'Annulée', value: 'cancelled' },
              { label: 'No-show', value: 'no_show' },
              { label: 'Terminée', value: 'completed' },
            ]}
          />
        </View>

        <View style={styles.filterField}>
          <Text style={styles.filterLabel}>Service</Text>
          <FilterSelect
            value={filterServiceId}
            onChange={(v) => { setFilterServiceId(v); setCurrentPage(1); }}
            options={[
              { label: 'Tous', value: '' },
              ...reservation.services.map(s => ({ label: s.name, value: s.id })),
            ]}
          />
        </View>

        <Pressable
          style={styles.clearButton}
          onPress={() => { setFilterDate(today); setFilterStatus(''); setFilterServiceId(''); setCurrentPage(1); }}
        >
          <Text style={styles.clearButtonText}>Réinitialiser</Text>
        </Pressable>
      </View>

      {/* Reservations table */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2A2E33" />
        </View>
      ) : reservation.reservations.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Aucune réservation</Text>
          <Text style={styles.emptySubtext}>Pas de réservation pour cette date / ces filtres</Text>
        </View>
      ) : (
        <View style={styles.tableContainer}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, { flex: 0.8 }]}>Heure</Text>
            <Text style={[styles.headerCell, { flex: 2 }]}>Client</Text>
            <Text style={[styles.headerCell, { flex: 0.6, textAlign: 'center' }]}>Cvts</Text>
            <Text style={[styles.headerCell, { flex: 1.4 }]}>Service</Text>
            <Text style={[styles.headerCell, { flex: 1.8 }]}>Statut</Text>
            <Text style={[styles.headerCell, { flex: 1 }]}>Actions</Text>
          </View>

          {/* Rows */}
          {reservation.reservations.map((r) => {
            const status = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
            const isProcessing = actionLoading === r.id;

            return (
              <View key={r.id} style={styles.tableRow}>
                <Text style={[styles.cell, { flex: 0.8, fontWeight: '600' }]}>
                  {r.timeSlot}
                </Text>
                <View style={{ flex: 2 }}>
                  <Text style={styles.cell} numberOfLines={1}>
                    {r.guest.firstName} {r.guest.lastName}
                  </Text>
                  {r.guest.phone ? (
                    <Text style={styles.cellSub} numberOfLines={1}>{r.guest.phone}</Text>
                  ) : null}
                  <Text style={styles.cellSub} numberOfLines={1}>{r.guest.email}</Text>
                </View>
                <Text style={[styles.cell, { flex: 0.6, textAlign: 'center' }]}>
                  {r.partySize}
                </Text>
                <Text style={[styles.cell, { flex: 1.4 }, !r.serviceId && styles.deletedService]} numberOfLines={1}>
                  {getServiceName(r.serviceId)}
                </Text>
                <View style={{ flex: 1.8 }}>
                  <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: status.color }]} numberOfLines={1}>
                      {status.label}
                    </Text>
                  </View>
                  {r.status === 'cancelled' && r.cancellationReason ? (
                    <Text style={styles.cancellationReason} numberOfLines={2}>
                      {r.cancellationReason}
                    </Text>
                  ) : null}
                  {r.cardImprint && (() => {
                    const imp = IMPRINT_STATUS_CONFIG[r.cardImprint.status];
                    const imprintLabel = r.status === 'no_show' && r.cardImprint.status === 'failed'
                      ? 'Débit échoué'
                      : imp?.label;
                    return (
                      <View style={[styles.imprintBadge, { backgroundColor: imp?.bg || '#F1F5F9' }]}>
                        <CreditCard size={10} color={imp?.color || '#64748B'} />
                        <Text style={[styles.imprintBadgeText, { color: imp?.color || '#64748B' }]} numberOfLines={1}>
                          {imprintLabel}
                        </Text>
                        {r.cardImprint.cardLast4 ? (
                          <Text style={styles.imprintCardInfo}>••••{r.cardImprint.cardLast4}</Text>
                        ) : null}
                      </View>
                    );
                  })()}
                </View>
                <View style={[styles.actionsCell, { flex: 1 }]}>
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#64748B" />
                  ) : (
                    <Pressable
                      style={styles.menuButton}
                      onPress={() => setActionMenuId(r.id)}
                    >
                      <MoreHorizontal size={16} color="#64748B" />
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Cancel reason modal */}
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
              <Pressable
                style={styles.modalCancelButton}
                onPress={() => setCancelModalId(null)}
              >
                <Text style={styles.modalCancelButtonText}>Retour</Text>
              </Pressable>
              <Pressable
                style={styles.modalConfirmButton}
                onPress={handleConfirmCancel}
              >
                <Text style={styles.modalConfirmButtonText}>Confirmer l'annulation</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* No-show confirmation modal */}
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
                  <Pressable
                    style={styles.modalCancelButton}
                    onPress={() => setNoShowModalId(null)}
                  >
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

      {/* Complete reservation modal */}
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
              <Pressable
                style={styles.modalCancelButton}
                onPress={() => setCompleteModalId(null)}
              >
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

      {/* Action menu modal */}
      {(() => {
        const r = reservation.reservations.find(res => res.id === actionMenuId);
        if (!r) return null;
        const hasActions = r.status === 'pending' || r.status === 'confirmed' || (r.status === 'no_show' && r.cardImprint?.status === 'failed');
        return (
          <Modal
            visible={actionMenuId !== null}
            transparent
            animationType="fade"
            onRequestClose={() => setActionMenuId(null)}
          >
            <Pressable style={styles.modalOverlay} onPress={() => setActionMenuId(null)}>
              <Pressable style={styles.actionMenuContent} onPress={() => {}}>
                <View style={styles.actionMenuHeader}>
                  <View>
                    <Text style={styles.actionMenuName}>{r.guest.firstName} {r.guest.lastName}</Text>
                    <Text style={styles.actionMenuSub}>{r.timeSlot} · {r.partySize} couvert{r.partySize > 1 ? 's' : ''}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: STATUS_CONFIG[r.status]?.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: STATUS_CONFIG[r.status]?.color }]}>
                      {STATUS_CONFIG[r.status]?.label}
                    </Text>
                  </View>
                </View>

                {!hasActions ? (
                  <Text style={styles.actionMenuEmpty}>Aucune action disponible</Text>
                ) : (
                  <View style={styles.actionMenuList}>
                    {(r.status === 'pending' || r.status === 'confirmed') && (
                      <Pressable
                        style={[styles.actionMenuItem, { borderLeftColor: '#EF4444' }]}
                        onPress={() => { setActionMenuId(null); handleAction(r.id, 'cancel'); }}
                      >
                        <View style={[styles.actionMenuIcon, { backgroundColor: '#FEF2F2' }]}>
                          <XIcon size={16} color="#EF4444" />
                        </View>
                        <View style={styles.actionMenuItemText}>
                          <Text style={styles.actionMenuItemLabel}>Annuler</Text>
                          <Text style={styles.actionMenuItemDesc}>Annuler et notifier le client</Text>
                        </View>
                      </Pressable>
                    )}
                    {r.status === 'confirmed' && (
                      <Pressable
                        style={[styles.actionMenuItem, { borderLeftColor: '#64748B' }]}
                        onPress={() => { setActionMenuId(null); handleAction(r.id, 'no_show'); }}
                      >
                        <View style={[styles.actionMenuIcon, { backgroundColor: '#F1F5F9' }]}>
                          <AlertTriangle size={16} color="#64748B" />
                        </View>
                        <View style={styles.actionMenuItemText}>
                          <Text style={styles.actionMenuItemLabel}>No-show</Text>
                          <Text style={styles.actionMenuItemDesc}>Le client ne s'est pas présenté</Text>
                        </View>
                      </Pressable>
                    )}
                    {r.status === 'confirmed' && (
                      <Pressable
                        style={[styles.actionMenuItem, { borderLeftColor: '#3B82F6' }]}
                        onPress={() => { setActionMenuId(null); handleAction(r.id, 'complete'); }}
                      >
                        <View style={[styles.actionMenuIcon, { backgroundColor: '#EFF6FF' }]}>
                          <CheckCircle size={16} color="#3B82F6" />
                        </View>
                        <View style={styles.actionMenuItemText}>
                          <Text style={styles.actionMenuItemLabel}>Terminer</Text>
                          <Text style={styles.actionMenuItemDesc}>Marquer la réservation comme terminée</Text>
                        </View>
                      </Pressable>
                    )}
                    {r.status === 'no_show' && r.cardImprint?.status === 'failed' && (
                      <Pressable
                        style={[styles.actionMenuItem, { borderLeftColor: '#F97316' }]}
                        onPress={() => handleRetryCharge(r.id)}
                      >
                        <View style={[styles.actionMenuIcon, { backgroundColor: '#FFF7ED' }]}>
                          <RefreshCw size={16} color="#F97316" />
                        </View>
                        <View style={styles.actionMenuItemText}>
                          <Text style={styles.actionMenuItemLabel}>Retenter le débit</Text>
                          <Text style={styles.actionMenuItemDesc}>Retenter le débit de l'empreinte bancaire</Text>
                        </View>
                      </Pressable>
                    )}
                  </View>
                )}

                <Pressable style={styles.actionMenuClose} onPress={() => setActionMenuId(null)}>
                  <Text style={styles.actionMenuCloseText}>Fermer</Text>
                </Pressable>
              </Pressable>
            </Pressable>
          </Modal>
        );
      })()}

      {/* Create reservation modal */}
      <CreateReservationModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        services={reservation.services}
        schedules={reservation.schedules}
        onSubmit={reservation.createReservation}
      />

      {/* Pagination */}
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pageTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pageTitle: { fontSize: 22, fontWeight: '700', color: '#1E293B' },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2A2E33',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  createButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Date navigation
  dateNavContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  dateNavSide: {
    width: 160,
    alignItems: 'flex-start',
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  dateArrowButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...(Platform.OS === 'web' && { cursor: 'pointer', userSelect: 'none' } as any),
  },
  dateLabelButton: {
    width: 280,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  dateText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    textTransform: 'capitalize',
    ...(Platform.OS === 'web' && { userSelect: 'none' } as any),
  },
  todayChip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  todayChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },

  // Calendar dropdown
  calendarDropdownWrapper: {
    position: 'relative',
    alignItems: 'center',
    zIndex: 100,
    marginBottom: 8,
  },
  calendarBackdrop: {
    position: 'absolute' as const,
    top: -200,
    left: -500,
    right: -500,
    bottom: -500,
  },
  calendarDropdown: {
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
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
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
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calDayEmpty: {
    width: '14.28%',
    height: 36,
  },
  calDay: {
    width: '14.28%',
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  calDaySelected: {
    backgroundColor: '#2A2E33',
  },
  calDayToday: {
    backgroundColor: '#EFF6FF',
  },
  calDayText: {
    fontSize: 14,
    color: '#1E293B',
  },
  calDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  calDayTextToday: {
    color: '#3B82F6',
    fontWeight: '700',
  },

  // Filters
  filtersRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  filterField: { width: 160 },
  filterLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 4 },
  clearButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  clearButtonText: { fontSize: 13, color: '#64748B', fontWeight: '500' },

  // Table
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#94A3B8', marginBottom: 4 },
  emptySubtext: { fontSize: 14, color: '#CBD5E1' },
  tableContainer: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerCell: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    alignItems: 'center',
  },
  cell: { fontSize: 14, color: '#1E293B' },
  cellSub: { fontSize: 12, color: '#94A3B8' },
  deletedService: { color: '#EF4444', fontStyle: 'italic' },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusBadgeText: { fontSize: 12, fontWeight: '600' },
  actionsCell: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtonConfirm: { backgroundColor: '#F0FDF4' },
  actionButtonCancel: { backgroundColor: '#FEF2F2' },
  actionButtonCharge: { backgroundColor: '#FFF7ED' },
  actionButtonNoShow: { backgroundColor: '#F1F5F9' },
  actionButtonComplete: { backgroundColor: '#EFF6FF' },
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
  imprintBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  imprintCardInfo: {
    fontSize: 11,
    color: '#94A3B8',
  },

  // Pagination
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 20,
  },
  pageButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  pageButtonDisabled: { opacity: 0.5 },
  pageText: { fontSize: 14, color: '#64748B' },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: getColorWithOpacity(colors.brand.dark, 0.5),
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
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
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
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  modalConfirmButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Menu button (··· in table row)
  menuButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignSelf: 'center',
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },

  // Action menu modal
  actionMenuContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 0,
    width: '90%',
    maxWidth: 420,
    overflow: 'hidden',
  },
  actionMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
  },
  actionMenuName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  actionMenuSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  actionMenuEmpty: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 24,
  },
  actionMenuList: {
    paddingVertical: 8,
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
    marginHorizontal: 12,
    marginVertical: 3,
    borderRadius: 10,
    backgroundColor: '#FAFAFA',
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  actionMenuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionMenuItemText: {
    flex: 1,
  },
  actionMenuItemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  actionMenuItemDesc: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  actionMenuClose: {
    margin: 12,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  actionMenuCloseText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
});
