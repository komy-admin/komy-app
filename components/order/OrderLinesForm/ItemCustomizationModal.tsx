import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Dimensions,
  Modal
} from 'react-native';
import { Text, TextInput, NumberInput } from '~/components/ui';
import { Item } from '~/types/item.types';
import { Tag } from '~/types/tag.types';
import { SelectedTag } from '~/types/order-line.types';
import { StickyNote, Tag as TagIcon, X } from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ItemCustomizationModalProps {
  item: Item;
  visible: boolean;
  availableTags: Tag[];
  initialData?: { note?: string; tags?: SelectedTag[] };
  onConfirm: (data: { note?: string; tags: SelectedTag[] }) => void;
  onCancel: () => void;
}

export const ItemCustomizationModal: React.FC<ItemCustomizationModalProps> = ({
  item,
  visible,
  availableTags,
  initialData,
  onConfirm,
  onCancel
}) => {
  const [note, setNote] = useState(initialData?.note || '');
  const [tagValues, setTagValues] = useState<Record<string, any>>({});

  // Initialiser les valeurs des tags depuis initialData
  useEffect(() => {
    if (initialData?.tags) {
      const values: Record<string, any> = {};
      initialData.tags.forEach((t: any) => {
        const tagId = t.tagId || t.tagSnapshot?.id;
        if (tagId) {
          values[tagId] = t.value;
        }
      });
      setTagValues(values);
      setNote(initialData.note || '');
    } else {
      setTagValues({});
      setNote('');
    }
  }, [initialData, visible, availableTags]);

  const handleTagValueChange = useCallback((tagId: string, value: any) => {
    setTagValues(prev => ({
      ...prev,
      [tagId]: value
    }));
  }, []);

  // Calculer les SelectedTag à partir des valeurs actuelles
  const selectedTags = useMemo((): SelectedTag[] => {
    const tags: SelectedTag[] = [];

    Object.entries(tagValues).forEach(([tagId, value]) => {
      const tag = availableTags.find(t => t.id === tagId);
      if (!tag || value === undefined || value === null || value === '') return;

      let priceModifier = 0;

      // Calculer le priceModifier selon le type
      if (tag.fieldType === 'select' && typeof value === 'string') {
        const option = tag.options?.find(o => o.value === value);
        priceModifier = option?.priceModifier || 0;
      } else if (tag.fieldType === 'multi-select' && Array.isArray(value)) {
        value.forEach(v => {
          const option = tag.options?.find(o => o.value === v);
          priceModifier += option?.priceModifier || 0;
        });
      } else if (tag.fieldType === 'toggle' && value === true) {
        const defaultOption = tag.options?.find(o => o.isDefault);
        priceModifier = defaultOption?.priceModifier || 0;
      }

      tags.push({
        tagId: tag.id,
        tagSnapshot: {
          id: tag.id,
          name: tag.name,
          label: tag.label,
          fieldType: tag.fieldType,
          isRequired: tag.isRequired,
          snapshotAt: new Date().toISOString()
        },
        value,
        priceModifier
      });
    });

    return tags;
  }, [tagValues, availableTags]);

  const totalPrice = useMemo(() => {
    const tagsPrice = selectedTags.reduce((sum, t) => sum + (t.priceModifier || 0), 0);
    return item.price + tagsPrice;
  }, [item.price, selectedTags]);

  const canConfirm = useMemo(() => {
    // Vérifier que tous les tags requis ont une valeur
    return availableTags.every(tag => {
      if (!tag.isRequired) return true;
      const value = tagValues[tag.id];
      if (value === undefined || value === null || value === '') return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    });
  }, [availableTags, tagValues]);

  const handleConfirm = useCallback(() => {
    if (!canConfirm) return;
    onConfirm({
      note: note.trim() || undefined,
      tags: selectedTags
    });
  }, [canConfirm, note, selectedTags, onConfirm]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{item.name}</Text>
            <Pressable onPress={onCancel} style={styles.closeButton}>
              <X size={24} color="#666666" strokeWidth={2.5} />
            </Pressable>
          </View>

          {/* Prix sticky */}
          <View style={styles.priceSticky}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Prix de base</Text>
              <Text style={styles.priceBase}>{Number(item.price).toFixed(2)}€</Text>
            </View>
            {selectedTags.length > 0 && selectedTags.some(t => t.priceModifier !== 0) && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Options</Text>
                <Text style={styles.priceModifier}>
                  +{Number(selectedTags.reduce((sum, t) => sum + (t.priceModifier || 0), 0)).toFixed(2)}€
                </Text>
              </View>
            )}
            <View style={styles.priceDivider} />
            <View style={styles.priceRow}>
              <Text style={styles.priceTotalLabel}>TOTAL</Text>
              <Text style={styles.priceTotalValue}>{Number(totalPrice).toFixed(2)}€</Text>
            </View>
          </View>

          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContentContainer}
          >
            {/* Section Notes */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <StickyNote size={20} color="#F59E0B" strokeWidth={2.5} />
                <Text style={styles.sectionTitle}>Notes & Instructions</Text>
              </View>
              <View style={styles.noteInputContainer}>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="Ex: Sans oignons, bien cuit, sauce à part..."
                  placeholderTextColor="#9CA3AF"
                  style={styles.noteInput}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Séparateur visuel */}
            {availableTags.length > 0 && <View style={styles.sectionDivider} />}

            {/* Section Options/Tags */}
            {availableTags.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <TagIcon size={20} color="#8B5CF6" strokeWidth={2.5} />
                  <Text style={styles.sectionTitle}>Options & Personnalisation</Text>
                </View>
                {availableTags.map(tag => (
                  <TagField
                    key={tag.id}
                    tag={tag}
                    value={tagValues[tag.id]}
                    onChange={(value) => handleTagValueChange(tag.id, value)}
                  />
                ))}
              </View>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <Pressable style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </Pressable>
            <Pressable
              style={[styles.confirmButton, !canConfirm && styles.confirmButtonDisabled]}
              onPress={handleConfirm}
              disabled={!canConfirm}
            >
              <Text style={styles.confirmButtonText}>
                {initialData ? 'Modifier' : 'Ajouter à la commande'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Composant pour afficher un champ de tag selon son type
interface TagFieldProps {
  tag: Tag;
  value: any;
  onChange: (value: any) => void;
}

const TagField: React.FC<TagFieldProps> = ({ tag, value, onChange }) => {
  switch (tag.fieldType) {
    case 'select':
      return <SelectField tag={tag} value={value} onChange={onChange} />;
    case 'multi-select':
      return <MultiSelectField tag={tag} value={value || []} onChange={onChange} />;
    case 'number':
      return <NumberField tag={tag} value={value} onChange={onChange} />;
    case 'text':
      return <TextField tag={tag} value={value} onChange={onChange} />;
    case 'toggle':
      return <ToggleField tag={tag} value={value} onChange={onChange} />;
    default:
      return null;
  }
};

// Champ Select (single choice)
const SelectField: React.FC<TagFieldProps> = ({ tag, value, onChange }) => {
  const options = tag.options || [];

  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>
        {tag.label}
        {tag.isRequired && <Text style={styles.required}> *</Text>}
      </Text>
      <View style={styles.optionsGrid}>
        {options.map(option => {
          const isSelected = value === option.value;
          return (
            <Pressable
              key={option.id}
              style={[
                styles.optionChip,
                isSelected && styles.optionChipSelected
              ]}
              onPress={() => onChange(option.value)}
            >
              <View style={styles.optionChipContent}>
                <Text style={[
                  styles.optionChipLabel,
                  isSelected && styles.optionChipLabelSelected
                ]}>
                  {option.label}
                </Text>
                {option.priceModifier != null && option.priceModifier !== 0 && (
                  <View style={[
                    styles.optionPriceBadge,
                    isSelected && styles.optionPriceBadgeSelected
                  ]}>
                    <Text style={[
                      styles.optionPriceText,
                      isSelected && styles.optionPriceTextSelected
                    ]}>
                      {option.priceModifier > 0 ? '+' : ''}{Number(option.priceModifier).toFixed(2)}€
                    </Text>
                  </View>
                )}
              </View>
              {isSelected && <View style={styles.selectedIndicator} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

// Champ Multi-Select
const MultiSelectField: React.FC<TagFieldProps> = ({ tag, value, onChange }) => {
  const options = tag.options || [];
  const selectedValues = Array.isArray(value) ? value : [];

  const toggleOption = (optionValue: string) => {
    if (selectedValues.includes(optionValue)) {
      onChange(selectedValues.filter(v => v !== optionValue));
    } else {
      onChange([...selectedValues, optionValue]);
    }
  };

  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>
        {tag.label}
        {tag.isRequired && <Text style={styles.required}> *</Text>}
      </Text>
      <View style={styles.optionsGrid}>
        {options.map(option => {
          const isSelected = selectedValues.includes(option.value);
          return (
            <Pressable
              key={option.id}
              style={[
                styles.optionChip,
                isSelected && styles.optionChipSelected
              ]}
              onPress={() => toggleOption(option.value)}
            >
              <View style={styles.optionChipContent}>
                <Text style={[
                  styles.optionChipLabel,
                  isSelected && styles.optionChipLabelSelected
                ]}>
                  {option.label}
                </Text>
                {option.priceModifier != null && option.priceModifier !== 0 && (
                  <View style={[
                    styles.optionPriceBadge,
                    isSelected && styles.optionPriceBadgeSelected
                  ]}>
                    <Text style={[
                      styles.optionPriceText,
                      isSelected && styles.optionPriceTextSelected
                    ]}>
                      {option.priceModifier > 0 ? '+' : ''}{Number(option.priceModifier).toFixed(2)}€
                    </Text>
                  </View>
                )}
              </View>
              {isSelected && <View style={styles.selectedIndicator} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

// Champ Number
const NumberField: React.FC<TagFieldProps> = ({ tag, value, onChange }) => {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>
        {tag.label}
        {tag.isRequired && <Text style={styles.required}> *</Text>}
      </Text>
      <NumberInput
        value={value || 0}
        onChangeText={onChange}
        min={0}
        max={100}
        placeholder="0"
      />
    </View>
  );
};

// Champ Text
const TextField: React.FC<TagFieldProps> = ({ tag, value, onChange }) => {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>
        {tag.label}
        {tag.isRequired && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        value={value || ''}
        onChangeText={onChange}
        placeholder={`Entrez ${tag.label.toLowerCase()}`}
        placeholderTextColor="#9CA3AF"
        style={styles.textInput}
      />
    </View>
  );
};

// Champ Toggle
const ToggleField: React.FC<TagFieldProps> = ({ tag, value, onChange }) => {
  const defaultOption = tag.options?.find(o => o.isDefault);
  const priceModifier = defaultOption?.priceModifier || 0;

  return (
    <View style={styles.fieldContainer}>
      <View style={styles.toggleContainer}>
        <View style={styles.toggleInfo}>
          <Text style={styles.fieldLabel}>
            {tag.label}
            {tag.isRequired && <Text style={styles.required}> *</Text>}
          </Text>
          {priceModifier !== 0 && (
            <View style={styles.togglePriceBadge}>
              <Text style={styles.togglePriceText}>
                {priceModifier > 0 ? '+' : ''}{Number(priceModifier).toFixed(2)}€
              </Text>
            </View>
          )}
        </View>
        <Switch
          value={value || false}
          onValueChange={onChange}
          trackColor={{ false: '#E5E7EB', true: '#A7F3D0' }}
          thumbColor={value ? '#059669' : '#F3F4F6'}
          ios_backgroundColor="#E5E7EB"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: Math.min(SCREEN_WIDTH * 0.95, 550),
    height: SCREEN_HEIGHT * 0.8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  closeButton: {
    padding: 8,
  },
  priceSticky: {
    backgroundColor: '#FAFBFC',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  priceLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  priceBase: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '600',
  },
  priceModifier: {
    fontSize: 15,
    color: '#059669',
    fontWeight: '600',
  },
  priceDivider: {
    height: 1,
    backgroundColor: '#D1D5DB',
    marginTop: 8,
    marginBottom: 12,
  },
  priceTotalLabel: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  priceTotalValue: {
    fontSize: 20,
    color: '#059669',
    fontWeight: '800',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 20,
  },
  section: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 24,
    marginVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  noteInputContainer: {
    width: '100%',
  },
  noteInput: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    minHeight: 100,
    maxHeight: 100,
    fontWeight: '500',
  },
  fieldContainer: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 14,
  },
  required: {
    color: '#EF4444',
    fontSize: 16,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionChip: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    minWidth: 110,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  optionChipSelected: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
    borderWidth: 2.5,
    shadowColor: '#059669',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  optionChipContent: {
    flexDirection: 'column',
    gap: 8,
  },
  optionChipLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  optionChipLabelSelected: {
    color: '#047857',
    fontWeight: '700',
  },
  optionPriceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  optionPriceBadgeSelected: {
    backgroundColor: '#D1FAE5',
  },
  optionPriceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  optionPriceTextSelected: {
    color: '#059669',
  },
  selectedIndicator: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#059669',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    fontWeight: '500',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
  },
  toggleInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  togglePriceBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  togglePriceText: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FAFBFC',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '700',
  },
  confirmButton: {
    flex: 2,
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  confirmButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
