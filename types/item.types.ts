import { ItemType } from '~/types/item-type.types';
import { FilterConfig } from '~/types/filter.types';

export type Item = {
  id?: string;
  name: string;
  price: number;
  allergens?: string[];
  description?: string;
  itemType: ItemType;
  itemTypeId?: string;
};
