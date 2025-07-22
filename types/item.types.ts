import { ItemType } from '~/types/item-type.types';

export type Item = {
  id: string;
  name: string;
  price: number;
  allergens?: string[];
  description?: string;
  itemType: ItemType;
  itemTypeId?: string;
  isActive: boolean;
};
