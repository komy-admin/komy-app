import { useMemo } from 'react';
import { TicketItem } from '../types/ticket.types';

/**
 * Hook qui groupe et trie les items par catégorie selon leur priorité
 *
 * Les items sont groupés par itemType, puis les catégories sont triées
 * selon leur priorityOrder (fourni via priorityMap).
 *
 * @param items - Liste des items à grouper
 * @param priorityMap - Map des types vers leur priorité
 * @returns Tableau de [categoryName, items[]] trié par priorité croissante
 *
 * @example
 * const priorityMap = useItemPriorityMap();
 * const itemsByCategory = useItemsByCategory(itemGroup.items, priorityMap);
 * // Retourne: [['Entrée', [...]], ['Plat', [...]], ['Dessert', [...]]]
 */
export function useItemsByCategory(
  items: TicketItem[],
  priorityMap: Map<string, number>
): Array<[string, TicketItem[]]> {
  return useMemo(() => {
    const groups = new Map<string, TicketItem[]>();

    // Grouper par catégorie
    items.forEach(item => {
      const category = item.itemType || 'Autre';
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(item);
    });

    // Trier par priorityOrder croissant
    return Array.from(groups.entries()).sort((a, b) => {
      const priorityA = priorityMap.get(a[0]) || 999;
      const priorityB = priorityMap.get(b[0]) || 999;
      if (priorityA !== priorityB) return priorityA - priorityB;
      return a[0].localeCompare(b[0]);
    });
  }, [items, priorityMap]);
}
