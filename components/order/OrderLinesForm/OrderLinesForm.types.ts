import { OrderLine, DraftOrderLine } from '~/types/order-line.types';
import { Item } from '~/types/item.types';
import { ItemType } from '~/types/item-type.types';

/**
 * Actions de configuration pour les menus
 */
export interface ConfigurationActions {
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Props pour le composant OrderLinesForm (composant contrôlé pur)
 * Plus de ref, plus de compatibilité AdminFormRef - juste props down / events up
 */
export interface OrderLinesFormProps {
  lines: OrderLine[];           // Lignes actuelles (contrôlé par le parent)
  items: Item[];               // Items disponibles
  itemTypes: ItemType[];       // Types d'items
  onLinesChange: (lines: OrderLine[]) => void;  // Callback pour émettre les changements
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