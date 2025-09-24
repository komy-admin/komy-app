import { useState, useEffect } from 'react';
import { Item } from '~/types/item.types';
import { ItemType } from '~/types/item-type.types';
import { useMenus } from '~/hooks/useMenus';
import { useToast } from '~/components/ToastProvider';

/**
 * Interface pour les props du hook simplifié (UI state seulement)
 */
export interface UseOrderLinesFormProps {
  items: Item[];
  itemTypes: ItemType[];
  onConfigurationModeChange?: (isConfiguring: boolean) => void;
  onConfigurationActionsChange?: (actions: { onCancel: () => void; onConfirm: () => void } | null) => void;
  onMenuConfigured?: (menuData: any) => void;
  onError?: (error: Error) => void;
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
  
  // Configuration de menu
  isConfiguringMenu: boolean;
  setIsConfiguringMenu: (configuring: boolean) => void;
  menuBeingConfigured: any | null;
  setMenuBeingConfigured: (menu: any | null) => void;
  tempMenuSelections: Record<string, string[]>;
  setTempMenuSelections: (selections: Record<string, string[]>) => void;
  startMenuConfiguration?: (menu: any) => Promise<void>;
  cancelMenuConfiguration?: () => void;
  confirmMenuConfiguration?: () => void;
  updateTempMenuSelection?: (categoryId: string, itemId: string, isSelected: boolean) => void;
  
  // Données
  activeMenus: any[];
  activeItems: Item[];
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
  onConfigurationModeChange,
  onConfigurationActionsChange,
  onMenuConfigured,
  onError
}: UseOrderLinesFormProps): UseOrderLinesFormReturn => {
  
  // États de navigation UI
  const [activeMainTab, setActiveMainTab] = useState<string>('ITEMS');
  const [activeItemType, setActiveItemType] = useState<string>('');
  
  // États de configuration de menu
  const [isConfiguringMenu, setIsConfiguringMenu] = useState(false);
  const [menuBeingConfigured, setMenuBeingConfigured] = useState<any | null>(null);
  const [tempMenuSelections, setTempMenuSelections] = useState<Record<string, string[]>>({});
  
  // Hooks externes
  const { showToast } = useToast();
  const { activeMenus, getMenuCategoryItems } = useMenus();
  
  // Filtrer les items actifs par type
  const activeItems = items.filter(item => {
    if (activeItemType === '') return item.isActive;
    return item.isActive && item.itemType?.id === activeItemType;
  });
  
  // Initialisation des itemTypes (une seule fois)
  useEffect(() => {
    if (itemTypes.length > 0 && !activeItemType) {
      setActiveItemType(itemTypes[0].id);
    }
  }, [itemTypes, activeItemType]);
  
  return {
    // États de navigation
    activeMainTab,
    setActiveMainTab,
    activeItemType,
    setActiveItemType,
    
    // Configuration de menu
    isConfiguringMenu,
    setIsConfiguringMenu,
    menuBeingConfigured,
    setMenuBeingConfigured,
    tempMenuSelections,
    setTempMenuSelections,
    
    // Données
    activeMenus,
    activeItems,
    allItemTypes: itemTypes,
  };
};