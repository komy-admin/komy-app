import { ItemTypes } from '~/types/item-type.enum';
import { Item } from '~/types/item.types';
// import { mockItems } from './mocks/items.mock';
import { axiosInstance } from './axios.config';

export const itemsApi = {
  getItems: async (params?: any): Promise<{ data: Item[], meta: {} }> => {
    try {
      const queryParams = params ? `/item?${params}` : '/item';
      const response = await axiosInstance.get<{ data: Item[], meta: {} }>(queryParams)
      const { data, meta } = response.data
      return { data, meta };
    } catch (err) {
      console.error('Error in getItems:', err);
      return { data: [], meta: {} };
    }
  },

  getItem: async (id: string): Promise<Item> => {
    const { data } = await axiosInstance.get<Item>(`/item/${id}`);
    return data;
  },
  
  createItem: async (item: Omit<Item, 'id'>): Promise<Item> => {
    const { data } = await axiosInstance.post<Item>('item', item);
    return data;
  },

  updateItem: async (id: string, item: Partial<Item>): Promise<Item> => {
    const { data } = await axiosInstance.put<Item>(`item/${id}`, item);
    return data;
  },

  deleteItem: async (id: string): Promise<void> => {
    await axiosInstance.delete(`item/${id}`);
  },

};