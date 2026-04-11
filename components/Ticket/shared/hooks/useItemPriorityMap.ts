import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectItemTypes } from '~/store/selectors';

/**
 * Hook qui crée un mapping des types d'items vers leur ordre de priorité
 *
 * Utilisé pour trier les catégories d'items dans l'affichage cuisine
 * (ex: Entrées avant Plats avant Desserts)
 *
 * @returns Map<nom du type, priorityOrder>
 *
 * @example
 * const priorityMap = useItemPriorityMap();
 * const priority = priorityMap.get('Entrée') || 999;
 */
export function useItemPriorityMap(): Map<string, number> {
  const itemTypes = useSelector(selectItemTypes);

  return useMemo(() => {
    const map = new Map<string, number>();
    itemTypes.forEach(itemType => {
      map.set(itemType.name, itemType.priorityOrder);
    });
    return map;
  }, [itemTypes]);
}
