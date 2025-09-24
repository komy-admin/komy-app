import { ItemType } from '~/types/item-type.types';

export type Item = {
  id: string;
  name: string;
  price: number;
  color?: string;
  allergens?: string[];
  description?: string;
  itemType: ItemType;
  itemTypeId?: string;
  isActive: boolean;
};
