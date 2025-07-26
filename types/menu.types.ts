import { ItemType } from './item-type.types';
import { Item } from './item.types';
import { OrderItem } from './order-item.types';

export type Menu = {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  isActive: boolean;
  categories: MenuCategory[];
};

export type MenuCategory = {
  id: string;
  menuId: string;
  itemTypeId: string;
  isRequired: boolean;
  maxSelections: number;
  priceModifier: number;
  itemType: ItemType;
};

export type MenuCategoryItem = {
  id: string;
  menuCategoryId: string;
  itemId: string;
  supplement: number;
  isAvailable: boolean;
  item: Item;
};

export type MenuGroup = {
  id: string;
  totalPrice: number;
  menu: Menu;
  orderItems: OrderItem[];
};

// Types pour les calculs de prix
export type MenuPriceCalculationRequest = {
  menuId: string;
  selectedCategories: string[];
  selectedItems: Array<{
    itemId: string;
    menuCategoryItemId: string;
  }>;
};

export type MenuPriceCalculationResponse = {
  basePrice: number;
  categoryModifiers: number;
  itemSupplements: number;
  totalPrice: number;
  breakdown: {
    menu: {
      name: string;
      basePrice: number;
    };
    categories: Array<{
      name: string;
      priceModifier: number;
    }>;
    items: Array<{
      name: string;
      supplement: number;
    }>;
  };
};