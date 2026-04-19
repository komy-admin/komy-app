import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Pressable, Switch, Platform, Keyboard } from 'react-native';
import { X } from 'lucide-react-native';
import { KeyboardAwareScrollViewWrapper } from '~/components/Keyboard';
import { useToast } from '~/components/ToastProvider';
import { useFormErrors } from '~/hooks/useFormErrors';
import { FormFieldError } from '~/components/ui/FormFieldError';
import type {
  ReservationService,
  CreateReservationServiceDto,
  UpdateReservationServiceDto,
} from '~/types/reservation.types';

const SERVICE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#A855F7', '#EC4899', '#06B6D4', '#84CC16'];

export interface ServiceFormPanelProps {
  service: ReservationService | null;
  onSave: (data: CreateReservationServiceDto | UpdateReservationServiceDto) => Promise<void>;
  onCancel: () => void;
}

export const ServiceFormPanel: React.FC<ServiceFormPanelProps> = ({ service, onSave, onCancel }) => {
  const isEditing = !!service;
  const { showToast } = useToast();
  const formErrors = useFormErrors();

  const [name, setName] = useState(service?.name ?? '');
  const [maxCapacity, setMaxCapacity] = useState(String(service?.maxCapacity ?? 50));
  const [slotInterval, setSlotInterval] = useState(String(service?.slotIntervalMinutes ?? 30));
  const [serviceDuration, setServiceDuration] = useState(String(service?.serviceDurationMinutes ?? 90));
  const [color, setColor] = useState(service?.color ?? SERVICE_COLORS[0]);
  const [isActive, setIsActive] = useState(service?.isActive ?? true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    formErrors.clearAll();

    if (!name.trim()) {
      formErrors.setError('name', 'Le nom est requis');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        maxCapacity: parseInt(maxCapacity, 10) || 50,
        slotIntervalMinutes: parseInt(slotInterval, 10) || 30,
        serviceDurationMinutes: parseInt(serviceDuration, 10) || 90,
        color,
        isActive,
      });
    } catch (error) {
      formErrors.handleError({ error, showToast, fallback: 'Erreur lors de la sauvegarde' });
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, name, maxCapacity, slotInterval, serviceDuration, color, isActive, onSave, formErrors, showToast]);

  return (
    <View style={styles.panelContent}>
      {/* Header */}
      <View style={styles.panelHeader}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.panelTitle} numberOfLines={1} ellipsizeMode="tail">
            {isEditing ? 'Modifier le service' : 'Nouveau service'}
          </Text>
          <Text style={styles.panelSubtitle} numberOfLines={2} ellipsizeMode="tail">
            {isEditing
              ? 'Modifier les informations du service'
              : 'Définissez un service de restauration (déjeuner, dîner…)'}
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
          {/* Nom */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Nom</Text>
            <TextInput
              style={[styles.formInput, formErrors.hasError('name') && styles.formInputError]}
              value={name}
              onChangeText={(t) => { setName(t); formErrors.clearError('name'); }}
              placeholder="Ex: Déjeuner, Dîner, Brunch..."
              placeholderTextColor="#94A3B8"
            />
            <FormFieldError message={formErrors.getError('name')} />
          </View>

          {/* Capacité / Intervalle / Durée */}
          <View style={styles.formRow}>
            <View style={styles.formRowItem}>
              <Text style={styles.formLabel}>Capacité</Text>
              <TextInput
                style={[styles.formInput, formErrors.hasError('maxCapacity') && styles.formInputError]}
                value={maxCapacity}
                onChangeText={(t) => { setMaxCapacity(t.replace(/[^0-9]/g, '')); formErrors.clearError('maxCapacity'); }}
                keyboardType="number-pad"
                placeholder="50"
                placeholderTextColor="#94A3B8"
              />
              <FormFieldError message={formErrors.getError('maxCapacity')} />
            </View>
            <View style={styles.formRowItem}>
              <Text style={styles.formLabel}>Intervalle (min)</Text>
              <TextInput
                style={[styles.formInput, formErrors.hasError('slotIntervalMinutes') && styles.formInputError]}
                value={slotInterval}
                onChangeText={(t) => { setSlotInterval(t.replace(/[^0-9]/g, '')); formErrors.clearError('slotIntervalMinutes'); }}
                keyboardType="number-pad"
                placeholder="30"
                placeholderTextColor="#94A3B8"
              />
              <FormFieldError message={formErrors.getError('slotIntervalMinutes')} />
            </View>
            <View style={styles.formRowItem}>
              <Text style={styles.formLabel}>Durée (min)</Text>
              <TextInput
                style={[styles.formInput, formErrors.hasError('serviceDurationMinutes') && styles.formInputError]}
                value={serviceDuration}
                onChangeText={(t) => { setServiceDuration(t.replace(/[^0-9]/g, '')); formErrors.clearError('serviceDurationMinutes'); }}
                keyboardType="number-pad"
                placeholder="90"
                placeholderTextColor="#94A3B8"
              />
              <FormFieldError message={formErrors.getError('serviceDurationMinutes')} />
            </View>
          </View>

          <View style={styles.divider} />

          {/* Couleur */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Couleur</Text>
            <View style={styles.colorRow}>
              {SERVICE_COLORS.map((c) => (
                <Pressable
                  key={c}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: c },
                    color === c && styles.colorSwatchSelected,
                  ]}
                  onPress={() => setColor(c)}
                />
              ))}
            </View>
          </View>

          {/* Statut */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Statut</Text>
            <TouchableOpacity
              style={[styles.toggleOption, isActive && styles.toggleOptionActive]}
              onPress={() => setIsActive(!isActive)}
              activeOpacity={1}
            >
              <View style={[styles.toggleIndicator, isActive && styles.toggleIndicatorActive]} />
              <Text style={[styles.toggleText, isActive && styles.toggleTextActive]}>
                {isActive ? 'Actif' : 'Inactif'}
              </Text>
              <View style={styles.toggleSpacer} />
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                thumbColor={isActive ? '#10B981' : '#9CA3AF'}
              />
            </TouchableOpacity>
          </View>
        </Pressable>
      </KeyboardAwareScrollViewWrapper>

      {/* Footer */}
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
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
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
  panelTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  panelSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  formGroup: { marginBottom: 20 },
  formRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  formRowItem: { flex: 1 },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
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
  formInputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginTop: 4,
    marginBottom: 16,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
    ...(Platform.OS === 'web' && { cursor: 'pointer' as any }),
  },
  colorSwatchSelected: {
    borderColor: '#1E293B',
    borderWidth: 3,
  },
  toggleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  toggleOptionActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#34D399',
  },
  toggleIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#9CA3AF',
    marginRight: 12,
  },
  toggleIndicatorActive: {
    backgroundColor: '#10B981',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  toggleTextActive: {
    color: '#047857',
  },
  toggleSpacer: { flex: 1 },
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
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2A2E33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
