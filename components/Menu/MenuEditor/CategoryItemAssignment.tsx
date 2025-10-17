import { memo, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Plus, Package } from 'lucide-react-native';
import { LocalMenuCategoryItem } from './MenuEditor.types';
import { Item } from '~/types/item.types';
import { IconButton } from '~/components/ui/IconButton';

interface CategoryItemAssignmentProps {
  categoryIndex: number;
  localItems: LocalMenuCategoryItem[];
  availableItems: Item[];
  onOpenAddPanel: () => void;
  onOpenEditPanel: (item: LocalMenuCategoryItem) => void;
  onRemoveItem: (tempId: string) => void;
  onToggleItemAvailability?: (tempId: string) => void;
}

export const CategoryItemAssignment = memo<CategoryItemAssignmentProps>(({
  categoryIndex,
  localItems,
  availableItems,
  onOpenAddPanel,
  onOpenEditPanel,
  onRemoveItem,
  onToggleItemAvailability
}) => {
  const visibleItems = useMemo(() =>
    localItems.filter(item => !item.isDeleted),
    [localItems]
  );

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
              onPress={onOpenAddPanel}
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

        {visibleItems.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 16 }}>
            <Package size={24} color="#D1D5DB" />
            <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 4 }}>
              {availableItems.length === 0 ?
                'Tous les articles de ce type sont déjà assignés' :
                'Aucun article assigné'
              }
            </Text>
          </View>
        ) : (
          <View style={styles.assignedItemsListNew}>
            {visibleItems.map((localItem: LocalMenuCategoryItem) => (
              <View key={localItem.tempId} style={styles.assignedItemNew}>
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
                      onPress={() => onOpenEditPanel(localItem)}
                    />

                    <IconButton
                      iconName="trash"
                      variant="danger"
                      isTransparent={false}
                      onPress={() => onRemoveItem(localItem.tempId)}
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
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
});
