import React, { memo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ChevronDown, ChevronUp, Menu as MenuIcon } from 'lucide-react-native';
import { OrderLine, OrderLineItem } from '~/types/order-line.types';
import { Status } from '~/types/status.enum';
import { getMostImportantStatus, getStatusColor, getStatusTagColor, getStatusText, hasMenuMixedStatuses, getStatusBackgroundColor } from '~/lib/utils';
import { OrderDetailItemCard } from './OrderDetailItemCard';
import { DeleteConfirmationModal } from '~/components/ui/DeleteConfirmationModal';
import { IconButton } from '~/components/ui/IconButton';

export interface OrderDetailMenuCardProps {
  menuLine: OrderLine;
  onUpdateItemStatus: (orderLineItem: OrderLineItem, newStatus: Status) => void;
  onDelete: () => void;
  isMultiSelectMode?: boolean;
  selectedItems?: Set<string>;
  onToggleItemSelection?: (itemId: string) => void;
}

export const OrderDetailMenuCard = memo<OrderDetailMenuCardProps>(({
  menuLine,
  onUpdateItemStatus,
  onDelete,
  isMultiSelectMode = false,
  selectedItems = new Set(),
  onToggleItemSelection,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const menuInfo = menuLine.menu;
  const orderItems = menuLine.items || [];
  const statuses = orderItems.map((item) => item.status);
  const itemStatus = getMostImportantStatus(statuses);
  const hasMixed = hasMenuMixedStatuses(statuses);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Grouper les items par catégorie
  const itemsByCategory = orderItems.reduce((acc, orderLineItem) => {
    const categoryName = orderLineItem?.categoryName || 'Autres';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(orderLineItem);
    return acc;
  }, {} as Record<string, OrderLineItem[]>);

  return (
    <View style={styles.container}>
      <Pressable
        onPress={toggleExpanded}
        style={[
          styles.header,
          {
            borderColor: getStatusColor(itemStatus),
            backgroundColor: getStatusBackgroundColor(itemStatus)
          }
        ]}
      >
        <View style={styles.headerContent}>
          <View style={[styles.iconContainer, { backgroundColor: getStatusColor(itemStatus) }]}>
            <MenuIcon size={20} color="#1A1A1A" strokeWidth={2} />
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.menuName} numberOfLines={1}>
              {menuInfo?.name || 'Menu'}
            </Text>

            <View style={styles.detailsRow}>
              <View style={styles.badgesRow}>
                {hasMixed ? (
                  <View style={[styles.statusBadge, { backgroundColor: getStatusTagColor(itemStatus) }]}>
                    <Text style={styles.statusMixedText}>MIXTE</Text>
                  </View>
                ) : (
                  <View style={[styles.statusBadge, { backgroundColor: getStatusTagColor(itemStatus) }]}>
                    <Text style={styles.statusText}>{getStatusText(itemStatus)}</Text>
                  </View>
                )}
              </View>

              <View style={styles.priceCountColumn}>
                <Text style={styles.menuPrice}>
                  {((menuLine.totalPrice || 0) / 100).toFixed(2)}€
                </Text>
                <Text style={styles.itemCount}>
                  {orderItems.length} article{orderItems.length > 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.actionsContainer}>
            <Pressable onPress={(e) => {
              e.stopPropagation();
            }}>
              <IconButton
                iconName="trash"
                size={50}
                variant="danger"
                isTransparent={true}
                onPress={() => setShowDeleteDialog(true)}
              />
            </Pressable>

            <View style={styles.chevronContainer}>
              {isExpanded ? (
                <ChevronUp size={20} color="#6B7280" strokeWidth={2.5} />
              ) : (
                <ChevronDown size={20} color="#6B7280" strokeWidth={2.5} />
              )}
            </View>
          </View>
        </View>
      </Pressable>

      {isExpanded && (
        <View style={styles.expandedContent}>
          {Object.entries(itemsByCategory).map(([categoryName, categoryItems]) => (
            <View key={categoryName} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryTitle}>{categoryName}</Text>
              </View>

              <View style={styles.categoryItems}>
                {categoryItems.map((orderLineItem) => (
                  <OrderDetailItemCard
                    key={orderLineItem.id}
                    orderLineItem={orderLineItem}
                    isFromMenu={true}
                    menuName={menuInfo?.name}
                    onStatusChange={(newStatus) => onUpdateItemStatus(orderLineItem, newStatus)}
                    onDelete={() => {}}
                    isMultiSelectMode={isMultiSelectMode}
                    isSelected={selectedItems.has(orderLineItem.id)}
                    onToggleSelection={() => onToggleItemSelection?.(orderLineItem.id)}
                  />
                ))}
              </View>
            </View>
          ))}
        </View>
      )}

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
  header: {
    borderRadius: 10,
    borderWidth: 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 8,
  },
  menuName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A1A1A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusMixedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: 0.8,
  },
  priceCountColumn: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 2,
  },
  menuPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1F2937',
  },
  itemCount: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chevronContainer: {
    padding: 2,
  },
  expandedContent: {
    backgroundColor: '#F9FAFB',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    paddingTop: 8,
    marginTop: -4,
  },
  categorySection: {
    marginBottom: 8,
  },
  categoryHeader: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryItems: {
    padding: 10,
  },
});
