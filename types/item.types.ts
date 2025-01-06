import { ItemTypes } from "./item-type.enum";
import { FilterConfig } from '~/types/filter.types';
import { ItemTypeTypes } from '~/types/item-type.types';

export type Item = {
  id?: string;
  name: string;
  price: number;
  allergens?: string[];
  description?: string;
  itemType?: ItemTypeTypes;
  itemTypeId?: string;
};

export const filterItem: FilterConfig<Item>[] = [
  { 
    field: 'name', 
    type: 'text' as const, 
    label: 'Nom',
    operator: 'like' as const
  },
  { 
    field: 'price', 
    type: 'number' as const, 
    label: 'Prix',
  },
];