import { OrderLine, DraftOrderLine, SelectedTag } from '~/types/order-line.types';
import { Item } from '~/types/item.types';
import { ItemType } from '~/types/item-type.types';
import { Menu } from '~/types/menu.types';

/**
 * Actions de configuration pour les menus
 */
export interface ConfigurationActions {
  onCancel: () => void;
  onConfirm: () => void;
  isValid?: boolean;
}

/**
 * Sélections de menu (format simplifié)
 */
export interface MenuSelections {
  [categoryId: string]: {
    itemId: string;
    tags: SelectedTag[];
    note?: string;
  };
}

/**
 * Props pour le composant OrderLinesForm (NOUVEAU - composant présentationnel pur)
 *
 * Le composant ne gère PLUS l'état des lignes, il émet seulement des événements au parent.
 * Le parent (via useOrderLinesManager) gère tout l'état et la logique métier.
 */
export interface OrderLinesFormProps {
  // Données (read-only)
  title?: string;
  lines: OrderLine[];
  items: Item[];
  itemTypes: ItemType[];

  // Événements (mutations)
  onAddItem: (item: Item, customization: { tags: SelectedTag[]; note?: string }) => void;
  onUpdateItem: (lineId: string, customization: { tags: SelectedTag[]; note?: string }) => void;
  onAddMenu: (menu: Menu, selections: MenuSelections, itemTypes: ItemType[]) => void;
  onUpdateMenu: (lineId: string, menu: Menu, selections: MenuSelections, itemTypes: ItemType[]) => void;
  onDeleteLine: (lineId: string) => void;
  onClearAll?: () => void;

  // Actions globales (Enregistrer / Annuler)
  onSave?: () => void;
  onCancel?: () => void;
  hasChanges?: boolean;
  isProcessing?: boolean;

  // Configuration (optionnel - pour service.tsx)
  onConfigurationModeChange?: (isConfiguring: boolean) => void;
  onConfigurationActionsChange?: (actions: ConfigurationActions | null) => void;
}

/**
 * Interface pour l'état interne du composant - simplifié pour un composant contrôlé
 */
export interface OrderLinesFormData {
  lines: DraftOrderLine[];  // Les drafts en cours d'édition
  isValid: boolean;
  errors: string[];
}

/**
 * Types pour les actions de navigation
 */
export type MainTabType = 'ITEMS' | 'MENUS';

/**
 * Types pour les actions sur les quantités
 */
export type QuantityAction = 'add' | 'remove';

/**
 * Configuration des actions du footer
 */
export interface FooterActions {
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * État de configuration des menus
 */
export interface MenuConfigurationState {
  isConfiguring: boolean;
  menu: any | null;
  selections: Record<string, string[]>;
  isValid: boolean;
  errors: string[];
}

/**
 * Interface pour l'état interne du composant OrderLinesForm (simplifié)
 */
export interface OrderLinesFormState {
  // Navigation
  activeMainTab: MainTabType;
  activeItemType: string;
  
  // Configuration menu
  isConfiguringMenu: boolean;
  menuBeingConfigured: any | null;
  tempMenuSelections: Record<string, string[]>;
  
  // Draft local (avant validation et émission vers parent)
  draftLines: DraftOrderLine[];
}