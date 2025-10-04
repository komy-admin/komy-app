import { ItemType } from './item-type.types';
import { Item } from './item.types';
import { OrderItem } from './order-line.types';

export type Menu = {
  id: string;
  name: string;
  description?: string;
  basePrice: number; // 💰 Prix en centimes (ex: 1500 = 15€)
  isActive: boolean;
  categories: MenuCategory[];
};

export type MenuCategory = {
  id: string;
  menuId: string;
  itemTypeId: string;
  isRequired: boolean;
  maxSelections: number;
  priceModifier: number; // 💰 Modificateur en centimes (ex: 200 = +2€)
  itemType: ItemType;
  items?: MenuCategoryItem[];
};

export type MenuCategoryItem = {
  id: string;
  menuCategoryId: string;
  itemId: string;
  supplement: number; // 💰 Supplément en centimes (ex: 150 = +1,50€)
  isAvailable: boolean;
  item: Item;
};

export type MenuGroup = {
  id: string;
  totalPrice: number; // 💰 Prix total en centimes
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
  basePrice: number; // 💰 Prix en centimes
  categoryModifiers: number; // 💰 Modificateurs en centimes
  itemSupplements: number; // 💰 Suppléments en centimes
  totalPrice: number; // 💰 Prix total en centimes
  breakdown: {
    menu: {
      name: string;
      basePrice: number; // 💰 Prix en centimes
    };
    categories: Array<{
      name: string;
      priceModifier: number; // 💰 Modificateur en centimes
    }>;
    items: Array<{
      name: string;
      supplement: number; // 💰 Supplément en centimes
    }>;
  };
};

// ✅ Type pour la nouvelle API bulk
export type MenuBulkUpdateRequest = {
  menu: {
    name: string;
    description?: string;
    basePrice: number; // 💰 Prix en centimes (envoi API)
    isActive: boolean;
  };
  categories: Array<{
    id?: string; // Si présent = update, si absent = create
    itemTypeId: string;
    isRequired: boolean;
    maxSelections: number;
    priceModifier: number; // 💰 Modificateur en centimes (envoi API)
    items: Array<{
      id?: string; // Si présent = update MenuCategoryItem existant, si absent = create nouveau
      itemId: string;
      supplement: number; // 💰 Supplément en centimes (envoi API)
      isAvailable: boolean;
    }>;
  }>;
};

// ✅ Type pour la création bulk (même structure que update)
export type MenuBulkCreateRequest = MenuBulkUpdateRequest;