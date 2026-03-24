import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Platform } from 'react-native';
import { Plus, Trash2, X } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import { useToast } from '~/components/ToastProvider';
import { DeleteConfirmationModal } from '~/components/ui/DeleteConfirmationModal';
import type {
  ReservationService,
  ReservationSchedule,
  CreateReservationScheduleDto,
} from '~/types/reservation.types';

const DAYS = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 7, label: 'Dimanche' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

interface ReservationSchedulesProps {
  reservation: {
    services: ReservationService[];
    schedules: ReservationSchedule[];
    loadServices: () => Promise<ReservationService[]>;
    loadSchedules: () => Promise<ReservationSchedule[]>;
    createSchedule: (data: CreateReservationScheduleDto) => Promise<ReservationSchedule>;
    deleteSchedule: (id: string) => Promise<void>;
  };
}

export function ReservationSchedules({ reservation }: ReservationSchedulesProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [startHour, setStartHour] = useState('12');
  const [startMinute, setStartMinute] = useState('00');
  const [endHour, setEndHour] = useState('14');
  const [endMinute, setEndMinute] = useState('00');
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ReservationSchedule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    Promise.all([
      reservation.loadServices(),
      reservation.loadSchedules(),
    ])
      .catch(() => showToast('Erreur chargement des horaires', 'error'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (reservation.services.length > 0 && !selectedServiceId) {
      setSelectedServiceId(reservation.services[0].id);
    }
  }, [reservation.services]);

  // Group schedules by day
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

  const getServiceName = useCallback((serviceId: string) => {
    return reservation.services.find(s => s.id === serviceId)?.name || 'Service inconnu';
  }, [reservation.services]);

  const getServiceColor = useCallback((serviceId: string) => {
    return reservation.services.find(s => s.id === serviceId)?.color || '#3B82F6';
  }, [reservation.services]);

  const handleCreate = async () => {
    if (!selectedServiceId) {
      showToast('Sélectionnez un service', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await reservation.createSchedule({
        serviceId: selectedServiceId,
        dayOfWeek: selectedDay,
        startTime: `${startHour}:${startMinute}`,
        endTime: `${endHour}:${endMinute}`,
      });
      showToast('Créneau ajouté', 'success');
      setShowForm(false);
    } catch (error: any) {
      const message = error?.response?.data?.errors?.[0]?.message
        || error?.response?.data?.error
        || 'Erreur lors de la création';
      showToast(message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await reservation.deleteSchedule(deleteTarget.id);
      showToast('Créneau supprimé', 'success');
      setDeleteTarget(null);
    } catch (error: any) {
      showToast('Erreur lors de la suppression', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2A2E33" />
      </View>
    );
  }

  if (reservation.services.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.pageTitle}>Horaires hebdomadaires</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Créez d'abord un service</Text>
          <Text style={styles.emptySubtext}>Les horaires sont liés aux services de réservation</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.pageTitle}>Horaires hebdomadaires</Text>
          <Text style={styles.pageSubtitle}>Définissez les plages horaires par service et par jour</Text>
        </View>
        <Pressable style={styles.addButton} onPress={() => setShowForm(true)}>
          <Plus size={18} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Ajouter</Text>
        </Pressable>
      </View>

      {/* Form */}
      {showForm && (
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Nouveau créneau</Text>
            <Pressable onPress={() => setShowForm(false)}>
              <X size={20} color="#64748B" />
            </Pressable>
          </View>

          <View style={styles.formFields}>
            <View style={styles.formRow}>
              <View style={[styles.formField, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Service</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedServiceId}
                    onValueChange={setSelectedServiceId}
                    style={styles.picker}
                  >
                    {reservation.services.map((service) => (
                      <Picker.Item key={service.id} label={service.name} value={service.id} />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={[styles.formField, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Jour</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedDay}
                    onValueChange={setSelectedDay}
                    style={styles.picker}
                  >
                    {DAYS.map((day) => (
                      <Picker.Item key={day.value} label={day.label} value={day.value} />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formField, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Heure début</Text>
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
                <Text style={styles.fieldLabel}>Heure fin</Text>
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

      {/* Schedule grid */}
      <View style={styles.grid}>
        {DAYS.map((day) => {
          const daySchedules = schedulesByDay[day.value] || [];
          return (
            <View key={day.value} style={styles.dayRow}>
              <View style={styles.dayLabel}>
                <Text style={styles.dayText}>{day.label}</Text>
              </View>
              <View style={styles.daySlots}>
                {daySchedules.length === 0 ? (
                  <Text style={styles.noSlotText}>Fermé</Text>
                ) : (
                  daySchedules.map((schedule) => (
                    <View
                      key={schedule.id}
                      style={[styles.slotChip, { backgroundColor: getServiceColor(schedule.serviceId) + '15', borderColor: getServiceColor(schedule.serviceId) + '40' }]}
                    >
                      <View style={[styles.slotDot, { backgroundColor: getServiceColor(schedule.serviceId) }]} />
                      <Text style={[styles.slotText, { color: getServiceColor(schedule.serviceId) }]}>
                        {getServiceName(schedule.serviceId)} · {schedule.startTime} - {schedule.endTime}
                      </Text>
                      <Pressable
                        style={styles.slotDelete}
                        onPress={() => setDeleteTarget(schedule)}
                      >
                        <Trash2 size={12} color="#EF4444" />
                      </Pressable>
                    </View>
                  ))
                )}
              </View>
            </View>
          );
        })}
      </View>

      <DeleteConfirmationModal
        isVisible={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        entityName={deleteTarget ? `${getServiceName(deleteTarget.serviceId)} - ${DAYS.find(d => d.value === deleteTarget.dayOfWeek)?.label}` : ''}
        entityType="le créneau"
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
  timeRow: { flexDirection: 'row', gap: 8 },
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
  emptyText: { fontSize: 16, fontWeight: '600', color: '#94A3B8', marginBottom: 4 },
  emptySubtext: { fontSize: 14, color: '#CBD5E1' },
  grid: { gap: 2 },
  dayRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 12,
  },
  dayLabel: {
    width: 100,
    justifyContent: 'center',
  },
  dayText: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  daySlots: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  noSlotText: { fontSize: 13, color: '#CBD5E1', fontStyle: 'italic' },
  slotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  slotDot: { width: 6, height: 6, borderRadius: 3 },
  slotText: { fontSize: 13, fontWeight: '500' },
  slotDelete: {
    padding: 4,
    marginLeft: 4,
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
});
