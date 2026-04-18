import { Item } from '~/types/item.types';

export interface MenuFormData {
  name: string;
  description: string;
  basePrice: string;
  isActive: boolean;
  vatRate: string; // Taux de TVA sous forme de string pour le formulaire (ex: "0.1")
  categories: MenuCategoryFormData[];
}

export interface MenuCategoryFormData {
  id?: string;
  itemTypeId: string;
  isRequired: boolean;
  maxSelections: string;
  priceModifier: string;
}

export interface LocalMenuCategoryItem {
  tempId: string;
  originalId?: string;
  itemId: string;
  supplement: number;
  isAvailable: boolean;
  item?: Item;
  isModified?: boolean;
  isDeleted?: boolean;
}