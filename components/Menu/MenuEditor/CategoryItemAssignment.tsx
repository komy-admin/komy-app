import { memo, useCallback } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Platform } from 'react-native';
import { Plus, Package } from 'lucide-react-native';
import { Select } from '~/components/ui/select';
import { LocalMenuCategoryItem, CategoryItemFormData } from './MenuEditor.types';
import { Item } from '~/types/item.types';
import { IconButton } from '~/components/ui/IconButton';

// Helper pour z-index négatifs sur web
const getWebNegativeZIndex = (zIndex: number) =>
  Platform.OS === 'web' ? { zIndex, position: 'relative' as const } : {};

// Styles précalculés pour éviter la recréation d'objets
const WEB_STYLES = {
  ARTICLES: getWebNegativeZIndex(-5),
  BUTTONS: getWebNegativeZIndex(-10),
} as const;

interface CategoryItemAssignmentProps {
  categoryIndex: number;
  localItems: LocalMenuCategoryItem[];
  availableItems: Item[];
  showAddForm: boolean;
  itemFormData: CategoryItemFormData;
  editingItem: { categoryIndex: number; tempId: string } | null;
  editItemData: { supplement: string; isAvailable: boolean };

  onToggleAddForm: () => void;
  onUpdateItemFormData: (field: keyof CategoryItemFormData, value: any) => void;
  onAddItem: () => void;
  onRemoveItem: (tempId: string) => void;
  onStartEditingItem: (tempId: string) => void;
  onUpdateEditItemData: (field: 'supplement' | 'isAvailable', value: any) => void;
  onSaveEditedItem: () => void;
  onCancelEditingItem: () => void;
  onToggleItemAvailability?: (tempId: string) => void;
}

export const CategoryItemAssignment = memo<CategoryItemAssignmentProps>(({
  categoryIndex,
  localItems,
  availableItems,
  showAddForm,
  itemFormData,
  editingItem,
  editItemData,
  onToggleAddForm,
  onUpdateItemFormData,
  onAddItem,
  onRemoveItem,
  onStartEditingItem,
  onUpdateEditItemData,
  onSaveEditedItem,
  onCancelEditingItem,
  onToggleItemAvailability
}) => {
  const visibleItems = localItems.filter(item => !item.isDeleted);
  const isEditingCurrentCategory = editingItem?.categoryIndex === categoryIndex;

  const handleToggleAddForm = useCallback(() => {
    onToggleAddForm();
  }, [onToggleAddForm]);

  const handleAddItem = useCallback(() => {
    onAddItem();
  }, [onAddItem]);

  const handleUpdateSupplement = useCallback((value: string) => {
    onUpdateItemFormData('supplement', value);
  }, [onUpdateItemFormData]);

  const handleSelectChange = useCallback((option: any) => {
    if (option) {
      onUpdateItemFormData('itemId', option.id);
    }
  }, [onUpdateItemFormData]);

  return (
    <View style={styles.articlesSection}>
      <View style={styles.articlesSectionHeader}>
        <View style={styles.articlesSectionBadge}>
          <Package size={16} color="#FFFFFF" />
        </View>
        <View style={styles.articlesSectionContent}>
          <Text style={styles.articlesSectionTitle}>Articles de cette catégorie</Text>
          <Text style={styles.articlesSectionSubtitle}>
            {visibleItems.length} article{visibleItems.length > 1 ? 's' : ''} configuré{visibleItems.length > 1 ? 's' : ''}
            {availableItems.length > 0 && (
              <Text style={styles.articlesSectionAvailable}>
                {' • '}{availableItems.length} disponible{availableItems.length > 1 ? 's' : ''}
              </Text>
            )}
          </Text>
        </View>
        {availableItems.length > 0 && (
          <Pressable
            onPress={handleToggleAddForm}
            accessibilityRole="button"
            accessibilityLabel="Ajouter un article"
            style={({ pressed }) => ({
              opacity: pressed ? 0.8 : 1,
              transform: pressed ? [{ scale: 0.95 }] : [{ scale: 1 }],
            })}
          >
            <View style={styles.addItemButtonOptimized}>
              <Plus size={14} color="white" style={{ marginRight: 6 }} />
              <Text style={styles.addItemButtonOptimizedText}>Ajouter</Text>
            </View>
          </Pressable>
        )}
      </View>

      {showAddForm && (
        <View style={styles.addItemForm}>
          <View style={styles.addItemFormContent}>
            <View style={styles.addItemFormRow}>
              <View style={[styles.field, styles.fieldLarge]}>
                <Text style={[styles.label, { fontSize: 13, color: '#6B7280' }]}>Article *</Text>
                <Select
                  choices={availableItems.filter(item => visibleItems.every(visibleItem => visibleItem.itemId !== item.id)).map(item => ({
                    label: item.name,
                    value: item.id,
                    id: item.id
                  }))}
                  selectedValue={itemFormData.itemId ? {
                    label: availableItems.find(i => i.id === itemFormData.itemId)?.name || '',
                    value: itemFormData.itemId,
                    id: itemFormData.itemId
                  } : undefined}
                  placeholder="Sélectionner un article"
                  maxHeight={200}
                  onValueChange={handleSelectChange}
                />
              </View>

              <View style={[styles.field, styles.fieldSmall]}>
                <Text style={[styles.label, { fontSize: 13, color: '#6B7280' }]}>Supplément (€)</Text>
                <TextInput
                  value={itemFormData.supplement}
                  onChangeText={handleUpdateSupplement}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor="#A0A0A0"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={[styles.addItemFormActions, WEB_STYLES.BUTTONS]}>
              <Pressable onPress={handleAddItem} style={styles.addItemFormButtonPrimary}>
                <Text style={styles.addItemFormButtonTextPrimary}>Confirmer</Text>
              </Pressable>
              <Pressable onPress={handleToggleAddForm} style={styles.addItemFormButtonSecondary}>
                <Text style={styles.addItemFormButtonTextSecondary}>Annuler</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {visibleItems.length === 0 && !showAddForm ? (
        <View style={[
          { alignItems: 'center', paddingVertical: 16 },
          WEB_STYLES.ARTICLES
        ]}>
          <Package size={24} color="#D1D5DB" />
          <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 4 }}>
            {availableItems.length === 0 ?
              'Tous les articles de ce type sont déjà assignés' :
              'Aucun article assigné'
            }
          </Text>
        </View>
      ) : visibleItems.length > 0 ? (
        <View style={[styles.assignedItemsListNew, WEB_STYLES.ARTICLES]}>
          {visibleItems.map((localItem: LocalMenuCategoryItem) => {
            const isEditing = isEditingCurrentCategory && editingItem?.tempId === localItem.tempId;

            return (
              <View key={localItem.tempId} style={styles.assignedItemNew}>
                {isEditing ? (
                  <View style={styles.editItemForm}>
                    <View style={styles.editItemFormHeader}>
                      <Text style={styles.editItemFormTitle}>
                        Modifier "{localItem.item?.name}"
                      </Text>
                    </View>

                    <View style={styles.editItemFormContent}>
                      <View style={styles.editItemFormRow}>
                        <View style={[styles.field, styles.fieldLarge]}>
                          <Text style={[styles.label, { fontSize: 13, color: '#6B7280' }]}>Supplément (€)</Text>
                          <TextInput
                            value={editItemData.supplement}
                            onChangeText={(value) => onUpdateEditItemData('supplement', value)}
                            keyboardType="decimal-pad"
                            placeholder="0.00"
                            placeholderTextColor="#A0A0A0"
                            style={styles.input}
                          />
                        </View>

                        <View style={[styles.field, styles.fieldSmall, { marginLeft: 12 }]}>
                          <Text style={[styles.label, { fontSize: 13, color: '#6B7280' }]}>Disponibilité</Text>
                          <Pressable
                            style={[styles.editAvailabilityToggle, editItemData.isAvailable && styles.editAvailabilityToggleActive]}
                            onPress={() => onUpdateEditItemData('isAvailable', !editItemData.isAvailable)}
                          >
                            <View style={[styles.editAvailabilityIndicator, editItemData.isAvailable && styles.editAvailabilityIndicatorActive]} />
                            <Text style={[styles.editAvailabilityText, editItemData.isAvailable && styles.editAvailabilityTextActive]}>
                              {editItemData.isAvailable ? 'Disponible' : 'Indisponible'}
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                      <View style={[styles.editItemFormActions, WEB_STYLES.BUTTONS]}>
                        <Pressable onPress={onSaveEditedItem} style={styles.addItemFormButtonPrimary}>
                          <Text style={styles.addItemFormButtonTextPrimary}>Confirmer</Text>
                        </Pressable>
                        <Pressable onPress={onCancelEditingItem} style={styles.addItemFormButtonSecondary}>
                          <Text style={styles.addItemFormButtonTextSecondary}>Annuler</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.assignedItemMainContent}>
                    <View style={styles.assignedItemInfoNew}>
                      <Text style={styles.assignedItemNameNew}>
                        {localItem.item?.name}
                      </Text>
                      <View style={styles.assignedItemMetrics}>
                        {localItem.supplement > 0 && (
                          <View style={styles.assignedItemSupplement}>
                            <Text style={styles.assignedItemSupplementText}>
                              +{localItem.supplement}€
                            </Text>
                          </View>
                        )}
                        <View style={[
                          styles.assignedItemStatus,
                          localItem.isAvailable ? styles.assignedItemStatusActive : styles.assignedItemStatusInactive
                        ]}>
                          <View style={[
                            styles.assignedItemStatusDot,
                            localItem.isAvailable ? styles.assignedItemStatusDotActive : styles.assignedItemStatusDotInactive
                          ]} />
                          <Text style={[
                            styles.assignedItemStatusText,
                            localItem.isAvailable ? styles.assignedItemStatusTextActive : styles.assignedItemStatusTextInactive
                          ]}>
                            {localItem.isAvailable ? 'Disponible' : 'Indisponible'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.assignedItemActionsNew}>
                      <IconButton
                        iconName={localItem.isAvailable ? 'eye' : 'eye-off'}
                        variant={localItem.isAvailable ? 'success' : 'neutral'}
                        isTransparent={true}
                        onPress={() => {
                          if (onToggleItemAvailability) {
                            onToggleItemAvailability(localItem.tempId);
                          }
                        }}
                      />

                      <IconButton
                        iconName="pencil"
                        variant="primary"
                        isTransparent={true}
                        onPress={() => onStartEditingItem(localItem.tempId)}
                      />

                      <IconButton
                        iconName="trash"
                        variant="danger"
                        isTransparent={false}
                        onPress={() => onRemoveItem(localItem.tempId)}
                      />
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
});

CategoryItemAssignment.displayName = 'CategoryItemAssignment';

const styles = StyleSheet.create({
  articlesSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  articlesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },

  articlesSectionBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    ...Platform.select({
      ios: { elevation: 3 },
      android: { elevation: 0 },
      web: { elevation: 3 },
    }),
  },

  articlesSectionContent: {
    flex: 1,
  },

  articlesSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: 0.2,
    marginBottom: 4,
  },

  articlesSectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },

  articlesSectionAvailable: {
    color: '#059669',
    fontWeight: '600',
  },

  addItemButtonOptimized: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },

  addItemButtonOptimizedText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  addItemForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },

  addItemFormContent: {
    gap: 12,
  },

  addItemFormRow: {
    flexDirection: 'row',
    gap: 12,
  },

  field: {
    flex: 1,
  },

  fieldLarge: {
    flex: 2,
  },

  fieldSmall: {
    flex: 1,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2E33',
    marginBottom: 8,
    letterSpacing: 0.5,
    ...(Platform.OS === 'web' && {
      fontFamily: 'system-ui, -apple-system, sans-serif',
    })
  },

  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    color: '#2A2E33',
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    ...Platform.select({
      ios: {
        paddingVertical: 12,
        minHeight: 44,
        elevation: 1,
      },
      android: {
        height: 44,
        paddingTop: 11,
        paddingBottom: 11,
        elevation: 0
      },
      web: {
        height: 44,
        paddingTop: 11,
        paddingBottom: 11,
        elevation: 1,
        cursor: 'text',
        transition: 'all 0.2s ease',
        ':focus': {
          borderColor: '#2A2E33',
          shadowOpacity: 0.1,
        }
      } as any,
    }),
  },


  addItemFormActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },

  addItemFormButtonPrimary: {
    backgroundColor: '#2A2E33',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: '#2A2E33',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    ...Platform.select({
      ios: { elevation: 2 },
      android: { elevation: 0 },
      web: { elevation: 2 },
    }),
  },

  addItemFormButtonTextPrimary: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },

  addItemFormButtonSecondary: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  addItemFormButtonTextSecondary: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },

  assignedItemsListNew: {
    gap: 12,
  },

  assignedItemNew: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    minHeight: 58,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    ...Platform.select({
      ios: { elevation: 2 },
      android: { elevation: 0 },
      web: { elevation: 2 },
    }),
    ...(Platform.OS === 'web' && {
      transition: 'all 0.2s ease',
      ':hover': {
        borderColor: '#CBD5E1',
        shadowOpacity: 0.08,
        transform: 'translateY(-1px)',
      }
    })
  },

  assignedItemMainContent: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    minHeight: 44,
  },

  assignedItemInfoNew: {
    flex: 1,
    marginRight: 16,
    justifyContent: 'center',
  },

  assignedItemNameNew: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: 0.2,
    marginBottom: 6,
  },

  assignedItemMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  assignedItemSupplement: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  assignedItemSupplementText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },

  assignedItemStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },

  assignedItemStatusActive: {
    backgroundColor: '#ECFDF5',
  },

  assignedItemStatusInactive: {
    backgroundColor: '#FEF2F2',
  },

  assignedItemStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  assignedItemStatusDotActive: {
    backgroundColor: '#059669',
  },

  assignedItemStatusDotInactive: {
    backgroundColor: '#DC2626',
  },

  assignedItemStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },

  assignedItemStatusTextActive: {
    color: '#047857',
  },

  assignedItemStatusTextInactive: {
    color: '#B91C1C',
  },

  assignedItemActionsNew: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    alignSelf: 'center',
  },


  editItemForm: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    ...Platform.select({
      ios: { elevation: 4 },
      android: { elevation: 0 },
      web: { elevation: 4 },
    }),
  },

  editItemFormHeader: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },

  editItemFormTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: 0.2,
  },

  editItemFormContent: {
    gap: 16,
  },

  editItemFormRow: {
    flexDirection: 'row',
    gap: 16
  },

  editItemFormActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
    paddingTop: 12,
  },

  // Toggle pour la disponibilité dans le formulaire d'édition
  editAvailabilityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    })
  },

  editAvailabilityToggleActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#34D399',
    shadowColor: '#10B981',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    ...Platform.select({
      ios: { elevation: 3 },
      android: { elevation: 0 },
      web: {
        elevation: 3,
        boxShadow: '0 0 0 3px rgba(52, 211, 153, 0.1), 0 4px 12px rgba(16, 185, 129, 0.15)',
      },
    }),
  },

  editAvailabilityIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#9CA3AF',
    marginRight: 12,
  },

  editAvailabilityIndicatorActive: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    ...Platform.select({
      ios: { elevation: 2 },
      android: { elevation: 0 },
      web: { elevation: 2 },
    }),
  },

  editAvailabilityText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.2,
    ...(Platform.OS === 'web' ? {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontWeight: 600,
    } : {})
  },

  editAvailabilityTextActive: {
    color: '#047857',
    fontWeight: '700',
    ...(Platform.OS === 'web' ? {
      fontWeight: 700,
    } : {})
  },
});