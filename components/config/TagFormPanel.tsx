import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Pressable, Keyboard, Platform } from 'react-native';
import { X, Plus, Trash2 } from 'lucide-react-native';
import { Tag, TagFieldType, TagOption } from '~/types/tag.types';
import { eurosToCents, centsToEuros } from '~/lib/utils';
import { KeyboardAwareScrollViewWrapper } from '~/components/Keyboard';
import { useToast } from '~/components/ToastProvider';
import { useFormErrors } from '~/hooks/useFormErrors';
import { FormFieldError } from '~/components/ui/FormFieldError';

interface TagFormPanelProps {
  tag: Tag | null;
  onSave: (tagData: Partial<Tag>, options?: Partial<TagOption>[]) => Promise<void>;
  onCancel: () => void;
}

export const TagFormPanel: React.FC<TagFormPanelProps> = ({ tag, onSave, onCancel }) => {
  const { showToast } = useToast();
  const [label, setLabel] = useState(tag?.label || '');
  const [fieldType, setFieldType] = useState<TagFieldType | null>(tag?.fieldType || null);
  const [isRequired, setIsRequired] = useState(tag?.isRequired || false);
  const [options, setOptions] = useState<Partial<TagOption>[]>(
    tag?.options?.map(opt => ({
      ...opt,
      priceModifier: opt.priceModifier != null ? centsToEuros(opt.priceModifier) : null
    })) || []
  );
  const [showConfiguration, setShowConfiguration] = useState(!!tag);
  const formErrors = useFormErrors({ 'name': 'label' });
  const [isSaving, setIsSaving] = useState(false);

  const needsOptions = fieldType === 'select' || fieldType === 'multi-select';

  const generateValue = (text: string) =>
    text.trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

  const handleFieldTypeSelect = (type: TagFieldType) => {
    setFieldType(type);
    formErrors.clearError('fieldType');
    setShowConfiguration(true);
  };

  const handleChangeFieldType = () => {
    setShowConfiguration(false);
  };

  const handleAddOption = () => {
    setOptions([...options, {
      value: '',
      label: '',
      priceModifier: null,
      isDefault: options.length === 0,
      position: options.length,
    }]);
    formErrors.clearError('options');
  };

  const handleUpdateOptionLabel = (index: number, text: string) => {
    const updated = [...options];
    updated[index] = { ...updated[index], label: text, value: generateValue(text) };
    setOptions(updated);
  };

  const handleUpdateOptionPrice = (index: number, text: string) => {
    const updated = [...options];
    updated[index] = { ...updated[index], priceModifier: text ? parseFloat(text) : null };
    setOptions(updated);
  };

  const handleDeleteOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    formErrors.clearAll();
    setIsSaving(true);

    try {
      // Vérifier les options vides avant envoi
      if (needsOptions) {
        let hasEmptyOption = false;
        options.forEach((opt, index) => {
          if (!opt.label || !opt.label.trim()) {
            formErrors.setError(`options.${index}`, 'Ce champ est requis');
            hasEmptyOption = true;
          }
        });
        if (hasEmptyOption) {
          setIsSaving(false);
          return;
        }
      }

      const optionsPayload = needsOptions
        ? options.map(opt => ({
            ...(opt.id ? { id: opt.id } : {}),
            value: opt.value || generateValue(opt.label || ''),
            label: (opt.label || '').trim(),
            priceModifier: opt.priceModifier != null ? eurosToCents(Number(opt.priceModifier)) : null,
            isDefault: opt.isDefault,
            position: opt.position,
          }))
        : undefined;

      await onSave(
        {
          name: generateValue(label),
          label: label.trim(),
          fieldType: fieldType!,
          isRequired,
        },
        optionsPayload
      );
    } catch (error) {
      formErrors.handleError(error, showToast, tag ? 'Erreur lors de la modification du tag' : 'Erreur lors de la création du tag');
    } finally {
      setIsSaving(false);
    }
  };

  const fieldTypes: { value: TagFieldType; label: string; description: string }[] = [
    { value: 'select', label: 'Sélection simple', description: 'Un seul choix parmi une liste — ex: Cuisson (Saignant, À point, Bien cuit)' },
    { value: 'multi-select', label: 'Sélection multiple', description: 'Plusieurs choix possibles — ex: Garnitures (Salade, Frites, Riz)' },
    { value: 'toggle', label: 'Oui/Non', description: 'Activer ou non une option — ex: Sans gluten, Sans lactose' },
  ];

  const getFieldTypeLabel = (type: TagFieldType | null): string => {
    if (!type) return '';
    return fieldTypes.find(ft => ft.value === type)?.label || type;
  };

  return (
    <View style={styles.panelContent}>
      <View style={styles.panelHeader}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.panelTitle} numberOfLines={1} ellipsizeMode="tail">
            {tag ? 'Modifier le tag' : 'Nouveau tag'}
          </Text>
          <Text style={styles.panelSubtitle} numberOfLines={2} ellipsizeMode="tail">
            {tag ? 'Modifier les paramètres du tag' : 'Sélectionnez un type de champ pour commencer'}
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
        <Pressable style={{ flex: 1 }} onPress={() => { if (Platform.OS !== 'web') Keyboard.dismiss(); }}>
        {/* Étape 1: Sélection du type de champ */}
        {!showConfiguration && (
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Type de champ</Text>
            <View style={[styles.radioGroup, formErrors.hasError('fieldType') && styles.selectorError]}>
              {fieldTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.radioOption,
                    fieldType === type.value && {
                      borderColor: '#A855F7',
                      backgroundColor: '#F8F4FF',
                    }
                  ]}
                  onPress={() => handleFieldTypeSelect(type.value)}
                  activeOpacity={1}
                >
                  <View style={styles.radio}>
                    {fieldType === type.value && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.radioTextContainer}>
                    <Text style={[styles.radioLabel, fieldType === type.value && styles.radioLabelActive]}>
                      {type.label}
                    </Text>
                    <Text style={styles.radioDescription}>{type.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Étape 2: Configuration */}
        {showConfiguration && (
          <>
            <View style={styles.selectedItemBanner}>
              <View style={styles.selectedItemInfo}>
                <Text style={styles.selectedItemLabel}>Type de champ sélectionné</Text>
                <Text style={styles.selectedItemName}>{getFieldTypeLabel(fieldType)}</Text>
              </View>
              <TouchableOpacity
                style={styles.changeItemButton}
                onPress={handleChangeFieldType}
              >
                <Text style={styles.changeItemButtonText}>Changer</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* Nom du tag */}
            <View style={[styles.formGroup, { marginBottom: 12 }]}>
              <Text style={styles.formLabel}>Nom du tag</Text>
              <TextInput
                style={[styles.formInput, formErrors.hasError('label') && styles.formInputError]}
                value={label}
                onChangeText={(text) => { setLabel(text); formErrors.clearError('label'); }}
                placeholder="Ex: Cuisson, Garnitures..."
                placeholderTextColor="#94A3B8"
              />
              <FormFieldError message={formErrors.getError('label')} />
            </View>

            {/* Obligatoire */}
            <View style={{ marginBottom: 10 }}>
              <Text style={[styles.formLabel, { marginBottom: 4 }]}>Saisie en commande</Text>
              <Text style={styles.formHelpText}>
                Si obligatoire, ce tag devra être renseigné avant de valider l'article en commande
              </Text>
              <TouchableOpacity
                style={[styles.toggleOption, isRequired && styles.toggleOptionActive]}
                onPress={() => setIsRequired(!isRequired)}
                activeOpacity={1}
              >
                <View style={[styles.toggleIndicator, isRequired && styles.toggleIndicatorActive]} />
                <Text style={[styles.toggleText, isRequired && styles.toggleTextActive]}>
                  {isRequired ? 'Obligatoire' : 'Optionnel'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Options */}
            {needsOptions && (
              <>
                <View style={styles.divider} />
                <Text style={styles.formLabel}>Options</Text>

                {options.map((option, index) => (
                  <View key={index} style={{ marginBottom: 8 }}>
                    <View style={styles.optionRow}>
                      <View style={styles.optionInputs}>
                        <TextInput
                          style={[styles.formInput, styles.optionLabelInput, formErrors.hasError(`options.${index}`) && styles.formInputError]}
                          value={option.label}
                          onChangeText={(text) => { handleUpdateOptionLabel(index, text); formErrors.clearError(`options.${index}`); }}
                          placeholder="Nom de l'option"
                          placeholderTextColor="#94A3B8"
                        />
                        <TextInput
                          style={[styles.formInput, styles.optionPriceInput]}
                          value={option.priceModifier != null && option.priceModifier !== 0 ? option.priceModifier.toString() : ''}
                          onChangeText={(text) => handleUpdateOptionPrice(index, text)}
                          placeholder="0 €"
                          keyboardType="decimal-pad"
                          placeholderTextColor="#94A3B8"
                        />
                      </View>
                      <TouchableOpacity
                        style={styles.deleteOptionButton}
                        onPress={() => handleDeleteOption(index)}
                      >
                        <Trash2 size={20} color="#EF4444" strokeWidth={1.5} />
                      </TouchableOpacity>
                    </View>
                    <FormFieldError message={formErrors.getError(`options.${index}`)} />
                  </View>
                ))}

                <TouchableOpacity
                  style={[
                    styles.addOptionButton,
                    formErrors.errors['options'] && styles.addOptionButtonError,
                  ]}
                  onPress={handleAddOption}
                >
                  <Plus size={18} color={formErrors.errors['options'] ? '#EF4444' : '#64748B'} strokeWidth={2} />
                  <Text style={[
                    styles.addOptionButtonText,
                    formErrors.errors['options'] && styles.addOptionButtonTextError,
                  ]}>Ajouter une option</Text>
                </TouchableOpacity>
                {formErrors.errors['options'] && (
                  <FormFieldError message={formErrors.errors['options'].message} />
                )}
              </>
            )}
          </>
        )}
        </Pressable>
      </KeyboardAwareScrollViewWrapper>

      <View style={styles.panelFooter}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, (!showConfiguration || isSaving) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!showConfiguration || isSaving}
        >
          <Text style={styles.saveButtonText}>{isSaving ? 'Enregistrement...' : 'Enregistrer'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  panelContent: {
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
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 16,
  },
  headerTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  closeButton: {
    flexShrink: 0,
  },
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
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  formHelpText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
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
    backgroundColor: '#FEF2F2',
  },
  radioGroup: {
    gap: 8,
  },
  selectorError: {
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    padding: 4,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#A855F7',
  },
  radioTextContainer: {
    flex: 1,
  },
  radioLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  radioLabelActive: {
    color: '#1E293B',
    fontWeight: '500',
  },
  radioDescription: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    lineHeight: 16,
  },
  toggleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
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
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginTop: 20,
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionInputs: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  optionLabelInput: {
    flex: 2,
    minWidth: 0,
  },
  optionPriceInput: {
    width: 80,
    flex: 0,
  },
  deleteOptionButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  addOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed' as any,
    gap: 8,
    marginTop: 4,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  addOptionButtonError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  addOptionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  addOptionButtonTextError: {
    color: '#EF4444',
  },
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2A2E33',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  selectedItemBanner: {
    backgroundColor: '#FAF5FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedItemInfo: {
    flex: 1,
  },
  selectedItemLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A855F7',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectedItemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  changeItemButton: {
    backgroundColor: '#A855F7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  changeItemButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
