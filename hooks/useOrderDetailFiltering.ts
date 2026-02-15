import { useMemo } from 'react';
import { OrderLine, OrderLineType, OrderLineItem } from '~/types/order-line.types';
import { ItemType } from '~/types/item-type.types';

export type FilteredItem = {
  type: 'item' | 'menu';
  data: OrderLine | { orderLineItem: OrderLineItem; menuName: string };
};

export type ItemCounts = {
  all: number;
  menus: number;
  [itemTypeId: string]: number;
};

/**
 * Hook custom pour filtrer et trier les lignes de commande
 * Optimisé avec plusieurs useMemo séparés pour éviter les recalculs inutiles
 */
export const useOrderDetailFiltering = (
  orderLines: OrderLine[] | undefined,
  activeTab: string,
  itemTypes: ItemType[]
) => {
  // ✅ Étape 1 : Séparer les menus et items (dépend seulement de orderLines)
  const { menuLines, itemLines } = useMemo(() => {
    const lines = orderLines || [];
    return {
      menuLines: lines.filter((line) => line.type === OrderLineType.MENU),
      itemLines: lines.filter((line) => line.type === OrderLineType.ITEM),
    };
  }, [orderLines]);

  // ✅ Étape 2 : Créer les Maps de priorités et noms (dépend seulement de itemTypes)
  const itemTypePriorityMap = useMemo(
    () => new Map(itemTypes.map((it) => [it.id, it.priorityOrder])),
    [itemTypes]
  );

  const itemTypeNameMap = useMemo(
    () => new Map(itemTypes.map((it) => [it.id, it.name])),
    [itemTypes]
  );

  // ✅ Étape 3 : Compter les items (dépend de menuLines, itemLines, itemTypes)
  const counts: ItemCounts = useMemo(() => {
    // Compter tous les items (y compris ceux dans les menus)
    let totalMenuItems = 0;
    menuLines.forEach((menuLine) => {
      totalMenuItems += menuLine.items?.length || 0;
    });

    const allCount = itemLines.length + totalMenuItems;

    const counts: ItemCounts = {
      all: allCount,
      menus: menuLines.length,
    };

    // Compter par itemType
    itemTypes.forEach((itemType) => {
      counts[itemType.id] = 0;

      // Compter les items individuels de ce type
      itemLines.forEach((line) => {
        if (line.item?.itemType?.id === itemType.id) {
          counts[itemType.id]++;
        }
      });

      // Compter les items de menu de ce type
      menuLines.forEach((menuLine) => {
        menuLine.items?.forEach((menuItem) => {
          if (menuItem.item?.itemType?.id === itemType.id) {
            counts[itemType.id]++;
          }
        });
      });
    });

    return counts;
  }, [menuLines, itemLines, itemTypes]);

  // ✅ Étape 4 : Filtrer selon le tab actif (dépend de activeTab, menuLines, itemLines, itemTypePriorityMap)
  const filteredItems: FilteredItem[] = useMemo(() => {
    const items: FilteredItem[] = [];

    if (activeTab === 'ALL') {
      // Afficher tout : Menus en premier, puis items triés par priorityOrder
      menuLines.forEach((menuLine) => {
        items.push({ type: 'menu', data: menuLine });
      });

      // Trier les items par priorityOrder de leur itemType, puis alphabétiquement
      const sortedItemLines = [...itemLines].sort((a, b) => {
        const priorityA = itemTypePriorityMap.get(a.item?.itemType?.id || '') ?? Number.MAX_SAFE_INTEGER;
        const priorityB = itemTypePriorityMap.get(b.item?.itemType?.id || '') ?? Number.MAX_SAFE_INTEGER;
        if (priorityA !== priorityB) return priorityA - priorityB;
        const nameA = itemTypeNameMap.get(a.item?.itemType?.id || '') ?? '';
        const nameB = itemTypeNameMap.get(b.item?.itemType?.id || '') ?? '';
        return nameA.localeCompare(nameB);
      });

      sortedItemLines.forEach((line) => {
        items.push({ type: 'item', data: line });
      });
    } else if (activeTab === 'MENUS') {
      // Afficher seulement les menus
      menuLines.forEach((menuLine) => {
        items.push({ type: 'menu', data: menuLine });
      });
    } else {
      // Afficher les items d'un itemType spécifique
      itemLines.forEach((line) => {
        if (line.item?.itemType?.id === activeTab) {
          items.push({ type: 'item', data: line });
        }
      });

      // Items de menu de ce type
      menuLines.forEach((menuLine) => {
        menuLine.items?.forEach((menuItem) => {
          if (menuItem.item?.itemType?.id === activeTab) {
            items.push({
              type: 'item',
              data: {
                orderLineItem: menuItem,
                menuName: menuLine.menu?.name || 'Menu',
              },
            });
          }
        });
      });
    }

    return items;
  }, [activeTab, menuLines, itemLines, itemTypePriorityMap, itemTypeNameMap]);

  return { filteredItems, counts };
};
