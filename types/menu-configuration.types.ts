import { Item } from './item.types';
import { SelectedTag } from './order-line.types';

/**
 * Type pour une catégorie de menu avec ses items
 */
export interface MenuCategory {
  id: string;
  isRequired: boolean;
  itemTypeId?: string;
  items?: MenuCategoryItem[];
}

/**
 * Type pour un item dans une catégorie de menu
 */
export interface MenuCategoryItem {
  id: string;
  item?: Item;
  itemId?: string;
  supplement?: number;
  isAvailable?: boolean;
}

/**
 * Type pour un item de menu avec ses customisations (tags, note)
 */
export interface MenuItemWithCustomization {
  item: Item;
  categoryName?: string;
  tags?: SelectedTag[];
  note?: string;
}
