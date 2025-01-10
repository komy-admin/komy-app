import { ItemTypeTypes } from '~/types/item-type.types';
import { FilterConfig } from '~/types/filter.types';

export type Item = {
  id?: string;
  name: string;
  price: number;
  allergens?: string[];
  description?: string;
  itemType: ItemTypeTypes;
  itemTypeId?: string;
};

export const filterItem: FilterConfig<Item>[] = [
  { 
    field: 'name', 
    type: 'text',
    label: 'Nom',
  },
  { 
    field: 'price', 
    type: 'number',
    label: 'Prix',
    operator: 'between',
  }
];