import React, { memo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock } from 'lucide-react-native';
import { OrderLine, OrderLineItem } from '~/types/order-line.types';
import { Status } from '~/types/status.enum';
import { DateFormat, formatDate, getStatusColor, getStatusTagColor, getStatusText } from '~/lib/utils';
import StatusSelector from '~/components/Service/StatusSelector';
import { DeleteConfirmationModal } from '~/components/ui/DeleteConfirmationModal';
import { IconButton } from '~/components/ui/IconButton';

export interface OrderDetailItemCardProps {
  orderLine?: OrderLine;
  orderLineItem?: OrderLineItem;
  isFromMenu?: boolean;
  menuName?: string;
  onStatusChange: (newStatus: Status) => void;
  onDelete: () => void;
}

export const OrderDetailItemCard = memo<OrderDetailItemCardProps>(({
  orderLine,
  orderLineItem,
  isFromMenu = false,
  menuName,
  onStatusChange,
  onDelete,
}) => {
  const [showStatusSelector, setShowStatusSelector] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const itemName = orderLine?.item?.name || orderLineItem?.item?.name || 'Article inconnu';
  const itemNote = orderLine?.note || undefined;
  const itemStatus = orderLine?.status || orderLineItem?.status || Status.PENDING;
  const itemTime = orderLine?.updatedAt || orderLineItem?.updatedAt || new Date().toISOString();
  const itemPrice = orderLine?.totalPrice || orderLineItem?.item?.price || 0;
  const itemTags = orderLine?.tags || [];

  const handleStatusClick = () => {
    setShowStatusSelector(true);
  };

  const handleStatusSelect = (newStatus: Status) => {
    setShowStatusSelector(false);
    onStatusChange(newStatus);
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  return (
    <>
      <View style={[styles.card, { borderLeftColor: getStatusColor(itemStatus) }]}>
        <View style={styles.mainContent}>
          <View style={styles.leftColumn}>
            <View style={styles.nameRow}>
              <Text style={styles.itemName} numberOfLines={1}>
                {itemName}
              </Text>
              {isFromMenu && (
                <View style={styles.menuBadge}>
                  <Text style={styles.menuBadgeText}>MENU</Text>
                </View>
              )}
            </View>

            {itemNote && (
              <View style={styles.noteContainer}>
                <Text style={styles.noteLabel}>Note :</Text>
                <Text style={styles.noteText}>{itemNote}</Text>
              </View>
            )}

            {itemTags.length > 0 && (
              <View style={styles.tagsContainer}>
                {itemTags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>
                      {tag.tagSnapshot.label}: {String(tag.value)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.footerInfo}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusTagColor(itemStatus) }]}>
                <Text style={styles.statusText}>{getStatusText(itemStatus)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.priceTimeColumn}>
            <Text style={styles.priceText}>
              {(itemPrice / 100).toFixed(2)}€
            </Text>
            <View style={styles.timeContainer}>
              <Clock size={10} color="#9CA3AF" strokeWidth={2} />
              <Text style={styles.timeText}>
                {formatDate(itemTime, DateFormat.TIME)}
              </Text>
            </View>
          </View>

          <View style={styles.actionsColumn}>
            <IconButton
              iconName="settings"
              size={50}
              variant="primary"
              isTransparent={true}
              onPress={handleStatusClick}
            />
            {!isFromMenu && (
              <IconButton
                iconName="trash"
                size={50}
                variant="danger"
                isTransparent={true}
                onPress={handleDeleteClick}
              />
            )}
          </View>
        </View>

        {isFromMenu && menuName && (
          <View style={styles.menuNameContainer}>
            <Text style={styles.menuNameText}>🍽️ {menuName}</Text>
          </View>
        )}
      </View>

      <StatusSelector
        visible={showStatusSelector}
        currentStatus={itemStatus}
        onClose={() => setShowStatusSelector(false)}
        onStatusSelect={handleStatusSelect}
      />

      <DeleteConfirmationModal
        isVisible={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={() => {
          setShowDeleteDialog(false);
          onDelete();
        }}
        entityName={`"${itemName}"`}
        entityType="l'article"
        usePortal={true}
      />
    </>
  );
});

OrderDetailItemCard.displayName = 'OrderDetailItemCard';

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
  },
  leftColumn: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  itemName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    flexShrink: 1,
  },
  noteContainer: {
    padding: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 7,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
    flexDirection: 'row',
    gap: 5,
  },
  noteLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  noteText: {
    fontSize: 11,
    color: '#92400E',
    flex: 1,
    lineHeight: 15,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  tag: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4338CA',
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A1A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuBadge: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
  },
  menuBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  priceTimeColumn: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    alignSelf: 'center',
    gap: 4,
    marginRight: 8,
  },
  priceText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1F2937',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timeText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  actionsColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  menuNameContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  menuNameText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    fontStyle: 'italic',
  },
});
