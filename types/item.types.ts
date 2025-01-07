import { ItemTypeTypes } from '~/types/item-type.types';

export type Item = {
  id?: string;
  name: string;
  price: number;
  allergens?: string[];
  description?: string;
  itemType: ItemTypeTypes;
  itemTypeId?: string;
};