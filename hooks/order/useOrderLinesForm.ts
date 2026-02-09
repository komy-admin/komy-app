import { useState, useEffect, useMemo } from 'react';
import { Item } from '~/types/item.types';
import { ItemType } from '~/types/item-type.types';
import { useMenus } from '~/hooks/useMenus';

/**
 * Groupe d'items par itemType pour le rendu en sections
 */
export interface ItemsByTypeGroup {
  itemType: ItemType;
  items: Item[];
}

/**
 * Interface pour les props du hook simplifié (UI state seulement)
 */
export interface UseOrderLinesFormProps {
  items: Item[];
  itemTypes: ItemType[];
}

/**
 * Interface pour le retour du hook simplifié
 */
export interface UseOrderLinesFormReturn {
  // États de navigation
  activeMainTab: string;
  setActiveMainTab: (tab: string) => void;
  activeItemType: string;
  setActiveItemType: (itemType: string) => void;

  // Données
  activeMenus: any[];
  activeItems: Item[];
  itemsByType: ItemsByTypeGroup[];
  allItemTypes: ItemType[];
}

/**
 * Hook simplifié pour OrderLinesForm (UI state seulement)
 * La logique métier a été remontée dans service.tsx
 * 
 * @param props - Props du hook
 * @returns Interface pour gérer l'état UI du formulaire
 */
export const useOrderLinesForm = ({
  items,
  itemTypes,
}: UseOrderLinesFormProps): UseOrderLinesFormReturn => {
  
  // États de navigation UI
  const [activeMainTab, setActiveMainTab] = useState<string>('MENUS');
  const [activeItemType, setActiveItemType] = useState<string>('');
  
  // Hooks externes
  const { activeMenus } = useMenus();
  
  // Tous les items actifs (sans filtrage par type)
  const activeItems = items.filter(item => item.isActive);

  // Items groupés par itemType, triés par priorityOrder
  const itemsByType = useMemo<ItemsByTypeGroup[]>(() => {
    const sortedTypes = [...itemTypes].sort((a, b) => a.priorityOrder - b.priorityOrder);
    return sortedTypes
      .map(itemType => ({
        itemType,
        items: activeItems.filter(item => {
          const typeId = item.itemType?.id || item.itemTypeId;
          return typeId === itemType.id;
        }),
      }))
      .filter(group => group.items.length > 0);
  }, [activeItems, itemTypes]);
  
  // Initialisation des itemTypes (une seule fois)
  useEffect(() => {
    if (itemTypes.length > 0 && !activeItemType) {
      setActiveItemType(itemTypes[0].id);
    }
  }, [itemTypes, activeItemType]);
  
  return {
    activeMainTab,
    setActiveMainTab,
    activeItemType,
    setActiveItemType,
    activeMenus,
    activeItems,
    itemsByType,
    allItemTypes: itemsByType.map(group => group.itemType),
  };
};