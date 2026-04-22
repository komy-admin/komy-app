import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text as RNText, TextInput, TouchableOpacity, Pressable, Keyboard, Platform } from 'react-native';
import { X } from 'lucide-react-native';
import { Table } from '~/types/table.types';
import { NumberInput } from '~/components/ui';
import { KeyboardAwareScrollViewWrapper } from '~/components/Keyboard';
import { useToast } from '~/components/ToastProvider';
import { useFormErrors } from '~/hooks/useFormErrors';
import { FormFieldError } from '~/components/ui/FormFieldError';
import { colors } from '~/theme';

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
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();
  const formErrors = useFormErrors();

  useEffect(() => {
    setFormData({
      name: table.name || '',
      seats: table.seats?.toString() || '1',
      shape: table.shape || 'square',
    });
  }, [table]);

  const handleSave = async () => {
    if (isSaving) return;
    formErrors.clearAll();
    setIsSaving(true);
    try {
      await onSave({
        name: formData.name.trim(),
        seats: parseInt(formData.seats, 10),
        shape: formData.shape,
      });
    } catch (error) {
      formErrors.handleError({ error, showToast, fallback: 'Erreur lors de la sauvegarde' });
    } finally {
      setIsSaving(false);
    }
  };

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
          <X size={24} color={colors.neutral[500]} strokeWidth={2} />
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
            <RNText style={styles.formLabel}>Nom de la table</RNText>
            <TextInput
              value={formData.name}
              onChangeText={(text) => { setFormData(prev => ({ ...prev, name: text })); formErrors.clearError('name'); }}
              maxLength={3}
              placeholder="Ex: A01, T1..."
              placeholderTextColor={colors.neutral[400]}
              style={[styles.formInput, formErrors.hasError('name') && styles.formInputError]}
            />
            <FormFieldError message={formErrors.getError('name')} />
            <RNText style={styles.formHelpText}>3 caractères maximum</RNText>
          </View>

          <View style={styles.formGroup}>
            <RNText style={styles.formLabel}>Nombre max de couverts</RNText>
            <NumberInput
              value={parseInt(formData.seats)}
              onChangeText={(value) => {
                setFormData(prev => ({ ...prev, seats: value?.toString() || '1' }));
                formErrors.clearError('seats');
              }}
              placeholder="Nombre max de couverts"
              decimalPlaces={0}
              min={1}
              max={20}
              style={[styles.formInput, formErrors.hasError('seats') && styles.formInputError]}
            />
            <FormFieldError message={formErrors.getError('seats')} />
            <RNText style={styles.formHelpText}>Entre 1 et 20 couverts</RNText>
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
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <RNText style={styles.cancelButtonText}>Annuler</RNText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonSaving]}
          onPress={handleSave}
          disabled={isSaving}
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
    backgroundColor: colors.white,
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
    borderBottomColor: colors.neutral[200],
    backgroundColor: colors.gray[50],
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.neutral[800],
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
    color: colors.neutral[800],
    marginBottom: 8,
  },
  formHelpText: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 6,
  },
  formInput: {
    height: 44,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    color: colors.neutral[800],
  },
  formInputError: {
    borderColor: colors.error.base,
    backgroundColor: colors.error.bg,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  cancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[500],
  },
  saveButton: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.brand.dark,
  },
  saveButtonSaving: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
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
    borderColor: colors.neutral[200],
    borderRadius: 8,
    backgroundColor: colors.white,
  },
  shapeOptionActive: {
    borderColor: colors.brand.dark,
    backgroundColor: colors.neutral[50],
  },
  shapePreview: {
    width: 40,
    height: 40,
    backgroundColor: colors.neutral[300],
  },
  shapeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[500],
  },
  shapeLabelActive: {
    color: colors.brand.dark,
  },
});
