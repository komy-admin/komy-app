import { memo, useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronDown, ChevronUp, Clock, Lock } from 'lucide-react-native';
import { OrderLine, OrderLineItem } from '~/types/order-line.types';
import { Status } from '~/types/status.enum';
import { getMostImportantStatus, getStatusTagColor, getStatusText, hasMenuMixedStatuses, getStatusBackgroundColor, formatDate, DateFormat, getTagFieldTypeConfig } from '~/lib/utils';
import { IconButton } from '~/components/ui/IconButton';

export interface OrderDetailMenuCardProps {
  menuLine: OrderLine;
  itemTypes?: { id: string; priorityOrder: number }[]; // Pour le tri
  onOpenItemStatusSelector: (orderLineItem: OrderLineItem) => void;
  onOpenMenuStatusSelector: (orderLineItems: OrderLineItem[], currentStatus: Status) => void;
  onOpenDeleteDialog: () => void;
  isPaid?: boolean;
}

/**
 * Composant mémoïsé pour rendre un tag d'item dans un menu
 */
const MenuItemTag = memo<{ tag: any }>(({ tag }) => {
  const tagConfig = useMemo(
    () => getTagFieldTypeConfig(tag.tagSnapshot.fieldType),
    [tag.tagSnapshot.fieldType]
  );

  const tagStyle = useMemo(
    () => [styles.itemTag, { backgroundColor: tagConfig.bgColor }],
    [tagConfig.bgColor]
  );

  const tagTextStyle = useMemo(
    () => [styles.itemTagText, { color: tagConfig.textColor }],
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

MenuItemTag.displayName = 'MenuItemTag';

/**
 * Composant mémoïsé pour rendre un item de menu
 */
interface MenuCategoryItemProps {
  item: OrderLineItem;
  isLastItem: boolean;
  onItemStatusClick: (item: OrderLineItem) => void;
}

const MenuCategoryItem = memo<MenuCategoryItemProps>(({ item, isLastItem, onItemStatusClick }) => {
  // ✅ useCallback : Handler pour éviter re-création à chaque render
  const handlePress = useCallback(() => {
    onItemStatusClick(item);
  }, [item, onItemStatusClick]);

  // ✅ useMemo : Style dynamique pour la row
  const itemRowStyle = useMemo(
    () => [styles.itemRow, { backgroundColor: getStatusBackgroundColor(item.status) }],
    [item.status]
  );

  // ✅ useMemo : Style dynamique pour le status badge
  const statusBadgeStyle = useMemo(
    () => [styles.itemRowStatus, { backgroundColor: getStatusTagColor(item.status) }],
    [item.status]
  );

  // ✅ useMemo : Formater le temps
  const formattedTime = useMemo(
    () => formatDate(item.updatedAt || new Date().toISOString(), DateFormat.TIME),
    [item.updatedAt]
  );

  return (
    <View>
      <View style={itemRowStyle}>
        <View style={styles.itemLeftColumn}>
          <Text style={styles.itemRowName} numberOfLines={1}>
            {item.item?.name || 'Article'}
          </Text>

          <View style={styles.itemFooterInfo}>
            <View style={statusBadgeStyle}>
              <Text style={styles.itemRowStatusText}>{getStatusText(item.status)}</Text>
            </View>

            {/* ✅ Utiliser le composant mémoïsé pour les tags */}
            {(item as any).tags?.length > 0 && (item as any).tags.map((tag: any, tagIndex: number) => (
              <MenuItemTag key={tagIndex} tag={tag} />
            ))}

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
          <Text style={styles.itemRowTimeText}>{formattedTime}</Text>
        </View>

        <IconButton
          iconName="settings"
          size={40}
          variant="primary"
          isTransparent={true}
          onPress={handlePress}
        />
      </View>
      {/* Ligne de séparation sauf pour le dernier item */}
      {!isLastItem && <View style={styles.itemSeparator} />}
    </View>
  );
});

MenuCategoryItem.displayName = 'MenuCategoryItem';

export const OrderDetailMenuCard = memo<OrderDetailMenuCardProps>(({
  menuLine,
  itemTypes = [],
  onOpenItemStatusSelector,
  onOpenMenuStatusSelector,
  onOpenDeleteDialog,
  isPaid = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const menuInfo = menuLine.menu;
  const orderItems = menuLine.items || [];

  // ✅ useMemo : Calculer les statuses une seule fois
  const statuses = useMemo(
    () => orderItems.map((item) => item.status),
    [orderItems]
  );

  // ✅ useMemo : Calculer le status le plus important
  const itemStatus = useMemo(
    () => getMostImportantStatus(statuses),
    [statuses]
  );

  // ✅ useMemo : Vérifier si le menu a des statuses mixtes
  const hasMixed = useMemo(
    () => hasMenuMixedStatuses(statuses),
    [statuses]
  );

  // ✅ useMemo : Calculer le temps du menu
  const menuTime = useMemo(
    () => menuLine.updatedAt || new Date().toISOString(),
    [menuLine.updatedAt]
  );

  // ✅ useMemo : Calculer le prix formaté
  const formattedPrice = useMemo(
    () => ((menuLine.totalPrice || 0) / 100).toFixed(2),
    [menuLine.totalPrice]
  );

  // ✅ useCallback : Handler pour toggle l'expansion
  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  // ✅ useCallback : Handler pour le status du menu
  const handleMenuStatusClick = useCallback(() => {
    onOpenMenuStatusSelector(orderItems, itemStatus);
  }, [onOpenMenuStatusSelector, orderItems, itemStatus]);

  // ✅ useCallback : Handler pour le status d'un item
  const handleItemStatusClick = useCallback((item: OrderLineItem) => {
    onOpenItemStatusSelector(item);
  }, [onOpenItemStatusSelector]);

  // ✅ useMemo : Styles dynamiques
  const cardStyle = useMemo(
    () => [
      styles.card,
      {
        borderColor: '#6366F1', // Indigo fixe pour tous les menus
        backgroundColor: getStatusBackgroundColor(itemStatus),
      },
    ],
    [itemStatus]
  );

  const statusBadgeStyle = useMemo(
    () => [styles.statusBadge, { backgroundColor: getStatusTagColor(itemStatus) }],
    [itemStatus]
  );

  // ✅ Mémoriser le calcul coûteux du tri des catégories et items
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

  return (
    <View style={styles.wrapper}>
      <View style={cardStyle}>
        {/* Header - toujours visible */}
        <View style={styles.mainContent}>
          <TouchableOpacity
            onPress={toggleExpanded}
            activeOpacity={1}
            style={styles.expandableArea}
          >
            <View style={styles.leftColumn}>
              <Text style={styles.menuName} numberOfLines={1}>
                {menuInfo?.name || 'Menu'}
              </Text>

              <View style={styles.footerInfo}>
                {hasMixed ? (
                  <View style={statusBadgeStyle}>
                    <Text style={styles.statusText}>MIXTE</Text>
                  </View>
                ) : (
                  <View style={statusBadgeStyle}>
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
              {isPaid && (
                <View style={styles.paidBadge}>
                  <Lock size={9} color="white" strokeWidth={3} />
                  <Text style={styles.paidBadgeText}>PAYÉ</Text>
                </View>
              )}
              <Text style={styles.priceText}>
                {formattedPrice}€
              </Text>
              <View style={styles.timeContainer}>
                <Clock size={10} color="#9CA3AF" strokeWidth={2} />
                <Text style={styles.timeText}>
                  {formatDate(menuTime, DateFormat.TIME)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

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
                    onPress={handleMenuStatusClick}
                  />
                  <IconButton
                    iconName="trash"
                    size={50}
                    variant="danger"
                    isTransparent={true}
                    onPress={onOpenDeleteDialog}
                  />
                  </>
                )}
            <TouchableOpacity
              onPress={toggleExpanded}
              activeOpacity={0.7}
              delayPressOut={0}
              style={styles.chevronContainer}
            >
              {isExpanded ? (
                <ChevronUp size={20} color="#6B7280" strokeWidth={2.5} />
              ) : (
                <ChevronDown size={20} color="#6B7280" strokeWidth={2.5} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Expanded content - rows simples */}
        {isExpanded && (
          <View>
            {sortedCategories.map(([categoryName, categoryItems]) => (
              <View key={categoryName}>
                {/* Category header */}
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryTitle}>{categoryName}</Text>
                </View>

                {/* ✅ Items rows - Utiliser le composant mémoïsé */}
                {categoryItems.map((item, itemIndex) => (
                  <MenuCategoryItem
                    key={item.id}
                    item={item}
                    isLastItem={itemIndex === categoryItems.length - 1}
                    onItemStatusClick={handleItemStatusClick}
                  />
                ))}
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
});

OrderDetailMenuCard.displayName = 'OrderDetailMenuCard';

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 8,
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
  expandableArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  leftColumn: {
    flex: 1,
    gap: 8,
    minWidth: 0,
  },
  menuNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
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
