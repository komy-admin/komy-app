import { OrderLine, SelectedTag } from '~/types/order-line.types';
import { Item } from '~/types/item.types';
import { ItemType } from '~/types/item-type.types';
import { Menu } from '~/types/menu.types';

/**
 * Sélections de menu (format simplifié)
 */
export interface MenuItemSelectionData {
  itemId: string;
  tags: SelectedTag[];
  note?: string;
}

export interface MenuSelections {
  [categoryId: string]: MenuItemSelectionData[];
}

/**
 * Props pour le composant OrderLinesForm (composant présentationnel pur)
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

  // Actions globales (Enregistrer / Annuler)
  onSave?: () => void;
  onCancel?: () => void;
  hasChanges?: boolean;
  isProcessing?: boolean;

  // Configuration (optionnel - pour service.tsx)
  onConfigurationModeChange?: (isConfiguring: boolean) => void;
}
