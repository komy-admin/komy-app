import React, { useCallback, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Pressable, Platform, Keyboard, Modal, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { X, ChevronDown, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react-native';
import { KeyboardAwareScrollViewWrapper } from '~/components/Keyboard';
import { useToast } from '~/components/ToastProvider';
import { useFormErrors } from '~/hooks/useFormErrors';
import { FormFieldError } from '~/components/ui/FormFieldError';
import type {
  ReservationService,
  ReservationSchedule,
  CreateManualReservationDto,
} from '~/types/reservation.types';
import { nowInTz, todayIsoInTz } from '~/lib/date.utils';

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

interface SelectOption { label: string; value: string; }

function NativeSelect({ value, onChange, options, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
}) {
  if (Platform.OS === 'web') {
    return (
      <View style={selectStyles.wrapper}>
        <select
          value={value}
          onChange={(e) => onChange((e.target as HTMLSelectElement).value)}
          style={{ ...(selectStyles.webSelect as any), color: value ? '#1E293B' : '#9CA3AF' }}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <View style={selectStyles.webChevron as any} pointerEvents="none">
          <ChevronDown size={14} color="#64748B" />
        </View>
      </View>
    );
  }
  return (
    <View style={selectStyles.nativeWrapper}>
      <Picker selectedValue={value} onValueChange={onChange} style={selectStyles.nativePicker}>
        {placeholder && <Picker.Item label={placeholder} value="" enabled={false} />}
        {options.map((o) => <Picker.Item key={o.value} label={o.label} value={o.value} />)}
      </Picker>
    </View>
  );
}

const selectStyles = StyleSheet.create<any>({
  wrapper: { position: 'relative' },
  webSelect: {
    height: 44,
    width: '100%',
    paddingLeft: 12,
    paddingRight: 32,
    fontSize: 13,
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: 8,
    outline: 'none',
    appearance: 'none',
    cursor: 'pointer',
  },
  webChevron: {
    position: 'absolute',
    right: 10,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  nativeWrapper: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  nativePicker: { height: 44 },
});

function generateTimeSlotsForService(
  service: ReservationService,
  schedules: ReservationSchedule[],
  date: string,
): string[] {
  if (!date || !service) return [];
  // La chaîne "YYYY-MM-DD" est déjà sans ambiguïté de timezone pour le calcul du jour
  // de semaine : on force une heure neutre pour ne pas dépendre du runtime JS.
  const [y, m, d] = date.split('-').map(Number);
  // Zeller-like : calcul indépendant du fuseau via Date UTC.
  const dayOfWeekRaw = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const dayOfWeek = dayOfWeekRaw === 0 ? 7 : dayOfWeekRaw;

  const serviceSchedules = schedules.filter(
    (s) => s.serviceId === service.id && s.dayOfWeek === dayOfWeek,
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

export interface ReservationFormPanelProps {
  services: ReservationService[];
  schedules: ReservationSchedule[];
  timezone?: string;
  onSubmit: (data: CreateManualReservationDto) => Promise<unknown>;
  onCancel: () => void;
}

export const ReservationFormPanel: React.FC<ReservationFormPanelProps> = ({
  services,
  schedules,
  timezone,
  onSubmit,
  onCancel,
}) => {
  const { showToast } = useToast();
  const formErrors = useFormErrors();
  // "Aujourd'hui" dans la timezone du pro (fallback Europe/Paris) — évite que le
  // device d'un employé en déplacement affiche la veille.
  const tz = timezone || 'Europe/Paris';
  const today = todayIsoInTz(tz);
  const _nowTz = nowInTz(tz);

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

  const [showCalendar, setShowCalendar] = useState(false);
  const [calMonth, setCalMonth] = useState(() => _nowTz.month - 1);
  const [calYear, setCalYear] = useState(() => _nowTz.year);

  const [capacityError, setCapacityError] = useState<{
    currentCovers: number;
    maxCapacity: number;
    requestedPartySize: number;
  } | null>(null);

  const activeServices = useMemo(() => services.filter((s) => s.isActive), [services]);
  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId) || null,
    [services, serviceId],
  );
  const timeSlots = useMemo(
    () => (selectedService ? generateTimeSlotsForService(selectedService, schedules, date) : []),
    [selectedService, schedules, date],
  );

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
    formErrors.clearError('date');
  };

  const openCalendar = () => {
    const [y, m] = date.split('-').map(Number);
    setCalMonth(m - 1);
    setCalYear(y);
    setShowCalendar(true);
  };

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(`${dateStr}T12:00:00`);
    return d.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: tz,
    });
  };

  const validate = (): boolean => {
    formErrors.clearAll();
    let ok = true;
    if (!serviceId) { formErrors.setError('serviceId', 'Sélectionnez un service'); ok = false; }
    if (!date) { formErrors.setError('date', 'Sélectionnez une date'); ok = false; }
    if (!timeSlot) { formErrors.setError('timeSlot', 'Sélectionnez un créneau'); ok = false; }
    const ps = parseInt(partySize, 10);
    if (!ps || ps < 1 || ps > 100) { formErrors.setError('partySize', 'Entre 1 et 100'); ok = false; }
    if (!firstName.trim()) { formErrors.setError('firstName', 'Le prénom est requis'); ok = false; }
    if (!lastName.trim()) { formErrors.setError('lastName', 'Le nom est requis'); ok = false; }
    if (!email.trim()) { formErrors.setError('email', "L'email est requis"); ok = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      formErrors.setError('email', "L'email n'est pas valide"); ok = false;
    }
    if (notes.length > 1000) { formErrors.setError('notes', 'Max 1000 caractères'); ok = false; }
    return ok;
  };

  const doSubmit = useCallback(async (forceOverCapacity = false) => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      const data: CreateManualReservationDto = {
        serviceId,
        date,
        timeSlot,
        partySize: parseInt(partySize, 10),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        ...(phone.trim() && { phone: phone.trim() }),
        ...(notes.trim() && { notes: notes.trim() }),
        ...(forceOverCapacity && { forceOverCapacity: true }),
      };
      await onSubmit(data);
      showToast('Réservation créée', 'success');
      onCancel();
    } catch (err: any) {
      const errorData = err?.response?.data?.error;
      if (errorData?.code === 'SLOT_CAPACITY_EXCEEDED_MANUAL') {
        setCapacityError(errorData.details);
      } else {
        formErrors.handleError({ error: err, showToast, fallback: 'Erreur lors de la création' });
      }
    } finally {
      setIsSaving(false);
    }
  }, [serviceId, date, timeSlot, partySize, firstName, lastName, email, phone, notes, onSubmit, onCancel, formErrors, showToast]);

  return (
    <View style={styles.panelContent}>
      <View style={styles.panelHeader}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.panelTitle} numberOfLines={1} ellipsizeMode="tail">
            Nouvelle réservation
          </Text>
          <Text style={styles.panelSubtitle} numberOfLines={2} ellipsizeMode="tail">
            Créez une réservation manuelle pour un client
          </Text>
        </View>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onCancel}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={24} color="#64748B" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollViewWrapper
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        bottomOffset={20}
        scrollEventThrottle={16}
      >
        <Pressable
          style={styles.flexContainer}
          onPress={() => { if (Platform.OS !== 'web') Keyboard.dismiss(); }}
        >
          {/* Service */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Service</Text>
            <View style={formErrors.hasError('serviceId') ? styles.errorWrap : undefined}>
              <NativeSelect
                value={serviceId}
                onChange={(v) => { setServiceId(v); setTimeSlot(''); formErrors.clearError('serviceId'); }}
                options={activeServices.map((s) => ({ label: s.name, value: s.id }))}
                placeholder="Sélectionner un service"
              />
            </View>
            <FormFieldError message={formErrors.getError('serviceId')} />
          </View>

          {/* Date */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Date</Text>
            <Pressable onPress={openCalendar} style={[styles.dateButton, formErrors.hasError('date') && styles.dateButtonError]}>
              <Text style={styles.dateButtonText}>{formatDateLabel(date)}</Text>
              <ChevronDown size={14} color="#64748B" />
            </Pressable>

            {showCalendar && (
              <View style={styles.calendar}>
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
                  {WEEKDAY_LABELS.map((l) => (
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
                        style={[
                          styles.calDay,
                          isSelected && styles.calDaySelected,
                          isTodayDay && !isSelected && styles.calDayToday,
                          isPast && styles.calDayDisabled,
                        ]}
                        onPress={() => !isPast && selectCalendarDay(day)}
                        disabled={isPast}
                      >
                        <Text
                          style={[
                            styles.calDayText,
                            isSelected && styles.calDayTextSelected,
                            isTodayDay && !isSelected && styles.calDayTextToday,
                            isPast && styles.calDayTextDisabled,
                          ]}
                        >
                          {day}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
            <FormFieldError message={formErrors.getError('date')} />
          </View>

          {/* Time Slot */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Créneau</Text>
            {!serviceId ? (
              <Text style={styles.hint}>Sélectionnez d'abord un service</Text>
            ) : timeSlots.length === 0 ? (
              <Text style={styles.hint}>Aucun créneau disponible pour cette date</Text>
            ) : (
              <View style={formErrors.hasError('timeSlot') ? styles.errorWrap : undefined}>
                <NativeSelect
                  value={timeSlot}
                  onChange={(v) => { setTimeSlot(v); formErrors.clearError('timeSlot'); }}
                  options={timeSlots.map((t) => ({ label: t, value: t }))}
                  placeholder="Sélectionner un créneau"
                />
              </View>
            )}
            <FormFieldError message={formErrors.getError('timeSlot')} />
          </View>

          {/* Party size */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Nombre de couverts</Text>
            <TextInput
              style={[styles.formInput, formErrors.hasError('partySize') && styles.formInputError]}
              value={partySize}
              onChangeText={(t) => { setPartySize(t.replace(/[^0-9]/g, '')); formErrors.clearError('partySize'); }}
              keyboardType="number-pad"
              placeholder="2"
              placeholderTextColor="#94A3B8"
            />
            <FormFieldError message={formErrors.getError('partySize')} />
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Informations client</Text>

          <View style={styles.formRow}>
            <View style={styles.formRowItem}>
              <Text style={styles.formLabel}>Prénom</Text>
              <TextInput
                style={[styles.formInput, formErrors.hasError('firstName') && styles.formInputError]}
                value={firstName}
                onChangeText={(t) => { setFirstName(t); formErrors.clearError('firstName'); }}
                placeholder="Prénom"
                placeholderTextColor="#94A3B8"
              />
              <FormFieldError message={formErrors.getError('firstName')} />
            </View>
            <View style={styles.formRowItem}>
              <Text style={styles.formLabel}>Nom</Text>
              <TextInput
                style={[styles.formInput, formErrors.hasError('lastName') && styles.formInputError]}
                value={lastName}
                onChangeText={(t) => { setLastName(t); formErrors.clearError('lastName'); }}
                placeholder="Nom"
                placeholderTextColor="#94A3B8"
              />
              <FormFieldError message={formErrors.getError('lastName')} />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Email</Text>
            <TextInput
              style={[styles.formInput, formErrors.hasError('email') && styles.formInputError]}
              value={email}
              onChangeText={(t) => { setEmail(t); formErrors.clearError('email'); }}
              placeholder="email@exemple.com"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <FormFieldError message={formErrors.getError('email')} />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Téléphone</Text>
            <TextInput
              style={styles.formInput}
              value={phone}
              onChangeText={setPhone}
              placeholder="Optionnel"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Notes</Text>
            <TextInput
              style={[styles.formInput, styles.textArea, formErrors.hasError('notes') && styles.formInputError]}
              value={notes}
              onChangeText={(t) => { setNotes(t); formErrors.clearError('notes'); }}
              placeholder="Notes internes, demandes spéciales..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
            />
            <FormFieldError message={formErrors.getError('notes')} />
          </View>
        </Pressable>
      </KeyboardAwareScrollViewWrapper>

      <View style={styles.panelFooter}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel} disabled={isSaving}>
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={() => doSubmit(false)}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>{isSaving ? 'Création...' : 'Créer la réservation'}</Text>
        </TouchableOpacity>
      </View>

      {/* Capacity exceeded confirmation modal */}
      <Modal
        visible={capacityError !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setCapacityError(null)}
      >
        <Pressable style={modalStyles.overlay} onPress={() => setCapacityError(null)}>
          <Pressable style={modalStyles.content} onPress={() => {}}>
            <View style={modalStyles.iconWrap}>
              <AlertTriangle size={28} color="#F59E0B" />
            </View>
            <Text style={modalStyles.title}>Capacité dépassée</Text>
            <Text style={modalStyles.description}>
              Ce créneau a une capacité de {capacityError?.maxCapacity} couvert{(capacityError?.maxCapacity ?? 0) > 1 ? 's' : ''} ({capacityError?.currentCovers} déjà réservé{(capacityError?.currentCovers ?? 0) > 1 ? 's' : ''}) et vous souhaitez en ajouter {capacityError?.requestedPartySize}.{'\n'}
              Voulez-vous forcer la réservation ?
            </Text>
            <View style={modalStyles.actions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setCapacityError(null)}
                disabled={isSaving}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[modalStyles.forceButton, isSaving && styles.saveButtonDisabled]}
                onPress={() => { setCapacityError(null); doSubmit(true); }}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Forcer</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  flexContainer: { flex: 1 },
  panelContent: { flex: 1 },
  scrollView: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingVertical: 20 },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 16,
  },
  headerTextContainer: { flex: 1, minWidth: 0 },
  closeButton: { flexShrink: 0 },
  panelTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B', marginBottom: 4 },
  panelSubtitle: { fontSize: 13, color: '#64748B', lineHeight: 18 },

  formGroup: { marginBottom: 20 },
  formRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  formRowItem: { flex: 1 },
  formLabel: { fontSize: 14, fontWeight: '600', color: '#1E293B', marginBottom: 12 },
  formInput: {
    height: 44,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#1E293B',
  },
  formInputError: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  textArea: { height: 80, textAlignVertical: 'top', paddingTop: 10 },
  errorWrap: {
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    padding: 4,
  },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginTop: 4, marginBottom: 16 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hint: { fontSize: 13, color: '#94A3B8', fontStyle: 'italic', paddingVertical: 10 },

  // Date button + calendar
  dateButton: {
    height: 44,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...(Platform.OS === 'web' && { cursor: 'pointer' as any }),
  },
  dateButtonError: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  dateButtonText: { fontSize: 13, color: '#1E293B', textTransform: 'capitalize' },
  calendar: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
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
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    ...(Platform.OS === 'web' && { cursor: 'pointer' as any }),
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
    borderRadius: 6,
    ...(Platform.OS === 'web' && { cursor: 'pointer' as any }),
  },
  calDaySelected: { backgroundColor: '#2A2E33' },
  calDayToday: { backgroundColor: '#EFF6FF' },
  calDayDisabled: { opacity: 0.35 },
  calDayText: { fontSize: 13, color: '#1E293B' },
  calDayTextSelected: { color: '#FFFFFF', fontWeight: '700' },
  calDayTextToday: { color: '#3B82F6', fontWeight: '700' },
  calDayTextDisabled: { color: '#CBD5E1' },

  panelFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelButtonText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2A2E33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 28,
    width: '90%',
    maxWidth: 420,
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFBEB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
  description: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  actions: { flexDirection: 'row', gap: 10, alignSelf: 'stretch' },
  forceButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
