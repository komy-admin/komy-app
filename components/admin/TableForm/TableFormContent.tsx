import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, Text as RNText, TouchableOpacity, Pressable, Keyboard, Platform } from 'react-native';
import { X } from 'lucide-react-native';
import { Table } from '~/types/table.types';
import { TextInput, NumberInput } from '~/components/ui';
import { KeyboardAwareScrollViewWrapper } from '~/components/Keyboard';
import { useToast } from '~/components/ToastProvider';

interface TableFormContentProps {
  table: Table;
  onSave: (updates: Partial<Table>) => Promise<void> | void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  seats: string;
  shape: 'square' | 'rounded';
}

/** Formulaire d'édition de table (nom, couverts, forme) pour SlidePanel */
export const TableFormContent: React.FC<TableFormContentProps> = ({
  table,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    seats: '',
    shape: 'square',
  });
  const [initialValues, setInitialValues] = useState<FormData | null>(null);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  // Mark field as touched
  const markFieldAsTouched = useCallback((fieldName: string) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
  }, []);

  // Field validation (only if touched)
  const getFieldError = useCallback((fieldName: string): string | null => {
    if (!touchedFields[fieldName]) return null;

    switch (fieldName) {
      case 'name':
        if (!formData.name.trim()) return 'Le nom de la table est obligatoire';
        if (formData.name.trim().length > 3) return 'Le nom ne peut pas dépasser 3 caractères';
        if (!/^[a-zA-Z0-9\s\-_À-ÿ]+$/.test(formData.name)) {
          return 'Seuls les lettres, chiffres, espaces, tirets et underscores sont autorisés';
        }
        return null;

      case 'seats':
        const seatsValue = parseInt(formData.seats, 10);
        if (isNaN(seatsValue) || seatsValue < 1) return 'Minimum 1 couvert';
        if (seatsValue > 20) return 'Maximum 20 couverts';
        return null;

      default:
        return null;
    }
  }, [touchedFields, formData]);

  useEffect(() => {
    const initialFormData: FormData = {
      name: table.name || '',
      seats: table.seats?.toString() || '1',
      shape: table.shape || 'square',
    };
    setFormData(initialFormData);
    setInitialValues(initialFormData);
    setTouchedFields({});
  }, [table]);

  const hasChanges = useMemo(() => {
    if (!initialValues) return false;
    return (
      formData.name !== initialValues.name ||
      formData.seats !== initialValues.seats ||
      formData.shape !== initialValues.shape
    );
  }, [formData, initialValues]);

  const isFormValid = useMemo(() => {
    if (!hasChanges) return false;
    return formData.name.trim().length > 0;
  }, [formData.name, hasChanges]);

  const handleSave = useCallback(async () => {
    setTouchedFields({ name: true, seats: true });
    if (!isFormValid) return;

    setIsSaving(true);
    try {
      await onSave({
        name: formData.name.trim(),
        seats: parseInt(formData.seats, 10),
        shape: formData.shape,
      });
    } catch (error: any) {
      let errorMessage = 'Erreur lors de la sauvegarde de la table';
      if (error.response?.status === 409) {
        errorMessage = error.response.data?.message || 'Ce nom est déjà utilisé dans cette salle';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      showToast(errorMessage, 'error');
    } finally {
      setIsSaving(false);
    }
  }, [formData, onSave, isFormValid]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <RNText style={styles.title}>Table - {table.name}</RNText>
        </View>
        <TouchableOpacity
          onPress={onCancel}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.closeButton}
        >
          <X size={24} color="#64748B" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* KeyboardAwareScrollView - auto-scrolls to focused input */}
      <KeyboardAwareScrollViewWrapper
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        bottomOffset={40}
        scrollEventThrottle={16}
      >
        <Pressable style={{ flex: 1 }} onPress={() => { if (Platform.OS !== 'web') Keyboard.dismiss(); }}>
          {/* Formulaire d'édition */}
          <View style={styles.formGroup}>
            <RNText style={styles.formLabel}>Nom de la table *</RNText>
            <TextInput
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              onBlur={() => markFieldAsTouched('name')}
              maxLength={3}
              placeholder="Ex: A01, T1..."
              placeholderTextColor="#94A3B8"
              style={[
                styles.formInput,
                getFieldError('name') && styles.formInputError
              ]}
            />
            {getFieldError('name') ? (
              <View style={styles.errorContainer}>
                <RNText style={styles.errorText}>{getFieldError('name')}</RNText>
              </View>
            ) : (
              <RNText style={styles.formHelpText}>3 caractères maximum</RNText>
            )}
          </View>

          <View style={styles.formGroup}>
            <RNText style={styles.formLabel}>Nombre max de couverts *</RNText>
            <NumberInput
              value={parseInt(formData.seats)}
              onChangeText={(value) => {
                setFormData(prev => ({ ...prev, seats: value?.toString() || '1' }));
                markFieldAsTouched('seats');
              }}
              placeholder="Nombre max de couverts"
              decimalPlaces={0}
              min={1}
              max={20}
              style={[
                styles.formInput,
                getFieldError('seats') && styles.formInputError
              ]}
            />
            {getFieldError('seats') ? (
              <View style={styles.errorContainer}>
                <RNText style={styles.errorText}>{getFieldError('seats')}</RNText>
              </View>
            ) : (
              <RNText style={styles.formHelpText}>Entre 1 et 20 couverts</RNText>
            )}
          </View>

          <View style={styles.formGroup}>
            <RNText style={styles.formLabel}>Forme de la table</RNText>
            <View style={styles.shapeSelector}>
              <Pressable
                style={[
                  styles.shapeOption,
                  formData.shape === 'square' && styles.shapeOptionActive,
                ]}
                onPress={() => setFormData(prev => ({ ...prev, shape: 'square' }))}
              >
                <View style={[styles.shapePreview, { borderRadius: 4 }]} />
                <RNText style={[styles.shapeLabel, formData.shape === 'square' && styles.shapeLabelActive]}>Carré</RNText>
              </Pressable>
              <Pressable
                style={[
                  styles.shapeOption,
                  formData.shape === 'rounded' && styles.shapeOptionActive,
                ]}
                onPress={() => setFormData(prev => ({ ...prev, shape: 'rounded' }))}
              >
                <View style={[styles.shapePreview, { borderRadius: 9999 }]} />
                <RNText style={[styles.shapeLabel, formData.shape === 'rounded' && styles.shapeLabelActive]}>Arrondi</RNText>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </KeyboardAwareScrollViewWrapper>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!isFormValid || isSaving) && styles.saveButtonDisabled
          ]}
          onPress={handleSave}
          disabled={!isFormValid || isSaving}
        >
          <RNText style={styles.saveButtonText}>
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </RNText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FAFAFA',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  closeButton: {
    padding: 4,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  formHelpText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
  },
  formInput: {
    height: 44,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#1E293B',
  },
  formInputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
    backgroundColor: '#FEF2F2',
  },
  errorContainer: {
    marginTop: 6,
    gap: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FAFAFA',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#4F46E5',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  shapeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  shapeOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  shapeOptionActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  shapePreview: {
    width: 40,
    height: 40,
    backgroundColor: '#CBD5E1',
  },
  shapeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  shapeLabelActive: {
    color: '#4F46E5',
  },
});
