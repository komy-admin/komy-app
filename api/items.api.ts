import { ItemTypes } from '~/types/item-types.enum';
import { Item } from '~/types/item.types';
import { mockItems } from './mocks/items.mock';

export const itemsApi = {
  getItems: async (itemType: ItemTypes): Promise<Item[]> => {
    try {
      const items = mockItems.filter((item) => item.itemType === itemType);
      return items;
    } catch (err) {
      console.error('Error in getItems:', err);
      return [];
    }
  },
};