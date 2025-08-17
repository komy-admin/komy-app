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
  items?: MenuCategoryItem[];
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

// ✅ Type pour la nouvelle API bulk
export type MenuBulkUpdateRequest = {
  menu: {
    name: string;
    description?: string;
    basePrice: number;
    isActive: boolean;
  };
  categories: Array<{
    id?: string; // Si présent = update, si absent = create
    itemTypeId: string;
    isRequired: boolean;
    maxSelections: number;
    priceModifier: number;
    items: Array<{
      id?: string; // Si présent = update MenuCategoryItem existant, si absent = create nouveau
      itemId: string;
      supplement: number;
      isAvailable: boolean;
    }>;
  }>;
};

// ✅ Type pour la création bulk (même structure que update)
export type MenuBulkCreateRequest = MenuBulkUpdateRequest;