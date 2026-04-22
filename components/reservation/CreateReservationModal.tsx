import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, TextInput, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { X as XIcon, ChevronDown, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import { useToast } from '~/components/ToastProvider';
import type { ReservationService, ReservationSchedule, CreateManualReservationDto } from '~/types/reservation.types';
import { colors } from '~/theme';
import { getColorWithOpacity } from '~/lib/color-utils';

interface FilterOption { label: string; value: string; }

function ModalSelect({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: FilterOption[]; placeholder?: string }) {
  if (Platform.OS === 'web') {
    return (
      <View style={{ position: 'relative' }}>
        <select
          value={value}
          onChange={(e) => onChange((e.target as HTMLSelectElement).value)}
          style={{
            height: 42,
            width: '100%',
            paddingLeft: 12,
            paddingRight: 32,
            fontSize: 14,
            color: value ? '#1E293B' : '#9CA3AF',
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 8,
            outline: 'none',
            appearance: 'none',
            cursor: 'pointer',
          } as any}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <View style={{ position: 'absolute', right: 10, top: 0, bottom: 0, justifyContent: 'center', pointerEvents: 'none' } as any}>
          <ChevronDown size={14} color="#64748B" />
        </View>
      </View>
    );
  }
  return (
    <View style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, backgroundColor: '#F8FAFC', overflow: 'hidden' }}>
      <Picker selectedValue={value} onValueChange={onChange} style={{ height: 42 }}>
        {placeholder && <Picker.Item label={placeholder} value="" enabled={false} />}
        {options.map(o => <Picker.Item key={o.value} label={o.label} value={o.value} />)}
      </Picker>
    </View>
  );
}

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

interface CreateReservationModalProps {
  visible: boolean;
  onClose: () => void;
  services: ReservationService[];
  schedules: ReservationSchedule[];
  onSubmit: (data: CreateManualReservationDto) => Promise<any>;
}

function generateTimeSlotsForService(
  service: ReservationService,
  schedules: ReservationSchedule[],
  date: string,
): string[] {
  if (!date || !service) return [];

  const d = new Date(date + 'T00:00:00');
  // JS: 0=Sun => map to 1=Mon...7=Sun
  const jsDay = d.getDay();
  const dayOfWeek = jsDay === 0 ? 7 : jsDay;

  const serviceSchedules = schedules.filter(
    s => s.serviceId === service.id && s.dayOfWeek === dayOfWeek
  );
  if (serviceSchedules.length === 0) return [];

  const slots: string[] = [];
  const interval = service.slotIntervalMinutes || 30;

  for (const schedule of serviceSchedules) {
    const [startH, startM] = schedule.startTime.split(':').map(Number);
    const [endH, endM] = schedule.endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    for (let m = startMinutes; m < endMinutes; m += interval) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      slots.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
    }
  }

  return [...new Set(slots)].sort();
}

export function CreateReservationModal({ visible, onClose, services, schedules, onSubmit }: CreateReservationModalProps) {
  const { showToast } = useToast();

  const today = new Date().toISOString().split('T')[0];

  // Form state
  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState(today);
  const [timeSlot, setTimeSlot] = useState('');
  const [partySize, setPartySize] = useState('2');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Calendar state
  const [showCalendar, setShowCalendar] = useState(false);
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());

  // Capacity override modal
  const [capacityError, setCapacityError] = useState<{ currentCovers: number; maxCapacity: number; requestedPartySize: number } | null>(null);

  const selectedService = services.find(s => s.id === serviceId) || null;
  const timeSlots = selectedService ? generateTimeSlotsForService(selectedService, schedules, date) : [];

  const resetForm = useCallback(() => {
    setServiceId('');
    setDate(today);
    setTimeSlot('');
    setPartySize('2');
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setNotes('');
    setCapacityError(null);
  }, [today]);

  const handleClose = () => {
    if (isSaving) return;
    resetForm();
    onClose();
  };

  const validate = (): string | null => {
    if (!serviceId) return 'Veuillez sélectionner un service';
    if (!date) return 'Veuillez sélectionner une date';
    if (!timeSlot) return 'Veuillez sélectionner un créneau';
    const ps = parseInt(partySize);
    if (!ps || ps < 1 || ps > 100) return 'Le nombre de couverts doit être entre 1 et 100';
    if (!firstName.trim()) return 'Le prénom est requis';
    if (!lastName.trim()) return 'Le nom est requis';
    if (!email.trim()) return "L'email est requis";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "L'email n'est pas valide";
    if (notes.length > 1000) return 'Les notes ne peuvent pas dépasser 1000 caractères';
    return null;
  };

  const doSubmit = async (forceOverCapacity = false) => {
    const error = validate();
    if (error) {
      showToast(error, 'error');
      return;
    }

    setIsSaving(true);
    try {
      const data: CreateManualReservationDto = {
        serviceId,
        date,
        timeSlot,
        partySize: parseInt(partySize),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        ...(phone.trim() && { phone: phone.trim() }),
        ...(notes.trim() && { notes: notes.trim() }),
        ...(forceOverCapacity && { forceOverCapacity: true }),
      };

      await onSubmit(data);
      showToast('Réservation créée', 'success');
      resetForm();
      onClose();
    } catch (err: any) {
      const errorData = err?.response?.data?.error;
      if (errorData?.code === 'SLOT_CAPACITY_EXCEEDED_MANUAL') {
        setCapacityError(errorData.details);
      } else {
        showToast(errorData?.message || 'Erreur lors de la création', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleForceOverCapacity = async () => {
    setCapacityError(null);
    await doSubmit(true);
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
    setDate(`${calYear}-${m}-${d}`);
    setTimeSlot('');
    setShowCalendar(false);
  };

  const openCalendar = () => {
    const d = new Date(date + 'T00:00:00');
    setCalMonth(d.getMonth());
    setCalYear(d.getFullYear());
    setShowCalendar(true);
  };

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const activeServices = services.filter(s => s.isActive);

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
        <Pressable style={styles.overlay} onPress={handleClose}>
          <Pressable style={styles.content} onPress={() => {}}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Nouvelle réservation</Text>
              <Pressable onPress={handleClose} style={styles.closeButton}>
                <XIcon size={20} color="#64748B" />
              </Pressable>
            </View>

            <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
              {/* Service */}
              <View style={styles.field}>
                <Text style={styles.label}>Service *</Text>
                <ModalSelect
                  value={serviceId}
                  onChange={(v) => { setServiceId(v); setTimeSlot(''); }}
                  options={activeServices.map(s => ({ label: s.name, value: s.id }))}
                  placeholder="Sélectionner un service"
                />
              </View>

              {/* Date */}
              <View style={styles.field}>
                <Text style={styles.label}>Date *</Text>
                <Pressable onPress={openCalendar} style={styles.dateButton}>
                  <Text style={styles.dateButtonText}>{formatDateLabel(date)}</Text>
                  <ChevronDown size={14} color="#64748B" />
                </Pressable>

                {showCalendar && (
                  <View style={styles.calendarContainer}>
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
                        const isSelected = date === dateStr;
                        const isTodayDay = dateStr === today;
                        const isPast = dateStr < today;
                        return (
                          <Pressable
                            key={`d-${day}`}
                            style={[styles.calDay, isSelected && styles.calDaySelected, isTodayDay && !isSelected && styles.calDayToday, isPast && styles.calDayDisabled]}
                            onPress={() => !isPast && selectCalendarDay(day)}
                            disabled={isPast}
                          >
                            <Text style={[styles.calDayText, isSelected && styles.calDayTextSelected, isTodayDay && !isSelected && styles.calDayTextToday, isPast && styles.calDayTextDisabled]}>
                              {day}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>

              {/* Time Slot */}
              <View style={styles.field}>
                <Text style={styles.label}>Créneau *</Text>
                {!serviceId ? (
                  <Text style={styles.hint}>Sélectionnez d'abord un service</Text>
                ) : timeSlots.length === 0 ? (
                  <Text style={styles.hint}>Aucun créneau disponible pour cette date</Text>
                ) : (
                  <ModalSelect
                    value={timeSlot}
                    onChange={setTimeSlot}
                    options={timeSlots.map(t => ({ label: t, value: t }))}
                    placeholder="Sélectionner un créneau"
                  />
                )}
              </View>

              {/* Party Size */}
              <View style={styles.field}>
                <Text style={styles.label}>Nombre de couverts *</Text>
                <TextInput
                  style={styles.input}
                  value={partySize}
                  onChangeText={setPartySize}
                  keyboardType="number-pad"
                  placeholder="2"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Client Info */}
              <Text style={styles.sectionTitle}>Informations client</Text>

              <View style={styles.row}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Prénom *</Text>
                  <TextInput
                    style={styles.input}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Prénom"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Nom *</Text>
                  <TextInput
                    style={styles.input}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Nom"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Email *</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="email@exemple.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Téléphone</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Optionnel"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Notes internes, demandes spéciales..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <Pressable style={styles.cancelButton} onPress={handleClose} disabled={isSaving}>
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </Pressable>
              <Pressable
                style={[styles.submitButton, isSaving && styles.submitButtonDisabled]}
                onPress={() => doSubmit(false)}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Créer la réservation</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Capacity exceeded confirmation modal */}
      <Modal visible={capacityError !== null} transparent animationType="fade" onRequestClose={() => setCapacityError(null)}>
        <Pressable style={styles.overlay} onPress={() => setCapacityError(null)}>
          <Pressable style={styles.capacityModal} onPress={() => {}}>
            <View style={styles.capacityIcon}>
              <AlertTriangle size={28} color="#F59E0B" />
            </View>
            <Text style={styles.capacityTitle}>Capacité dépassée</Text>
            <Text style={styles.capacityDescription}>
              Ce créneau a une capacité de {capacityError?.maxCapacity} couvert{(capacityError?.maxCapacity ?? 0) > 1 ? 's' : ''} ({capacityError?.currentCovers} déjà réservé{(capacityError?.currentCovers ?? 0) > 1 ? 's' : ''}) et vous souhaitez en ajouter {capacityError?.requestedPartySize}.{'\n'}
              Voulez-vous forcer la réservation ?
            </Text>
            <View style={styles.capacityActions}>
              <Pressable style={styles.cancelButton} onPress={() => setCapacityError(null)} disabled={isSaving}>
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </Pressable>
              <Pressable
                style={[styles.forceButton, isSaving && styles.submitButtonDisabled]}
                onPress={handleForceOverCapacity}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.forceButtonText}>Forcer la réservation</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: getColorWithOpacity(colors.brand.dark, 0.5),
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '92%',
    maxWidth: 520,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  closeButton: {
    padding: 4,
    borderRadius: 8,
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 24,
    paddingBottom: 8,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 8,
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    height: 42,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#1E293B',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  hint: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  dateButton: {
    height: 42,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  dateButtonText: {
    fontSize: 14,
    color: '#1E293B',
    textTransform: 'capitalize',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  submitButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#2A2E33',
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Calendar
  calendarContainer: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  calNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  calNavBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  calNavText: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  calWeekdays: { flexDirection: 'row', marginBottom: 4 },
  calWeekdayText: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600', color: '#94A3B8' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calDayEmpty: { width: '14.28%', height: 32 },
  calDay: {
    width: '14.28%',
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  calDaySelected: { backgroundColor: '#2A2E33' },
  calDayToday: { backgroundColor: '#EFF6FF' },
  calDayDisabled: { opacity: 0.35 },
  calDayText: { fontSize: 13, color: '#1E293B' },
  calDayTextSelected: { color: '#FFFFFF', fontWeight: '700' },
  calDayTextToday: { color: '#3B82F6', fontWeight: '700' },
  calDayTextDisabled: { color: '#CBD5E1' },

  // Capacity override modal
  capacityModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 28,
    width: '90%',
    maxWidth: 420,
    alignItems: 'center',
  },
  capacityIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFBEB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  capacityTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  capacityDescription: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  capacityActions: {
    flexDirection: 'row',
    gap: 10,
  },
  forceButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F59E0B',
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  forceButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
