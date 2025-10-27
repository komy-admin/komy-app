import { useMemo } from 'react';
import { Order } from '~/types/order.types';
import { ItemGroup } from '~/types/kitchen.types';

/**
 * Shared hook to group kitchen/bar items by orderId and status
 * Groups items together for display in columns
 *
 * @param orders - List of orders to process
 * @param items - List of kitchen/bar items to group
 * @param overdueItemIds - IDs of items that are overdue
 * @returns Sorted array of item groups
 */
export function useItemGrouping(
  orders: Order[],
  items: any[],
  overdueItemIds: string[]
): ItemGroup[] {
  const groupedItems = useMemo(() => {
    const groupMap = new Map<string, ItemGroup>();

    items.forEach(item => {
      const order = orders.find(o => o.id === item.orderId);
      if (!order) return;

      const groupKey = `${order.id}-${item.status}`;

      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, {
          id: groupKey,
          orderId: order.id,
          orderNumber: `#${order.id.slice(-4)}`,
          tableName: order.table?.name || 'Table inconnue',
          status: item.status,
          items: [],
          isOverdue: false,
          createdAt: order.createdAt
        });
      }

      const group = groupMap.get(groupKey)!;
      const isItemOverdue = overdueItemIds.includes(item.id);

      group.items.push({
        id: item.id,
        type: item.type,
        itemName: item.itemName,
        itemType: item.itemType,
        menuName: item.menuName,
        menuId: item.menuId,
        orderLineId: item.orderLineId,
        isOverdue: isItemOverdue,
        note: item.note,
        tags: item.tags,
        status: item.status
      });

      // Marquer le groupe comme en retard si au moins un item l'est
      if (isItemOverdue) {
        group.isOverdue = true;
      }
    });

    // Convertir en array et trier (en retard en premier, puis par date)
    const sortedGroups = Array.from(groupMap.values()).sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    return sortedGroups;
  }, [orders, items, overdueItemIds]);

  return groupedItems;
}
