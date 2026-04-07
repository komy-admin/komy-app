import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Pressable, Keyboard, Platform, ScrollView } from 'react-native';
import { X, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Item } from '~/types/item.types';
import { ItemType } from '~/types/item-type.types';
import { Tag } from '~/types/tag.types';
import { NumberInput } from '~/components/ui/number-input';
import { VatRateSelector } from '~/components/ui/vat-rate-selector';
import { COLOR_COLUMNS } from '~/components/ui/color-picker';
import { TagSelector } from '~/components/ui';
import { SelectButton } from '~/components/ui/select-button';
import { KeyboardAwareScrollViewWrapper } from '~/components/Keyboard';
import { centsToEuros, eurosToCents, getContrastColor } from '~/lib/utils';
import { useToast } from '~/components/ToastProvider';
import { useFormErrors } from '~/hooks/useFormErrors';
import { FormFieldError } from '~/components/ui/FormFieldError';

interface ItemFormPanelProps {
  item: Item | null;
  itemTypes: ItemType[];
  tags: Tag[];
  activeTab: string;
  onSave: (itemData: Item) => Promise<void>;
  onCancel: () => void;
}

export const ItemFormPanel: React.FC<ItemFormPanelProps> = ({
  item,
  itemTypes,
  tags,
  activeTab,
  onSave,
  onCancel,
}) => {
  const isEditing = !!item;

  const getInitialVatRate = (): number => {
    if (item?.vatRate != null) {
      return typeof item.vatRate === 'string' ? parseFloat(item.vatRate) : item.vatRate;
    }
    const typeId = item?.itemType?.id || (activeTab !== 'tous' && activeTab !== 'menus' ? activeTab : '');
    const itemType = itemTypes.find(t => t.id === typeId);
    return itemType?.vatRate
      ? (typeof itemType.vatRate === 'string' ? parseFloat(itemType.vatRate) : itemType.vatRate)
      : 20;
  };

  const [name, setName] = useState(item?.name || '');
  const [price, setPrice] = useState<number | null>(
    item?.price ? centsToEuros(typeof item.price === 'string' ? parseFloat(item.price) : item.price) : null
  );
  const [itemTypeId, setItemTypeId] = useState(
    item?.itemType?.id || (activeTab !== 'tous' && activeTab !== 'menus' ? activeTab : '')
  );
  const [color, setColor] = useState(item?.color || '');
  const [isActive, setIsActive] = useState(item?.isActive ?? true);
  const [hasNote, setHasNote] = useState(item?.hasNote ?? false);
  const [vatRate, setVatRate] = useState(getInitialVatRate());
  const [selectedTags, setSelectedTags] = useState<string[]>(item?.tags?.map(t => t.id) || []);
  const [isSaving, setIsSaving] = useState(false);
  const [isSelectingColor, setIsSelectingColor] = useState(false);
  const { showToast } = useToast();
  const formErrors = useFormErrors();

  // ItemType horizontal scroll
  const itemTypeScrollRef = useRef<ScrollView>(null);
  const [itemTypeScrollX, setItemTypeScrollX] = useState(0);
  const [itemTypeScrollMax, setItemTypeScrollMax] = useState(0);

  const handleColorSelect = useCallback((selectedColor: string) => {
    setColor(selectedColor);
    setIsSelectingColor(false);
  }, []);

  const handleCategorySelect = useCallback((id: string) => {
    setItemTypeId(id);
    formErrors.clearError('itemTypeId');
    const selectedType = itemTypes.find(t => t.id === id);
    const newVatRate = selectedType?.vatRate
      ? (typeof selectedType.vatRate === 'string' ? parseFloat(selectedType.vatRate) : selectedType.vatRate)
      : 20;
    setVatRate(newVatRate);
  }, [itemTypes, formErrors]);

  const handleTagToggle = useCallback((tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  }, []);

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    formErrors.clearAll();
    setIsSaving(true);

    try {
      const selectedItemType = itemTypes.find(t => t.id === itemTypeId);
      const selectedTagObjects = tags.filter(t => selectedTags.includes(t.id));

      const itemData: Item = {
        id: item?.id || '',
        name: name.trim(),
        price: eurosToCents(price || 0),
        color: color || undefined,
        itemTypeId,
        itemType: selectedItemType!,
        isActive,
        hasNote,
        vatRate,
        tags: selectedTagObjects,
      };

      await onSave(itemData);
    } catch (error) {
      formErrors.handleError(error, showToast, 'Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, itemTypes, itemTypeId, tags, selectedTags, item?.id, name, price, color, isActive, hasNote, vatRate, onSave, formErrors, showToast]);

  // Vue sélection couleur (full-screen dans le panel)
  if (isSelectingColor) {
    return (
      <View style={styles.panelContent}>
        <View style={styles.panelHeader}>
          <TouchableOpacity onPress={() => setIsSelectingColor(false)} style={styles.backButton}>
            <ArrowLeft size={24} color="#64748B" strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onCancel}>
            <X size={24} color="#64748B" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.colorSelectionView}
          contentContainerStyle={styles.colorSelectionContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.colorSelectionTitle}>Choisir une couleur</Text>
          <Text style={styles.colorSelectionSubtitle}>
            Sélectionnez la couleur qui représente cet article
          </Text>

          {/* Preview */}
          {color ? (
            <View style={[styles.colorPreviewBanner, { backgroundColor: color }]}>
              <Text style={[styles.colorPreviewBannerText, { color: getContrastColor(color) }]}>
                {color.toUpperCase()}
              </Text>
            </View>
          ) : null}

          {/* Palette */}
          <View style={styles.colorGrid}>
            {[0, 1, 2, 3, 4].map((rowIndex) => (
              <View key={rowIndex} style={styles.colorGridRow}>
                {COLOR_COLUMNS.map((column, colIndex) => {
                  const c = column[rowIndex];
                  if (c === '#FFFFFF') {
                    return (
                      <Pressable
                        key={`${rowIndex}-${colIndex}`}
                        style={[
                          styles.colorGridButton,
                          styles.colorGridButtonNone,
                          !color && styles.colorGridButtonSelected,
                        ]}
                        onPress={() => handleColorSelect('')}
                      >
                        <X size={14} color="#94A3B8" strokeWidth={2} />
                      </Pressable>
                    );
                  }
                  return (
                    <Pressable
                      key={`${rowIndex}-${colIndex}`}
                      style={[
                        styles.colorGridButton,
                        { backgroundColor: c },
                        color === c && styles.colorGridButtonSelected,
                      ]}
                      onPress={() => handleColorSelect(c)}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.panelContent}>
      {/* Header */}
      <View style={styles.panelHeader}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.panelTitle} numberOfLines={1} ellipsizeMode="tail">
            {isEditing ? "Modifier l'article" : 'Nouvel article'}
          </Text>
          <Text style={styles.panelSubtitle} numberOfLines={2} ellipsizeMode="tail">
            {isEditing ? "Modifier les informations de l'article" : "Remplissez les informations pour créer un article"}
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
        <Pressable style={styles.flexContainer} onPress={() => { if (Platform.OS !== 'web') Keyboard.dismiss(); }}>
          {/* Catégorie */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Catégorie</Text>
            <View style={[styles.itemTypeScrollContainer, formErrors.hasError('itemTypeId') && styles.scrollContainerError]}>
              {Platform.OS === 'web' && (
                <Pressable
                  style={styles.scrollArrow}
                  onPress={() => itemTypeScrollRef.current?.scrollTo({ x: Math.max(0, itemTypeScrollX - 200), animated: true })}
                >
                  <ChevronLeft size={18} color={itemTypeScrollX > 0 ? '#374151' : '#D1D5DB'} strokeWidth={2} />
                </Pressable>
              )}
              <ScrollView
                ref={itemTypeScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.itemTypeScrollContent}
                onScroll={(e) => {
                  setItemTypeScrollX(e.nativeEvent.contentOffset.x);
                  setItemTypeScrollMax(
                    e.nativeEvent.contentSize.width - e.nativeEvent.layoutMeasurement.width
                  );
                }}
                scrollEventThrottle={16}
                style={styles.itemTypeScroll}
              >
                {itemTypes.map((type) => (
                  <SelectButton
                    key={type.id}
                    label={type.name}
                    isActive={itemTypeId === type.id}
                    onPress={() => handleCategorySelect(type.id)}
                    variant="sub"
                  />
                ))}
              </ScrollView>
              {Platform.OS === 'web' && (
                <Pressable
                  style={styles.scrollArrow}
                  onPress={() => itemTypeScrollRef.current?.scrollTo({ x: Math.min(itemTypeScrollMax, itemTypeScrollX + 200), animated: true })}
                >
                  <ChevronRight size={18} color={itemTypeScrollX < itemTypeScrollMax - 1 ? '#374151' : '#D1D5DB'} strokeWidth={2} />
                </Pressable>
              )}
            </View>
            <FormFieldError message={formErrors.getError('itemTypeId')} />
          </View>

          {/* Nom + Couleur */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Nom & Couleur</Text>
            <View style={styles.nameColorRow}>
              <TextInput
                style={[styles.formInput, styles.nameInput, formErrors.hasError('name') && styles.formInputError]}
                value={name}
                onChangeText={(text) => { setName(text); formErrors.clearError('name'); }}
                placeholder="Ex: Steak frites, Coca-Cola..."
                placeholderTextColor="#94A3B8"
              />
              <TouchableOpacity
                style={[
                  styles.colorButton,
                  !color && styles.colorButtonEmpty,
                  color && [styles.colorButtonSelected, { backgroundColor: color, borderColor: color }],
                ]}
                onPress={() => setIsSelectingColor(true)}
              >
                {color ? (
                  <Text style={[styles.colorButtonText, { color: getContrastColor(color) }]}>
                    {color.toUpperCase()}
                  </Text>
                ) : (
                  <Text style={styles.colorButtonPlaceholder}>+</Text>
                )}
              </TouchableOpacity>
            </View>
            <FormFieldError message={formErrors.getError('name')} />
          </View>

          {/* Prix + Statut + Notes */}
          <View style={styles.formRow}>
            <View style={styles.formRowItem}>
              <Text style={styles.formLabel}>Prix (€)</Text>
              <NumberInput
                value={price}
                onChangeText={(v) => { setPrice(v); formErrors.clearError('price'); }}
                decimalPlaces={2}
                min={0}
                max={1000}
                currency="€"
                placeholder="0.00"
                style={[styles.formInput, formErrors.hasError('price') && styles.formInputError]}
              />
              <FormFieldError message={formErrors.getError('price')} />
            </View>
            <View style={styles.formRowItem}>
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
              </TouchableOpacity>
            </View>
            <View style={styles.formRowItem}>
              <Text style={styles.formLabel}>Notes</Text>
              <TouchableOpacity
                style={[styles.toggleOption, hasNote && styles.toggleOptionNote]}
                onPress={() => setHasNote(!hasNote)}
                activeOpacity={1}
              >
                <View style={[styles.toggleIndicator, hasNote && styles.toggleIndicatorNote]} />
                <Text style={[styles.toggleText, hasNote && styles.toggleTextNote]}>
                  {hasNote ? 'Oui' : 'Non'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* TVA */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Taux de TVA</Text>
            <VatRateSelector
              value={vatRate}
              onChange={(value) => setVatRate(value || 20)}
              showInheritOption={false}
              disabled={false}
            />
          </View>

          {/* Tags */}
          {tags.length > 0 && (
            <>
              <View style={styles.divider} />
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Tags</Text>
                <View style={formErrors.hasError('tags') ? styles.scrollContainerError : undefined}>
                  <TagSelector
                    tags={tags}
                    selectedTagIds={selectedTags}
                    onTagToggle={(tagId) => { handleTagToggle(tagId); formErrors.clearError('tags'); }}
                  />
                </View>
                <FormFieldError message={formErrors.getError('tags')} />
              </View>
            </>
          )}
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
  flexContainer: {
    flex: 1,
  },
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  formRowItem: {
    flex: 1,
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
    fontSize: 13,
    color: '#1E293B',
  },
  formInputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  itemTypeScrollContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemTypeScroll: {
    flex: 1,
  },
  itemTypeScrollContent: {
    gap: 8,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  scrollArrow: {
    width: 32,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    } as any),
  },
  scrollContainerError: {
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    padding: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginTop: 4,
    marginBottom: 16,
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
  toggleOptionNote: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FBBF24',
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
  toggleIndicatorNote: {
    backgroundColor: '#F59E0B',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  toggleTextActive: {
    color: '#047857',
  },
  toggleTextNote: {
    color: '#92400E',
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

  // Name + Color row (like nameIconRow in ItemTypeFormPanel)
  nameColorRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  nameInput: {
    flex: 1,
  },
  colorButton: {
    width: 56,
    height: 44,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' && { cursor: 'pointer' as any }),
  },
  colorButtonEmpty: {
    borderStyle: 'dashed',
  },
  colorButtonSelected: {
    borderWidth: 2,
  },
  colorButtonText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  colorButtonPlaceholder: {
    fontSize: 20,
    fontWeight: '400',
    color: '#94A3B8',
  },

  // Color selection view
  colorSelectionView: {
    flex: 1,
    padding: 20,
  },
  colorSelectionContent: {
    paddingBottom: 40,
  },
  colorSelectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  colorSelectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 24,
    lineHeight: 20,
  },
  colorPreviewBanner: {
    height: 44,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorPreviewBannerText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  colorGrid: {
    gap: 8,
  },
  colorGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  colorGridButton: {
    width: '11.5%',
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    ...(Platform.OS === 'web' && { cursor: 'pointer' as any }),
  },
  colorGridButtonSelected: {
    borderColor: '#1E293B',
  },
  colorGridButtonNone: {
    backgroundColor: '#F8FAFC',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
