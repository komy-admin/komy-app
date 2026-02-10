import { ItemType } from '~/types/item-type.types';
import { Tag } from '~/types/tag.types';

export type Item = {
  id: string;
  name: string;
  price: number; // 💰 Prix en centimes (ex: 300 = 3€)
  color?: string;
  allergens?: string[];
  description?: string;
  itemType: ItemType;
  itemTypeId?: string;
  isActive: boolean;
  hasNote: boolean;
  tags?: Tag[];
};
