import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { X, Check, Plus, Trash2 } from 'lucide-react-native';
import { Tag, TagFieldType, TagOption } from '~/types/tag.types';
import { eurosToCents, centsToEuros } from '~/lib/utils';

interface TagFormPanelProps {
  tag: Tag | null;
  onSave: (tagData: Partial<Tag>, options?: Partial<TagOption>[]) => void;
  onCancel: () => void;
  onBulkDeleteOptions: (tagId: string, optionIds: string[]) => Promise<void>;
}

export const TagFormPanel: React.FC<TagFormPanelProps> = ({ tag, onSave, onCancel, onBulkDeleteOptions }) => {
  const [label, setLabel] = useState(tag?.label || '');
  const [fieldType, setFieldType] = useState<TagFieldType | null>(tag?.fieldType || null); // null = aucune sélection
  const [isRequired, setIsRequired] = useState(tag?.isRequired || false);
  // 💰 Convertir centimes -> euros pour l'affichage
  const [options, setOptions] = useState<Partial<TagOption>[]>(
    tag?.options?.map(opt => ({
      ...opt,
      priceModifier: opt.priceModifier != null ? centsToEuros(opt.priceModifier) : null
    })) || []
  );
  const [optionsToDelete, setOptionsToDelete] = useState<string[]>([]); // IDs des options à supprimer
  const [newOptionLabel, setNewOptionLabel] = useState('');
  const [newOptionPrice, setNewOptionPrice] = useState('');
  const [showConfiguration, setShowConfiguration] = useState(!!tag); // true si mode édition, false si création

  const needsOptions = fieldType === 'select' || fieldType === 'multi-select';

  const handleFieldTypeSelect = (type: TagFieldType) => {
    setFieldType(type);
    setShowConfiguration(true);
  };

  const handleChangeFieldType = () => {
    setShowConfiguration(false);
  };

  const handleAddOption = () => {
    if (!newOptionLabel.trim()) return;

    const generatedValue = newOptionLabel.trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    const newOption: Partial<TagOption> = {
      value: generatedValue,
      label: newOptionLabel.trim(),
      priceModifier: newOptionPrice ? parseFloat(newOptionPrice) : null,
      isDefault: options.length === 0,
      position: options.length,
    };

    setOptions([...options, newOption]);
    setNewOptionLabel('');
    setNewOptionPrice('');
  };

  const handleDeleteOption = (index: number) => {
    const option = options[index];

    // Si l'option a un ID, on la marque pour suppression au save
    if (option.id) {
      setOptionsToDelete([...optionsToDelete, option.id]);
    }

    // On retire l'option de l'état local pour l'UI
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!label.trim() || !fieldType) return;

    const generatedName = label.trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    if (tag?.id && optionsToDelete.length > 0) {
      try {
        await onBulkDeleteOptions(tag.id, optionsToDelete);
      } catch (error) {
        console.error('Error bulk deleting options:', error);
      }
    }

    // 💰 Convertir euros -> centimes pour l'envoi API
    const optionsInCents = needsOptions
      ? options.map(opt => ({
          ...opt,
          priceModifier: opt.priceModifier != null ? eurosToCents(Number(opt.priceModifier)) : null
        }))
      : undefined;

    onSave(
      {
        name: generatedName,
        label: label.trim(),
        fieldType,
        isRequired,
      },
      optionsInCents
    );
  };

  const fieldTypes: { value: TagFieldType; label: string }[] = [
    { value: 'select', label: 'Sélection simple' },
    { value: 'multi-select', label: 'Sélection multiple' },
    { value: 'number', label: 'Nombre' },
    { value: 'text', label: 'Texte libre' },
    { value: 'toggle', label: 'Oui/Non' },
  ];

  const getFieldTypeLabel = (type: TagFieldType | null): string => {
    if (!type) return '';
    return fieldTypes.find(ft => ft.value === type)?.label || type;
  };

  return (
    <View style={styles.panelContent}>
      <View style={styles.panelHeader}>
        <View>
          <Text style={styles.panelTitle}>{tag ? 'Modifier le tag' : 'Nouveau tag'}</Text>
          <Text style={styles.panelSubtitle}>
            {tag ? 'Modifier les paramètres du tag' : 'Sélectionnez un type de champ pour commencer'}
          </Text>
        </View>
        <TouchableOpacity onPress={onCancel} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <X size={24} color="#64748B" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.panelForm}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Étape 1: Sélection du type de champ (avant configuration) */}
        {!showConfiguration && (
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Type de champ</Text>
            <View style={styles.radioGroup}>
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
                  <Text style={[styles.radioLabel, fieldType === type.value && styles.radioLabelActive]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Étape 2: Configuration (affichée après sélection) */}
        {showConfiguration && (
          <>
            {/* Type de champ sélectionné avec option de changement */}
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
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Nom du tag</Text>
              <TextInput
                style={styles.formInput}
                value={label}
                onChangeText={setLabel}
                placeholder="Ex: Cuisson, Garnitures..."
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Obligatoire */}
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => setIsRequired(!isRequired)}
              activeOpacity={1}
            >
              <View style={[styles.checkboxBox, isRequired && styles.checkboxBoxChecked]}>
                {isRequired && <Check size={16} color="#FFFFFF" strokeWidth={3} />}
              </View>
              <Text style={styles.checkboxLabel}>Champ obligatoire</Text>
            </TouchableOpacity>

            {/* Options */}
            {needsOptions && (
              <>
                <View style={styles.divider} />
                <Text style={styles.formLabel}>Options</Text>

                {options.map((option, index) => (
                  <View key={index} style={styles.optionRow}>
                    <View style={styles.optionInputs}>
                      <TextInput
                        style={[styles.formInput, styles.optionLabelInput]}
                        value={option.label}
                        editable={false}
                        placeholderTextColor="#94A3B8"
                      />
                      <TextInput
                        style={[styles.formInput, styles.optionPriceInput]}
                        value={option.priceModifier?.toString() || '0'}
                        editable={false}
                        placeholder="€"
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
                ))}

                <View style={styles.optionRow}>
                  <View style={styles.optionInputs}>
                    <TextInput
                      style={[styles.formInput, styles.optionLabelInput]}
                      value={newOptionLabel}
                      onChangeText={setNewOptionLabel}
                      placeholder="Nom de l'option"
                      placeholderTextColor="#94A3B8"
                    />
                    <TextInput
                      style={[styles.formInput, styles.optionPriceInput]}
                      value={newOptionPrice}
                      onChangeText={setNewOptionPrice}
                      placeholder="Prix €"
                      keyboardType="decimal-pad"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.addOptionButton,
                      !newOptionLabel.trim() && styles.addOptionButtonDisabled
                    ]}
                    onPress={handleAddOption}
                    disabled={!newOptionLabel.trim()}
                    activeOpacity={0.7}
                  >
                    <Plus size={20} color={newOptionLabel.trim() ? '#A855F7' : '#CBD5E1'} strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.panelFooter}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, (!label.trim() || !showConfiguration) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!label.trim() || !showConfiguration}
        >
          <Check size={20} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.saveButtonText}>Enregistrer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  panelContent: {
    flex: 1,
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
  panelForm: {
    flex: 1,
    padding: 20,
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
  radioGroup: {
    gap: 8,
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
  radioLabel: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
  },
  radioLabelActive: {
    color: '#1E293B',
    fontWeight: '500',
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: '#A855F7',
    borderColor: '#A855F7',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#1E293B',
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
    marginBottom: 8,
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
    width: 100,
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
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F8F4FF',
  },
  addOptionButtonDisabled: {
    backgroundColor: '#F1F5F9',
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
    backgroundColor: '#A855F7',
    gap: 8,
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
