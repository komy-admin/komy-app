import { memo, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock, Lock } from 'lucide-react-native';
import { OrderLine, OrderLineItem } from '~/types/order-line.types';
import { Status } from '~/types/status.enum';
import { DateFormat, formatDate, getStatusColor, getStatusTagColor, getStatusText, getStatusBackgroundColor, getTagFieldTypeConfig } from '~/lib/utils';
import { IconButton } from '~/components/ui/IconButton';

export interface OrderDetailItemCardProps {
  orderLine?: OrderLine;
  orderLineItem?: OrderLineItem;
  isFromMenu?: boolean;
  menuName?: string;
  showItemTypeTag?: boolean;
  itemTypeName?: string;
  onOpenStatusSelector: () => void;
  onOpenDeleteDialog: () => void;
  onStatusChange: (newStatus: Status) => void;
  onDelete: () => void;
  isMultiSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: () => void;
  isPaid?: boolean;
}

/**
 * Composant mémoïsé pour rendre un tag d'item
 */
const ItemTag = memo<{ tag: any }>(({ tag }) => {
  // ✅ Mémoïser la config du tag
  const tagConfig = useMemo(
    () => getTagFieldTypeConfig(tag.tagSnapshot.fieldType),
    [tag.tagSnapshot.fieldType]
  );

  // ✅ Mémoïser le style dynamique
  const tagStyle = useMemo(
    () => [styles.tag, { backgroundColor: tagConfig.bgColor }],
    [tagConfig.bgColor]
  );

  const tagTextStyle = useMemo(
    () => [styles.tagText, { color: tagConfig.textColor }],
    [tagConfig.textColor]
  );

  return (
    <View style={tagStyle}>
      <Text style={tagTextStyle}>
        {tag.tagSnapshot.label}: {String(tag.value)}
      </Text>
    </View>
  );
});

ItemTag.displayName = 'ItemTag';

export const OrderDetailItemCard = memo<OrderDetailItemCardProps>(({
  orderLine,
  orderLineItem,
  isFromMenu = false,
  menuName,
  showItemTypeTag = false,
  itemTypeName,
  onOpenStatusSelector,
  onOpenDeleteDialog,
  onStatusChange,
  onDelete,
  isMultiSelectMode = false,
  isSelected = false,
  onToggleSelection,
  isPaid = false,
}) => {
  // ✅ useMemo : Calculer les valeurs dérivées une seule fois
  const itemName = useMemo(
    () => orderLine?.item?.name || orderLineItem?.item?.name || 'Article inconnu',
    [orderLine?.item?.name, orderLineItem?.item?.name]
  );

  const itemNote = useMemo(
    () => orderLine?.note || (orderLineItem as any)?.note || undefined,
    [orderLine?.note, orderLineItem]
  );

  const itemStatus = useMemo(
    () => orderLine?.status || orderLineItem?.status || Status.PENDING,
    [orderLine?.status, orderLineItem?.status]
  );

  const itemTime = useMemo(
    () => orderLine?.updatedAt || orderLineItem?.updatedAt || new Date().toISOString(),
    [orderLine?.updatedAt, orderLineItem?.updatedAt]
  );

  const itemPrice = useMemo(
    () => orderLine?.totalPrice || orderLineItem?.item?.price || 0,
    [orderLine?.totalPrice, orderLineItem?.item?.price]
  );

  const itemTags = useMemo(
    () => orderLine?.tags || (orderLineItem as any)?.tags || [],
    [orderLine?.tags, orderLineItem]
  );

  // ✅ useMemo : Calculer le prix formaté
  const formattedPrice = useMemo(
    () => (itemPrice / 100).toFixed(2),
    [itemPrice]
  );

  // ✅ useMemo : Styles dynamiques
  const cardStyle = useMemo(
    () => [
      styles.card,
      {
        borderColor: getStatusColor(itemStatus),
        backgroundColor: getStatusBackgroundColor(itemStatus),
      },
    ],
    [itemStatus]
  );

  const statusBadgeStyle = useMemo(
    () => [styles.statusBadge, { backgroundColor: getStatusTagColor(itemStatus) }],
    [itemStatus]
  );

  return (
    <View style={styles.wrapper}>
      <View style={cardStyle}>
        <View style={styles.mainContent}>
          <View style={styles.leftColumn}>
            <View style={styles.nameRow}>
              <Text style={styles.itemName} numberOfLines={1}>
                {itemName}
              </Text>
              {isPaid && (
                <View style={styles.paidBadge}>
                  <Lock size={9} color="white" strokeWidth={3} />
                  <Text style={styles.paidBadgeText}>PAYÉ</Text>
                </View>
              )}
            </View>

            <View style={styles.footerInfo}>
              <View style={statusBadgeStyle}>
                <Text style={styles.statusText}>{getStatusText(itemStatus)}</Text>
              </View>

              {showItemTypeTag && itemTypeName && (
                <View style={styles.itemTypeBadge}>
                  <Text style={styles.itemTypeBadgeText}>{itemTypeName}</Text>
                </View>
              )}

              {isFromMenu && menuName && (
                <View style={styles.menuBadge}>
                  <Text style={styles.menuBadgeText}>MENU : {menuName}</Text>
                </View>
              )}

              {/* ✅ Utiliser le composant mémoïsé ItemTag pour éviter les appels de fonction dans map */}
              {itemTags.length > 0 && itemTags.map((tag: any, index: number) => (
                <ItemTag key={index} tag={tag} />
              ))}

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
                {formattedPrice}€
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
            {isPaid ? (
              <View style={styles.lockedIcon}>
                <Lock size={18} color="#9CA3AF" strokeWidth={2} />
              </View>
            ) : (
              <>
                <IconButton
                  iconName="settings"
                  size={50}
                  variant="primary"
                  isTransparent={true}
                  onPress={onOpenStatusSelector}
                />
                {!isFromMenu && (
                  <IconButton
                    iconName="trash"
                    size={50}
                    variant="danger"
                    isTransparent={true}
                    onPress={onOpenDeleteDialog}
                  />
                )}
              </>
            )}
          </View>
        </View>
      </View>
    </View>
  );
});

OrderDetailItemCard.displayName = 'OrderDetailItemCard';

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 8,
  },
  card: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 2,
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
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
  itemTypeBadge: {
    backgroundColor: '#6B7280',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  itemTypeBadgeText: {
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
  paidBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  paidBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  lockedIcon: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
