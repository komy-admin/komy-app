import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Pressable, Switch, Platform, Keyboard } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { X, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react-native';
import { KeyboardAwareScrollViewWrapper } from '~/components/Keyboard';
import { useToast } from '~/components/ToastProvider';
import { useFormErrors } from '~/hooks/useFormErrors';
import { FormFieldError } from '~/components/ui/FormFieldError';
import { colors } from '~/theme';
import type {
  ReservationService,
  ReservationOverride,
  CreateReservationOverrideDto,
} from '~/types/reservation.types';
import { nowInTz } from '~/lib/date.utils';

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

interface SelectOption { label: string; value: string; }

function NativeSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: SelectOption[] }) {
  if (Platform.OS === 'web') {
    return (
      <View style={selectStyles.wrapper}>
        <select
          value={value}
          onChange={(e) => onChange((e.target as HTMLSelectElement).value)}
          style={selectStyles.webSelect as any}
        >
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <View style={selectStyles.webChevron as any} pointerEvents="none">
          <ChevronDown size={14} color={colors.neutral[500]} />
        </View>
      </View>
    );
  }
  return (
    <View style={selectStyles.nativeWrapper}>
      <Picker selectedValue={value} onValueChange={onChange} style={selectStyles.nativePicker}>
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
    fontSize: 14,
    color: colors.neutral[800],
    backgroundColor: colors.neutral[50],
    border: `1px solid ${colors.neutral[200]}`,
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
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 8,
    overflow: 'hidden',
  },
  nativePicker: { height: 44 },
});

export interface OverrideFormPanelProps {
  services: ReservationService[];
  existingOverrides: ReservationOverride[];
  timezone?: string;
  onSave: (data: CreateReservationOverrideDto) => Promise<void>;
  onCancel: () => void;
  initialDate?: string;
}

export const OverrideFormPanel: React.FC<OverrideFormPanelProps> = ({
  services,
  existingOverrides,
  timezone,
  onSave,
  onCancel,
  initialDate,
}) => {
  const { showToast } = useToast();
  const formErrors = useFormErrors();
  // "Aujourd'hui" dans la TZ du pro pour que le calendrier s'ouvre sur le bon mois
  const tz = timezone || 'Europe/Paris';
  const nowTz = nowInTz(tz);
  const initialParts = initialDate ? initialDate.split('-').map(Number) : null;

  const [date, setDate] = useState(initialDate || '');
  const [isClosed, setIsClosed] = useState(true);
  const [startHour, setStartHour] = useState('10');
  const [startMin, setStartMin] = useState('00');
  const [endHour, setEndHour] = useState('14');
  const [endMin, setEndMin] = useState('00');
  const [serviceId, setServiceId] = useState('');
  const [reason, setReason] = useState('');
  const [calMonth, setCalMonth] = useState(initialParts ? initialParts[1] - 1 : nowTz.month - 1);
  const [calYear, setCalYear] = useState(initialParts ? initialParts[0] : nowTz.year);
  const [isSaving, setIsSaving] = useState(false);

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
    formErrors.clearError('date');
  };

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    formErrors.clearAll();

    if (!date) {
      formErrors.setError('date', 'Sélectionnez une date sur le calendrier');
      return;
    }

    setIsSaving(true);
    try {
      const data: CreateReservationOverrideDto = {
        date,
        isClosed,
      };
      if (!isClosed) {
        data.startTime = `${startHour}:${startMin}`;
        data.endTime = `${endHour}:${endMin}`;
      }
      if (serviceId) data.serviceId = serviceId;
      if (reason.trim()) data.reason = reason.trim();

      await onSave(data);
    } catch (error) {
      formErrors.handleError({ error, showToast, fallback: 'Erreur lors de la création' });
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, date, isClosed, startHour, startMin, endHour, endMin, serviceId, reason, onSave, formErrors, showToast]);

  return (
    <View style={styles.panelContent}>
      <View style={styles.panelHeader}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.panelTitle} numberOfLines={1} ellipsizeMode="tail">
            Nouvelle fermeture exceptionnelle
          </Text>
          <Text style={styles.panelSubtitle} numberOfLines={2} ellipsizeMode="tail">
            Bloquez une date ou modifiez ses horaires
          </Text>
        </View>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onCancel}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={24} color={colors.neutral[500]} strokeWidth={2} />
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
          {/* Calendar */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Date</Text>
            <View style={[styles.calendar, formErrors.hasError('date') && styles.calendarError]}>
              <View style={styles.calNav}>
                <Pressable onPress={() => navigateCalendar(-1)} style={styles.calNavBtn} hitSlop={6}>
                  <ChevronLeft size={18} color={colors.neutral[600]} />
                </Pressable>
                <Text style={styles.calNavText}>{MONTHS[calMonth]} {calYear}</Text>
                <Pressable onPress={() => navigateCalendar(1)} style={styles.calNavBtn} hitSlop={6}>
                  <ChevronRight size={18} color={colors.neutral[600]} />
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
                  const hasOverride = existingOverrides.some((o) => o.date.startsWith(dateStr));
                  return (
                    <Pressable
                      key={`d-${day}`}
                      style={[
                        styles.calDay,
                        isSelected && styles.calDaySelected,
                        hasOverride && !isSelected && styles.calDayHasOverride,
                      ]}
                      onPress={() => selectCalendarDay(day)}
                    >
                      <Text style={[styles.calDayText, isSelected && styles.calDayTextSelected]}>
                        {day}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {date ? <Text style={styles.selectedDateText}>Sélectionné : {date}</Text> : null}
            </View>
            <FormFieldError message={formErrors.getError('date')} />
          </View>

          <View style={styles.divider} />

          {/* Closed switch */}
          <View style={styles.switchGroup}>
            <View style={styles.switchTextWrap}>
              <Text style={styles.formLabel}>Fermé toute la journée</Text>
              <Text style={styles.helpText}>
                Désactivez pour appliquer des horaires spéciaux à la place
              </Text>
            </View>
            <Switch
              value={isClosed}
              onValueChange={setIsClosed}
              trackColor={{ false: colors.gray[300], true: colors.success.base }}
              thumbColor={isClosed ? colors.white : colors.gray[100]}
            />
          </View>

          {/* Time pickers (only when not closed) */}
          {!isClosed && (
            <View style={styles.formRow}>
              <View style={styles.formRowItem}>
                <Text style={styles.formLabel}>Début</Text>
                <View style={styles.timeRow}>
                  <View style={styles.timePart}>
                    <NativeSelect
                      value={startHour}
                      onChange={setStartHour}
                      options={HOURS.map((h) => ({ label: `${h}h`, value: h }))}
                    />
                  </View>
                  <View style={styles.timePart}>
                    <NativeSelect
                      value={startMin}
                      onChange={setStartMin}
                      options={MINUTES.map((m) => ({ label: m, value: m }))}
                    />
                  </View>
                </View>
              </View>
              <View style={styles.formRowItem}>
                <Text style={styles.formLabel}>Fin</Text>
                <View style={styles.timeRow}>
                  <View style={styles.timePart}>
                    <NativeSelect
                      value={endHour}
                      onChange={setEndHour}
                      options={HOURS.map((h) => ({ label: `${h}h`, value: h }))}
                    />
                  </View>
                  <View style={styles.timePart}>
                    <NativeSelect
                      value={endMin}
                      onChange={setEndMin}
                      options={MINUTES.map((m) => ({ label: m, value: m }))}
                    />
                  </View>
                </View>
              </View>
            </View>
          )}

          <View style={styles.divider} />

          {/* Service */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Service concerné (optionnel)</Text>
            <NativeSelect
              value={serviceId}
              onChange={setServiceId}
              options={[
                { label: 'Tous les services', value: '' },
                ...services.map((s) => ({ label: s.name, value: s.id })),
              ]}
            />
          </View>

          {/* Reason */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Raison (optionnel)</Text>
            <TextInput
              style={styles.formInput}
              value={reason}
              onChangeText={setReason}
              placeholder="Ex: Jour férié, Travaux, Événement privé..."
              placeholderTextColor={colors.neutral[400]}
            />
          </View>
        </Pressable>
      </KeyboardAwareScrollViewWrapper>

      <View style={styles.panelFooter}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>{isSaving ? 'Enregistrement...' : 'Enregistrer'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  flexContainer: { flex: 1 },
  panelContent: { flex: 1 },
  scrollView: { flex: 1, backgroundColor: colors.white },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingVertical: 20 },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
    gap: 16,
  },
  headerTextContainer: { flex: 1, minWidth: 0 },
  closeButton: { flexShrink: 0 },
  panelTitle: { fontSize: 18, fontWeight: '600', color: colors.neutral[800], marginBottom: 4 },
  panelSubtitle: { fontSize: 13, color: colors.neutral[500], lineHeight: 18 },
  formGroup: { marginBottom: 20 },
  formRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  formRowItem: { flex: 1, minWidth: 0 },
  formLabel: { fontSize: 14, fontWeight: '600', color: colors.neutral[800], marginBottom: 12 },
  helpText: { fontSize: 12, color: colors.neutral[400], marginTop: -8, marginBottom: 0 },
  divider: { height: 1, backgroundColor: colors.neutral[200], marginTop: 4, marginBottom: 16 },
  formInput: {
    height: 44,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.neutral[800],
  },

  switchGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  switchTextWrap: { flex: 1, minWidth: 0 },

  timeRow: { flexDirection: 'row', gap: 8 },
  timePart: { flex: 1, minWidth: 0 },

  // Calendar
  calendar: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 10,
    padding: 14,
  },
  calendarError: { borderColor: colors.error.base, backgroundColor: colors.error.bg },
  calNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' && { cursor: 'pointer' as any, userSelect: 'none' as any }),
  },
  calNavText: { fontSize: 14, fontWeight: '600', color: colors.neutral[800], textTransform: 'capitalize' },
  calWeekdays: { flexDirection: 'row', marginBottom: 6 },
  calWeekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: colors.neutral[400],
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calDayEmpty: { width: '14.28%', aspectRatio: 1, minHeight: 36 },
  calDay: {
    width: '14.28%',
    aspectRatio: 1,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    ...(Platform.OS === 'web' && { cursor: 'pointer' as any }),
  },
  calDaySelected: { backgroundColor: colors.brand.dark },
  calDayHasOverride: { backgroundColor: colors.error.bg },
  calDayText: { fontSize: 13, color: colors.neutral[800], fontVariant: ['tabular-nums'] },
  calDayTextSelected: { color: colors.white, fontWeight: '700' },
  selectedDateText: { fontSize: 12, color: colors.neutral[500], marginTop: 8 },

  panelFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  cancelButton: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: { fontSize: 14, fontWeight: '600', color: colors.neutral[500] },
  saveButton: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.brand.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { fontSize: 14, fontWeight: '600', color: colors.white },
});
