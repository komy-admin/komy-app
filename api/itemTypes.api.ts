import { ItemTypeTypes } from '~/types/item-type.types';
import { axiosInstance } from './axios.config';

export const itemTypeApi = {
  getItemTypes: async (params?: any): Promise<{ data: ItemTypeTypes[], meta: {} }> => {
    try {
      const response = await axiosInstance.get<{ data: ItemTypeTypes[], meta: {} }>(`/itemType?${params}`)
      const { data, meta } = response.data
      return { data, meta };
    } catch (err) {
      console.error('Error in getItemTypes:', err);
      return { data: [], meta: {} };
    }
  },

  getItemType: async (id: string): Promise<ItemTypeTypes> => {
    const { data } = await axiosInstance.get<ItemTypeTypes>(`/itemType/${id}`);
    return data;
  },
  
  createItemType: async (ItemTypes: Omit<ItemTypeTypes, 'id'>): Promise<ItemTypeTypes> => {
    const { data } = await axiosInstance.post<ItemTypeTypes>('itemType', ItemTypes);
    return data;
  },

  updateItemType: async (id: string, ItemTypes: Partial<ItemTypeTypes>): Promise<ItemTypeTypes> => {
    const { data } = await axiosInstance.put<ItemTypeTypes>(`itemType/${id}`, ItemTypes);
    return data;
  },

  deleteItemType: async (id: string): Promise<void> => {
    await axiosInstance.delete(`itemType/${id}`);
  },
  
};