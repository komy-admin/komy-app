import { memo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Clock } from 'lucide-react-native';
import { OrderLine, OrderLineItem } from '~/types/order-line.types';
import { Status } from '~/types/status.enum';
import { DateFormat, formatDate, getStatusColor, getStatusTagColor, getStatusText, getStatusBackgroundColor, getTagFieldTypeConfig } from '~/lib/utils';
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
  isMultiSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: () => void;
}

export const OrderDetailItemCard = memo<OrderDetailItemCardProps>(({
  orderLine,
  orderLineItem,
  isFromMenu = false,
  menuName,
  onStatusChange,
  onDelete,
  isMultiSelectMode = false,
  isSelected = false,
  onToggleSelection,
}) => {
  const [showStatusSelector, setShowStatusSelector] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const itemName = orderLine?.item?.name || orderLineItem?.item?.name || 'Article inconnu';
  const itemNote = orderLine?.note || (orderLineItem as any)?.note || undefined;
  const itemStatus = orderLine?.status || orderLineItem?.status || Status.PENDING;
  const itemTime = orderLine?.updatedAt || orderLineItem?.updatedAt || new Date().toISOString();
  const itemPrice = orderLine?.totalPrice || orderLineItem?.item?.price || 0;
  const itemTags = orderLine?.tags || (orderLineItem as any)?.tags || [];

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

  const CardWrapper = isMultiSelectMode ? Pressable : View;
  const cardProps = isMultiSelectMode ? { onPress: onToggleSelection } : {};

  return (
    <>
      <CardWrapper style={[
        styles.card,
        {
          borderColor: getStatusColor(itemStatus),
          backgroundColor: getStatusBackgroundColor(itemStatus)
        }
      ]} {...cardProps}>
        <View style={styles.mainContent}>
          {isMultiSelectMode && (
            <Pressable onPress={onToggleSelection} style={styles.checkboxContainer}>
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && <Text style={styles.checkboxIcon}>✓</Text>}
              </View>
            </Pressable>
          )}

          <View style={styles.leftColumn}>
            <View style={styles.nameRow}>
              <Text style={styles.itemName} numberOfLines={1}>
                {itemName}
              </Text>
            </View>

            <View style={styles.footerInfo}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusTagColor(itemStatus) }]}>
                <Text style={styles.statusText}>{getStatusText(itemStatus)}</Text>
              </View>

              {isFromMenu && menuName && (
                <View style={styles.menuBadge}>
                  <Text style={styles.menuBadgeText}>MENU : {menuName}</Text>
                </View>
              )}

              {itemTags.length > 0 && itemTags.map((tag: any, index: number) => {
                const tagConfig = getTagFieldTypeConfig(tag.tagSnapshot.fieldType);
                return (
                  <View key={index} style={[styles.tag, { backgroundColor: tagConfig.bgColor }]}>
                    <Text style={[styles.tagText, { color: tagConfig.textColor }]}>
                      {tag.tagSnapshot.label}: {String(tag.value)}
                    </Text>
                  </View>
                );
              })}

              {itemNote && (
                <View style={styles.noteContainer}>
                  <Text style={styles.noteLabel}>Note :</Text>
                  <Text style={styles.noteText} numberOfLines={1} ellipsizeMode="tail">{itemNote}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.priceTimeColumn}>
            {!isFromMenu && (
              <Text style={styles.priceText}>
                {(itemPrice / 100).toFixed(2)}€
              </Text>
            )}
            <View style={styles.timeContainer}>
              <Clock size={10} color="#9CA3AF" strokeWidth={2} />
              <Text style={styles.timeText}>
                {formatDate(itemTime, DateFormat.TIME)}
              </Text>
            </View>
          </View>

          <View style={styles.actionsColumn}>
            {isMultiSelectMode ? (
              <View style={{ width: 50 }} />
            ) : (
              <>
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
              </>
            )}
          </View>
        </View>
      </CardWrapper>

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
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    borderWidth: 2,
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
  },
  checkboxContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 8,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
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
  checkboxIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  leftColumn: {
    flex: 1,
    justifyContent: 'flex-start',
    gap: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    flexShrink: 1,
  },
  noteContainer: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    flexDirection: 'row',
    gap: 5,
    maxWidth: '100%',
  },
  noteLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  noteText: {
    fontSize: 10,
    color: '#92400E',
    flexShrink: 1,
    minWidth: 0,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1A1A1A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuBadge: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  menuBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceTimeColumn: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    alignSelf: 'center',
    gap: 4,
    marginRight: 8,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timeText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  actionsColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
