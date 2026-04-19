import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Platform, Keyboard } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { X, ChevronDown } from 'lucide-react-native';
import { KeyboardAwareScrollViewWrapper } from '~/components/Keyboard';
import { useToast } from '~/components/ToastProvider';
import { useFormErrors } from '~/hooks/useFormErrors';
import { FormFieldError } from '~/components/ui/FormFieldError';
import type { ReservationService, CreateReservationScheduleDto } from '~/types/reservation.types';

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
          <ChevronDown size={14} color="#64748B" />
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
    fontSize: 13,
    color: '#1E293B',
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

export interface ScheduleFormPanelProps {
  services: ReservationService[];
  defaultServiceId?: string;
  onSave: (data: CreateReservationScheduleDto) => Promise<void>;
  onCancel: () => void;
}

export const ScheduleFormPanel: React.FC<ScheduleFormPanelProps> = ({ services, defaultServiceId, onSave, onCancel }) => {
  const { showToast } = useToast();
  const formErrors = useFormErrors();

  const [serviceId, setServiceId] = useState(defaultServiceId || services[0]?.id || '');
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [startHour, setStartHour] = useState('12');
  const [startMin, setStartMin] = useState('00');
  const [endHour, setEndHour] = useState('14');
  const [endMin, setEndMin] = useState('00');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!serviceId && services.length > 0) {
      setServiceId(services[0].id);
    }
  }, [services, serviceId]);

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    formErrors.clearAll();

    if (!serviceId) {
      formErrors.setError('serviceId', 'Sélectionnez un service');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        serviceId,
        dayOfWeek,
        startTime: `${startHour}:${startMin}`,
        endTime: `${endHour}:${endMin}`,
      });
    } catch (error) {
      formErrors.handleError({ error, showToast, fallback: 'Erreur lors de la création' });
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, serviceId, dayOfWeek, startHour, startMin, endHour, endMin, onSave, formErrors, showToast]);

  return (
    <View style={styles.panelContent}>
      <View style={styles.panelHeader}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.panelTitle} numberOfLines={1} ellipsizeMode="tail">
            Nouveau créneau hebdomadaire
          </Text>
          <Text style={styles.panelSubtitle} numberOfLines={2} ellipsizeMode="tail">
            Définissez l'heure d'ouverture et de fermeture pour un jour
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
            {services.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyBoxText}>Créez d'abord un service</Text>
              </View>
            ) : (
              <View style={formErrors.hasError('serviceId') ? styles.errorWrap : undefined}>
                <NativeSelect
                  value={serviceId}
                  onChange={(v) => { setServiceId(v); formErrors.clearError('serviceId'); }}
                  options={services.map((s) => ({ label: s.name, value: s.id }))}
                />
              </View>
            )}
            <FormFieldError message={formErrors.getError('serviceId')} />
          </View>

          {/* Jour */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Jour de la semaine</Text>
            <NativeSelect
              value={String(dayOfWeek)}
              onChange={(v) => setDayOfWeek(parseInt(v, 10))}
              options={DAYS.map((d) => ({ label: d.label, value: String(d.value) }))}
            />
          </View>

          <View style={styles.divider} />

          {/* Horaires */}
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
        </Pressable>
      </KeyboardAwareScrollViewWrapper>

      <View style={styles.panelFooter}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, (isSaving || services.length === 0) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving || services.length === 0}
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
  divider: { height: 1, backgroundColor: '#E2E8F0', marginTop: 4, marginBottom: 16 },
  timeRow: { flexDirection: 'row', gap: 8 },
  timePart: { flex: 1 },
  errorWrap: {
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    padding: 4,
  },
  emptyBox: {
    height: 44,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyBoxText: { fontSize: 13, color: '#DC2626', fontWeight: '500' },
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
