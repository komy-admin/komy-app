import { axiosInstance } from './axios.config';
import { Order } from '~/types/order.types';

export const ordersApi = {
  getByOrderId: async (tableId: string): Promise<Order[]> => {
    throw new Error('Not implemented');
  },

  create: async (tableId: string, orderData: Partial<Order>): Promise<Order> => {
    throw new Error('Not implemented');
  }
};