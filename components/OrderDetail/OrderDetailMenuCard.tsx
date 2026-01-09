import { memo, useState, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ChevronDown, ChevronUp, Clock } from 'lucide-react-native';
import { OrderLine, OrderLineItem } from '~/types/order-line.types';
import { Status } from '~/types/status.enum';
import { getMostImportantStatus, getStatusTagColor, getStatusText, hasMenuMixedStatuses, getStatusBackgroundColor, formatDate, DateFormat, getTagFieldTypeConfig } from '~/lib/utils';
import { DeleteConfirmationModal } from '~/components/ui/DeleteConfirmationModal';
import { IconButton } from '~/components/ui/IconButton';
import StatusSelector from '~/components/Service/StatusSelector';

export interface OrderDetailMenuCardProps {
  menuLine: OrderLine;
  itemTypes?: { id: string; priorityOrder: number }[]; // Pour le tri
  onUpdateItemStatus: (orderLineItem: OrderLineItem, newStatus: Status) => void;
  onUpdateMenuStatus?: (orderLineItems: OrderLineItem[], newStatus: Status) => void;
  onDelete: () => void;
  isMultiSelectMode?: boolean;
  selectedItems?: Set<string>;
  onToggleItemSelection?: (itemId: string) => void;
}

export const OrderDetailMenuCard = memo<OrderDetailMenuCardProps>(({
  menuLine,
  itemTypes = [],
  onUpdateItemStatus,
  onUpdateMenuStatus,
  onDelete,
  isMultiSelectMode = false,
  selectedItems = new Set(),
  onToggleItemSelection,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusSelector, setShowStatusSelector] = useState(false);
  const [currentItemForStatus, setCurrentItemForStatus] = useState<OrderLineItem | null>(null);

  const menuInfo = menuLine.menu;
  const orderItems = menuLine.items || [];
  const statuses = orderItems.map((item) => item.status);
  const itemStatus = getMostImportantStatus(statuses);
  const hasMixed = hasMenuMixedStatuses(statuses);
  const menuTime = menuLine.updatedAt || new Date().toISOString();

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleMenuStatusClick = () => {
    setCurrentItemForStatus(null); // null = modifier le statut du menu entier
    setShowStatusSelector(true);
  };

  const handleItemStatusClick = (item: OrderLineItem) => {
    setCurrentItemForStatus(item);
    setShowStatusSelector(true);
  };

  const handleStatusSelect = (newStatus: Status) => {
    if (currentItemForStatus) {
      // Modifier le statut d'un item individuel
      onUpdateItemStatus(currentItemForStatus, newStatus);
    } else {
      // Modifier le statut de tous les items du menu
      if (onUpdateMenuStatus) {
        // Utiliser la méthode optimisée (UN SEUL appel API)
        onUpdateMenuStatus(orderItems, newStatus);
      } else {
        // Fallback : appeler onUpdateItemStatus pour chaque item
        orderItems.forEach((item) => {
          onUpdateItemStatus(item, newStatus);
        });
      }
    }
    setShowStatusSelector(false);
    setCurrentItemForStatus(null);
  };

  // Mémoriser le calcul coûteux du tri des catégories et items
  const sortedCategories = useMemo(() => {
    // Créer un Map pour accès rapide au priorityOrder (O(1))
    const itemTypePriorityMap = new Map(
      itemTypes.map(it => [it.id, it.priorityOrder])
    );

    // Grouper les items par catégorie
    const itemsByCategory = orderItems.reduce((acc, orderLineItem) => {
      const categoryName = orderLineItem?.categoryName || 'Autres';
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(orderLineItem);
      return acc;
    }, {} as Record<string, OrderLineItem[]>);

    // Trier les items de chaque catégorie par priorityOrder de leur itemType
    Object.keys(itemsByCategory).forEach(categoryName => {
      itemsByCategory[categoryName].sort((a, b) => {
        const priorityA = itemTypePriorityMap.get(a.item?.itemType?.id || '') ?? Number.MAX_SAFE_INTEGER;
        const priorityB = itemTypePriorityMap.get(b.item?.itemType?.id || '') ?? Number.MAX_SAFE_INTEGER;
        return priorityA - priorityB;
      });
    });

    // Trier les catégories elles-mêmes par la priorité minimale de leurs items
    return Object.entries(itemsByCategory).sort((a, b) => {
      const [, itemsA] = a;
      const [, itemsB] = b;

      // Trouver la priorité minimale dans chaque catégorie
      const minPriorityA = Math.min(...itemsA.map(item =>
        itemTypePriorityMap.get(item.item?.itemType?.id || '') ?? Number.MAX_SAFE_INTEGER
      ));
      const minPriorityB = Math.min(...itemsB.map(item =>
        itemTypePriorityMap.get(item.item?.itemType?.id || '') ?? Number.MAX_SAFE_INTEGER
      ));

      return minPriorityA - minPriorityB;
    });
  }, [orderItems, itemTypes]);

  // Mémoriser les états de sélection pour éviter les recalculs
  const { allMenuItemsSelected, someMenuItemsSelected } = useMemo(() => {
    const allSelected = orderItems.every(item => selectedItems.has(item.id));
    const someSelected = orderItems.some(item => selectedItems.has(item.id));
    return { allMenuItemsSelected: allSelected, someMenuItemsSelected: someSelected };
  }, [orderItems, selectedItems]);

  // Handler pour sélectionner/désélectionner tout le menu
  const handleToggleMenuSelection = () => {
    if (!onToggleItemSelection) return;

    if (allMenuItemsSelected) {
      // Désélectionner tous les items
      orderItems.forEach(item => {
        if (selectedItems.has(item.id)) {
          onToggleItemSelection(item.id);
        }
      });
    } else {
      // Sélectionner tous les items
      orderItems.forEach(item => {
        if (!selectedItems.has(item.id)) {
          onToggleItemSelection(item.id);
        }
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={[
        styles.card,
        {
          borderColor: '#6366F1', // Indigo fixe pour tous les menus
          backgroundColor: getStatusBackgroundColor(itemStatus)
        }
      ]}>
        {/* Header - toujours visible */}
        <Pressable
          onPress={isMultiSelectMode ? handleToggleMenuSelection : toggleExpanded}
          style={styles.mainContent}
        >
          {isMultiSelectMode && (
            <View style={styles.checkboxContainer}>
              <View style={[
                styles.checkbox,
                allMenuItemsSelected && styles.checkboxSelected,
                !allMenuItemsSelected && someMenuItemsSelected && styles.checkboxPartial
              ]}>
                {allMenuItemsSelected && <Text style={styles.checkboxIcon}>✓</Text>}
                {!allMenuItemsSelected && someMenuItemsSelected && <Text style={styles.checkboxIcon}>-</Text>}
              </View>
            </View>
          )}

          <View style={styles.leftColumn}>
            <Text style={styles.menuName} numberOfLines={1}>
              {menuInfo?.name || 'Menu'}
            </Text>

            <View style={styles.footerInfo}>
              {hasMixed ? (
                <View style={[styles.statusBadge, { backgroundColor: getStatusTagColor(itemStatus) }]}>
                  <Text style={styles.statusText}>MIXTE</Text>
                </View>
              ) : (
                <View style={[styles.statusBadge, { backgroundColor: getStatusTagColor(itemStatus) }]}>
                  <Text style={styles.statusText}>{getStatusText(itemStatus)}</Text>
                </View>
              )}
              <View style={styles.menuBadge}>
                <Text style={styles.menuBadgeText}>MENU</Text>
              </View>
              <Text style={styles.itemCount}>
                {orderItems.length} article{orderItems.length > 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          <View style={styles.priceTimeColumn}>
            <Text style={styles.priceText}>
              {((menuLine.totalPrice || 0) / 100).toFixed(2)}€
            </Text>
            <View style={styles.timeContainer}>
              <Clock size={10} color="#9CA3AF" strokeWidth={2} />
              <Text style={styles.timeText}>
                {formatDate(menuTime, DateFormat.TIME)}
              </Text>
            </View>
          </View>

          <View style={styles.actionsColumn}>
            {!isMultiSelectMode && (
              <>
                <Pressable onPress={(e) => e.stopPropagation()}>
                  <IconButton
                    iconName="settings"
                    size={50}
                    variant="primary"
                    isTransparent={true}
                    onPress={handleMenuStatusClick}
                  />
                </Pressable>
                <Pressable onPress={(e) => e.stopPropagation()}>
                  <IconButton
                    iconName="trash"
                    size={50}
                    variant="danger"
                    isTransparent={true}
                    onPress={() => setShowDeleteDialog(true)}
                  />
                </Pressable>
              </>
            )}
            {isMultiSelectMode ? (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  toggleExpanded();
                }}
                style={styles.chevronContainer}
              >
                {isExpanded ? (
                  <ChevronUp size={20} color="#6B7280" strokeWidth={2.5} />
                ) : (
                  <ChevronDown size={20} color="#6B7280" strokeWidth={2.5} />
                )}
              </Pressable>
            ) : (
              <View style={styles.chevronContainer}>
                {isExpanded ? (
                  <ChevronUp size={20} color="#6B7280" strokeWidth={2.5} />
                ) : (
                  <ChevronDown size={20} color="#6B7280" strokeWidth={2.5} />
                )}
              </View>
            )}
          </View>
        </Pressable>

        {/* Expanded content - rows simples */}
        {isExpanded && (
          <View>
            {sortedCategories.map(([categoryName, categoryItems]) => (
              <View key={categoryName}>
                {/* Category header */}
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryTitle}>{categoryName}</Text>
                </View>

                {/* Items rows */}
                {categoryItems.map((item, itemIndex) => {
                  const ItemWrapper = isMultiSelectMode ? Pressable : View;
                  const itemProps = isMultiSelectMode ? { onPress: () => onToggleItemSelection?.(item.id) } : {};

                  return (
                    <View key={item.id}>
                      <ItemWrapper
                        style={[
                          styles.itemRow,
                          { backgroundColor: getStatusBackgroundColor(item.status) }
                        ]}
                        {...itemProps}
                      >
                        {isMultiSelectMode && (
                          <View style={styles.checkboxContainer}>
                            <View style={[styles.checkbox, selectedItems.has(item.id) && styles.checkboxSelected]}>
                              {selectedItems.has(item.id) && <Text style={styles.checkboxIcon}>✓</Text>}
                            </View>
                          </View>
                        )}

                        <View style={styles.itemLeftColumn}>
                        <Text style={styles.itemRowName} numberOfLines={1}>
                          {item.item?.name || 'Article'}
                        </Text>

                        <View style={styles.itemFooterInfo}>
                          <View style={[styles.itemRowStatus, { backgroundColor: getStatusTagColor(item.status) }]}>
                            <Text style={styles.itemRowStatusText}>{getStatusText(item.status)}</Text>
                          </View>

                          {(item as any).tags?.length > 0 && (item as any).tags.map((tag: any, tagIndex: number) => {
                            const tagConfig = getTagFieldTypeConfig(tag.tagSnapshot.fieldType);
                            return (
                              <View key={tagIndex} style={[styles.itemTag, { backgroundColor: tagConfig.bgColor }]}>
                                <Text style={[styles.itemTagText, { color: tagConfig.textColor }]}>
                                  {tag.tagSnapshot.label}: {String(tag.value)}
                                </Text>
                              </View>
                            );
                          })}

                          {(item as any).note && (
                            <View style={styles.itemNoteContainer}>
                              <Text style={styles.itemNoteLabel}>Note :</Text>
                              <Text style={styles.itemNoteText} numberOfLines={1} ellipsizeMode="tail">
                                {(item as any).note}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>

                      <View style={styles.itemRowTime}>
                        <Clock size={10} color="#9CA3AF" strokeWidth={2} />
                        <Text style={styles.itemRowTimeText}>
                          {formatDate(item.updatedAt || new Date().toISOString(), DateFormat.TIME)}
                        </Text>
                      </View>

                        {!isMultiSelectMode && (
                          <IconButton
                            iconName="settings"
                            size={40}
                            variant="primary"
                            isTransparent={true}
                            onPress={() => handleItemStatusClick(item)}
                          />
                        )}
                      </ItemWrapper>
                      {/* Ligne de séparation sauf pour le dernier item */}
                      {itemIndex < categoryItems.length - 1 && (
                        <View style={styles.itemSeparator} />
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        )}
      </View>

      <StatusSelector
        visible={showStatusSelector}
        currentStatus={currentItemForStatus?.status || itemStatus}
        onClose={() => {
          setShowStatusSelector(false);
          setCurrentItemForStatus(null);
        }}
        onStatusSelect={handleStatusSelect}
      />

      <DeleteConfirmationModal
        isVisible={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={() => {
          setShowDeleteDialog(false);
          onDelete();
        }}
        entityName={`"${menuInfo?.name || 'Menu'}"`}
        entityType="le menu"
        usePortal={true}
      />
    </View>
  );
});

OrderDetailMenuCard.displayName = 'OrderDetailMenuCard';

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  checkboxContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  checkboxPartial: {
    backgroundColor: '#E0E7FF',
    borderColor: '#6366F1',
  },
  checkboxIcon: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  // Card principale - identique à ItemCard mais border indigo
  card: {
    borderRadius: 10,
    borderWidth: 2, // Même taille que ItemCard
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 0, // Pas de padding bottom pour éviter l'espace quand expanded
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    overflow: 'hidden', // Clippe le contenu pour ne pas déborder sur les bordures
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 10, // Padding bottom seulement sur le header (quand collapsed)
  },
  leftColumn: {
    flex: 1,
    gap: 8,
    minWidth: 0,
  },
  menuName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    minWidth: 0,
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    flexShrink: 0,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1A1A1A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuBadge: {
    backgroundColor: '#6366F1', // Indigo pour matcher la border
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    flexShrink: 0,
  },
  menuBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  itemCount: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  priceTimeColumn: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
    flexShrink: 0,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  actionsColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  chevronContainer: {
    padding: 4,
  },
  categoryHeader: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: -12, // Pour aller jusqu'aux bords
    marginBottom: 0,
  },
  categoryTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Row simple pour chaque item - backgroundColor dynamique
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: -12, // Pour aller jusqu'aux bords
  },
  itemLeftColumn: {
    flex: 1,
    gap: 8,
    minWidth: 0,
  },
  itemRowName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    minWidth: 0,
  },
  itemFooterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  itemRowStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    flexShrink: 0,
  },
  itemRowStatusText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1A1A1A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  itemTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  itemNoteContainer: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    flexDirection: 'row',
    gap: 5,
    maxWidth: '100%',
  },
  itemNoteLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  itemNoteText: {
    fontSize: 10,
    color: '#92400E',
    flexShrink: 1,
    minWidth: 0,
  },
  itemRowTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  itemRowTimeText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  // Ligne de séparation entre items
  itemSeparator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: -12, // Pour aller jusqu'aux bords
  },
});
