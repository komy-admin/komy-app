import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, StyleSheet, Text as RNText, TouchableOpacity } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { Table } from '~/types/table.types';
import { TextInput, NumberInput } from '~/components/ui';
import { KeyboardAwareScrollViewWrapper } from '~/components/Keyboard';

interface TableFormContentProps {
  table: Table;
  onSave: (updates: Partial<Table>) => Promise<void> | void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  seats: string;
}

/**
 * TableFormContent - Formulaire d'édition de table pour SlidePanel
 *
 * Utilise KeyboardSafeFormView pour une gestion optimale du keyboard.
 * Pattern cohérent avec TeamForm, RoomForm, etc.
 */
export const TableFormContent: React.FC<TableFormContentProps> = ({
  table,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    seats: ''
  });
  const [initialValues, setInitialValues] = useState<FormData | null>(null);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Ref pour éviter les state updates sur composant unmonted
  const isMountedRef = useRef(true);

  // Cleanup au unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
        if (formData.name.trim().length > 50) return 'Le nom ne peut pas dépasser 50 caractères';
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

  // Initialiser le formulaire quand la table change
  useEffect(() => {
    if (table) {
      const initialFormData = {
        name: table.name || '',
        seats: table.seats?.toString() || '1'
      };
      setFormData(initialFormData);
      setInitialValues(initialFormData);
      setTouchedFields({});
    }
  }, [table]); // ✅ Dépend de l'objet complet pour détecter tous les changements

  // Check if form has changes
  const hasChanges = useMemo(() => {
    if (!initialValues) return false;
    return formData.name !== initialValues.name || formData.seats !== initialValues.seats;
  }, [formData, initialValues]);

  // Form validation for button disable
  const isFormValid = useMemo(() => {
    if (!table || !hasChanges) return false; // Disabled if no changes

    // Seul le nom doit être validé (seats est contrôlé par NumberInput min={1})
    const nameValid = formData.name.trim().length > 0;

    return nameValid;
  }, [formData, table, hasChanges]);

  const handleSave = useCallback(async () => {
    // Mark all fields as touched to show errors
    setTouchedFields({
      name: true,
      seats: true,
    });

    // Validate manually
    if (!isFormValid) {
      return;
    }

    setIsSaving(true);

    try {
      await onSave({
        name: formData.name.trim(),
        seats: parseInt(formData.seats, 10)
      });
    } catch (error) {
      console.error('Error saving table:', error);
    } finally {
      // ✅ Éviter state update si composant unmounted
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [formData, onSave, isFormValid]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <RNText style={styles.title}>Modifier la table</RNText>
          <RNText style={styles.subtitle}>{table.name}</RNText>
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
      >
          {/* Formulaire d'édition */}
          <View style={styles.formGroup}>
            <RNText style={styles.formLabel}>Nom de la table *</RNText>
            <TextInput
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              onBlur={() => markFieldAsTouched('name')}
              placeholder="Ex: A01, Terrasse 1..."
              placeholderTextColor="#94A3B8"
              style={[
                styles.formInput,
                getFieldError('name') && styles.formInputError
              ]}
            />
            {getFieldError('name') && (
              <View style={styles.errorContainer}>
                <RNText style={styles.errorText}>{getFieldError('name')}</RNText>
                <RNText style={styles.exampleText}>Exemple : Table 1, A01, Terrasse 5</RNText>
              </View>
            )}
          </View>

          <View style={styles.formGroup}>
            <RNText style={styles.formLabel}>Nombre de couverts *</RNText>
            <NumberInput
              value={parseInt(formData.seats)}
              onChangeText={(value) => {
                setFormData(prev => ({ ...prev, seats: value?.toString() || '1' }));
                markFieldAsTouched('seats');
              }}
              placeholder="Nombre de couverts"
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
      </KeyboardAwareScrollViewWrapper>

      {/* Footer avec boutons */}
      <View style={styles.footer}>
        {/* Bouton Annuler */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
        >
          <RNText style={styles.cancelButtonText}>Annuler</RNText>
        </TouchableOpacity>

        {/* Bouton Enregistrer */}
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
    alignItems: 'flex-start',
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
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
  exampleText: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FAFAFA',
    gap: 12,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  saveButton: {
    flex: 1,
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
});
