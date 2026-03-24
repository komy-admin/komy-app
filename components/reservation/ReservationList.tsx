import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Platform } from 'react-native';
import { ChevronLeft, ChevronRight, Check, X as XIcon, AlertTriangle, CheckCircle } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import { useToast } from '~/components/ToastProvider';
import type {
  Reservation,
  ReservationService,
  ReservationStatus,
  ReservationProfessionalProfile,
} from '~/types/reservation.types';

const STATUS_CONFIG: Record<ReservationStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'En attente', color: '#F59E0B', bg: '#FFFBEB' },
  confirmed: { label: 'Confirmée', color: '#10B981', bg: '#F0FDF4' },
  cancelled: { label: 'Annulée', color: '#EF4444', bg: '#FEF2F2' },
  no_show: { label: 'No-show', color: '#64748B', bg: '#F1F5F9' },
  completed: { label: 'Terminée', color: '#3B82F6', bg: '#EFF6FF' },
};

interface ReservationListProps {
  reservation: {
    services: ReservationService[];
    reservations: Reservation[];
    reservationsMeta: any;
    loadServices: () => Promise<ReservationService[]>;
    loadReservations: (params?: any) => Promise<any>;
    confirmReservation: (id: string) => Promise<Reservation>;
    cancelReservation: (id: string) => Promise<Reservation>;
    noShowReservation: (id: string) => Promise<Reservation>;
    completeReservation: (id: string) => Promise<Reservation>;
  };
}

export function ReservationList({ reservation }: ReservationListProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { showToast } = useToast();

  // Filters
  const today = new Date().toISOString().split('T')[0];
  const [filterDate, setFilterDate] = useState(today);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterServiceId, setFilterServiceId] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

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

  const handleAction = async (id: string, action: 'confirm' | 'cancel' | 'no_show' | 'complete') => {
    setActionLoading(id);
    try {
      switch (action) {
        case 'confirm':
          await reservation.confirmReservation(id);
          showToast('Réservation confirmée', 'success');
          break;
        case 'cancel':
          await reservation.cancelReservation(id);
          showToast('Réservation annulée', 'success');
          break;
        case 'no_show':
          await reservation.noShowReservation(id);
          showToast('Marqué no-show', 'success');
          break;
        case 'complete':
          await reservation.completeReservation(id);
          showToast('Réservation terminée', 'success');
          break;
      }
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

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Réservations</Text>

      {/* Date navigation */}
      <View style={styles.dateNav}>
        <Pressable onPress={() => navigateDate(-1)} style={styles.dateButton}>
          <ChevronLeft size={20} color="#64748B" />
        </Pressable>
        <Pressable onPress={() => setFilterDate(today)} style={styles.todayButton}>
          <Text style={styles.dateText}>{formatDateLabel(filterDate)}</Text>
        </Pressable>
        <Pressable onPress={() => navigateDate(1)} style={styles.dateButton}>
          <ChevronRight size={20} color="#64748B" />
        </Pressable>
      </View>

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
                </View>
                <View style={[styles.actionsCell, { flex: 1.5 }]}>
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#64748B" />
                  ) : (
                    <>
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
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  dateButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  todayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  dateText: { fontSize: 15, fontWeight: '600', color: '#1E293B', textTransform: 'capitalize' },
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
});
