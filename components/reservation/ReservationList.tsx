import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Platform, Modal, TextInput } from 'react-native';
import { ChevronLeft, ChevronRight, Check, X as XIcon, AlertTriangle, CheckCircle } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import { useToast } from '~/components/ToastProvider';
import type {
  Reservation,
  ReservationService,
  ReservationStatus,
} from '~/types/reservation.types';

const STATUS_CONFIG: Record<ReservationStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'En attente', color: '#F59E0B', bg: '#FFFBEB' },
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
    reservations: Reservation[];
    reservationsMeta: any;
    loadServices: () => Promise<ReservationService[]>;
    loadReservations: (params?: any) => Promise<any>;
    confirmReservation: (id: string) => Promise<Reservation>;
    cancelReservation: (id: string, reason?: string) => Promise<Reservation>;
    noShowReservation: (id: string) => Promise<Reservation>;
    completeReservation: (id: string) => Promise<Reservation>;
  };
}

export function ReservationList({ reservation }: ReservationListProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [cancelModalId, setCancelModalId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [noShowModalId, setNoShowModalId] = useState<string | null>(null);
  const [confirmModalId, setConfirmModalId] = useState<string | null>(null);
  const [completeModalId, setCompleteModalId] = useState<string | null>(null);
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
      await reservation.loadServices();
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
    const date = new Date(filterDate);
    date.setDate(date.getDate() + direction);
    setFilterDate(date.toISOString().split('T')[0]);
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

  const handleAction = async (id: string, action: 'confirm' | 'cancel' | 'no_show' | 'complete') => {
    if (action === 'cancel') {
      setCancelModalId(id);
      setCancelReason('');
      return;
    }
    if (action === 'no_show') {
      setNoShowModalId(id);
      return;
    }
    if (action === 'confirm') {
      setConfirmModalId(id);
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

  const handleConfirmNoShow = async () => {
    if (!noShowModalId) return;
    const id = noShowModalId;
    setNoShowModalId(null);
    setActionLoading(id);
    try {
      await reservation.noShowReservation(id);
      showToast('Marqué no-show', 'success');
    } catch (error: any) {
      showToast(error?.response?.data?.error || 'Erreur', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmConfirm = async () => {
    if (!confirmModalId) return;
    const id = confirmModalId;
    setConfirmModalId(null);
    setActionLoading(id);
    try {
      await reservation.confirmReservation(id);
      showToast('Réservation confirmée', 'success');
    } catch (error: any) {
      showToast(error?.response?.data?.error || 'Erreur', 'error');
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
      <Text style={styles.pageTitle}>Réservations</Text>

      {/* Date navigation with calendar */}
      <View style={styles.dateNavContainer}>
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
      </View>

      {!isToday && (
        <View style={styles.todayRow}>
          <Pressable onPress={() => { setFilterDate(today); setCurrentPage(1); }} style={styles.todayChip}>
            <Text style={styles.todayChipText}>Revenir à aujourd'hui</Text>
          </Pressable>
        </View>
      )}

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
        <View style={[styles.filterField, { flex: 1 }]}>
          <Text style={styles.filterLabel}>Statut</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={filterStatus}
              onValueChange={(v) => { setFilterStatus(v); setCurrentPage(1); }}
              style={styles.picker}
            >
              <Picker.Item label="Tous" value="" />
              <Picker.Item label="En attente" value="pending" />
              <Picker.Item label="Confirmée" value="confirmed" />
              <Picker.Item label="Annulée" value="cancelled" />
              <Picker.Item label="No-show" value="no_show" />
              <Picker.Item label="Terminée" value="completed" />
            </Picker>
          </View>
        </View>

        <View style={[styles.filterField, { flex: 1 }]}>
          <Text style={styles.filterLabel}>Service</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={filterServiceId}
              onValueChange={(v) => { setFilterServiceId(v); setCurrentPage(1); }}
              style={styles.picker}
            >
              <Picker.Item label="Tous" value="" />
              {reservation.services.map(s => (
                <Picker.Item key={s.id} label={s.name} value={s.id} />
              ))}
            </Picker>
          </View>
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
            <Text style={[styles.headerCell, { flex: 1 }]}>Heure</Text>
            <Text style={[styles.headerCell, { flex: 2 }]}>Client</Text>
            <Text style={[styles.headerCell, { flex: 1 }]}>Couverts</Text>
            <Text style={[styles.headerCell, { flex: 1.5 }]}>Service</Text>
            <Text style={[styles.headerCell, { flex: 1 }]}>Statut</Text>
            <Text style={[styles.headerCell, { flex: 1.5 }]}>Actions</Text>
          </View>

          {/* Rows */}
          {reservation.reservations.map((r) => {
            const status = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
            const isProcessing = actionLoading === r.id;

            return (
              <View key={r.id} style={styles.tableRow}>
                <Text style={[styles.cell, { flex: 1, fontWeight: '600' }]}>
                  {r.timeSlot}
                </Text>
                <View style={{ flex: 2 }}>
                  <Text style={styles.cell} numberOfLines={1}>
                    {r.guest.firstName} {r.guest.lastName}
                  </Text>
                  <Text style={styles.cellSub} numberOfLines={1}>{r.guest.email}</Text>
                </View>
                <Text style={[styles.cell, { flex: 1, textAlign: 'center' }]}>
                  {r.partySize}
                </Text>
                <Text style={[styles.cell, { flex: 1.5 }, !r.serviceId && styles.deletedService]} numberOfLines={1}>
                  {getServiceName(r.serviceId)}
                </Text>
                <View style={{ flex: 1 }}>
                  <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: status.color }]}>
                      {status.label}
                    </Text>
                  </View>
                  {r.status === 'cancelled' && r.cancellationReason ? (
                    <Text style={styles.cancellationReason} numberOfLines={2}>
                      {r.cancellationReason}
                    </Text>
                  ) : null}
                </View>
                <View style={[styles.actionsCell, { flex: 1.5 }]}>
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#64748B" />
                  ) : (
                    <>
                      {r.status === 'pending' && (
                        <Pressable
                          style={[styles.actionButton, { backgroundColor: '#F0FDF4' }]}
                          onPress={() => handleAction(r.id, 'confirm')}
                        >
                          <Check size={14} color="#10B981" />
                        </Pressable>
                      )}
                      {(r.status === 'pending' || r.status === 'confirmed') && (
                        <Pressable
                          style={[styles.actionButton, { backgroundColor: '#FEF2F2' }]}
                          onPress={() => handleAction(r.id, 'cancel')}
                        >
                          <XIcon size={14} color="#EF4444" />
                        </Pressable>
                      )}
                      {r.status === 'confirmed' && (
                        <>
                          <Pressable
                            style={[styles.actionButton, { backgroundColor: '#F1F5F9' }]}
                            onPress={() => handleAction(r.id, 'no_show')}
                          >
                            <AlertTriangle size={14} color="#64748B" />
                          </Pressable>
                          <Pressable
                            style={[styles.actionButton, { backgroundColor: '#EFF6FF' }]}
                            onPress={() => handleAction(r.id, 'complete')}
                          >
                            <CheckCircle size={14} color="#3B82F6" />
                          </Pressable>
                        </>
                      )}
                    </>
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
              Êtes-vous sûr de vouloir marquer cette réservation comme no-show ?
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={() => setNoShowModalId(null)}
              >
                <Text style={styles.modalCancelButtonText}>Retour</Text>
              </Pressable>
              <Pressable
                style={[styles.modalConfirmButton, { backgroundColor: '#64748B' }]}
                onPress={handleConfirmNoShow}
              >
                <Text style={styles.modalConfirmButtonText}>Confirmer no-show</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

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

      {/* Confirm reservation modal */}
      <Modal
        visible={confirmModalId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmModalId(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setConfirmModalId(null)}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <Text style={styles.modalTitle}>Confirmer la réservation</Text>
            <Text style={styles.modalDescription}>
              Êtes-vous sûr de vouloir confirmer cette réservation ?
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={() => setConfirmModalId(null)}
              >
                <Text style={styles.modalCancelButtonText}>Retour</Text>
              </Pressable>
              <Pressable
                style={[styles.modalConfirmButton, { backgroundColor: '#10B981' }]}
                onPress={handleConfirmConfirm}
              >
                <Text style={styles.modalConfirmButtonText}>Confirmer</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

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
  pageTitle: { fontSize: 22, fontWeight: '700', color: '#1E293B', marginBottom: 16 },

  // Date navigation
  dateNavContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
    position: 'relative',
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
  todayRow: {
    alignItems: 'center',
    marginBottom: 12,
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
  filterField: {},
  filterLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 4 },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 40,
    ...(Platform.OS === 'web' && {
      paddingHorizontal: 8,
      fontSize: 13,
      borderWidth: 0,
    }),
  },
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
  },
  actionButton: {
    padding: 6,
    borderRadius: 6,
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  cancellationReason: {
    fontSize: 11,
    color: '#EF4444',
    fontStyle: 'italic',
    marginTop: 4,
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
});
