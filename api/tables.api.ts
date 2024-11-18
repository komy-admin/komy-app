import { axiosInstance } from './axios.config';
import { Table } from '~/types/table.types';
import { mockTables } from './mocks/tables.mock';

export const tablesApi = {
  getAll: async (): Promise<Table[]> => {
    try {
      // En production
      // const response = await axiosInstance.get('/tables');
      // return response.data;
      
      // Pour le mock
      return Promise.resolve(mockTables);
    } catch (error) {
      console.error('Error fetching tables:', error);
      throw error;
    }
  },

  getById: async (id: string): Promise<Table> => {
    try {
      // const response = await axiosInstance.get(`/tables/${id}`);
      // return response.data;
      
      const table = mockTables.find(t => t.id === id);
      if (!table) throw new Error('Table not found');
      return Promise.resolve(table);
    } catch (error) {
      console.error(`Error fetching table ${id}:`, error);
      throw error;
    }
  },

  updateStatus: async (id: string, status: string): Promise<Table> => {
    throw new Error('Not implemented');
  }
};