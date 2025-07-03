import axios, { AxiosInstance } from "axios";
import { Platform } from "react-native";
import { StorageInterface, storageService } from "~/lib/storageService";

const DEV_API_URL = Platform.select({
  android: `${process.env.EXPO_PUBLIC_API_URL}/api`,
  ios: `${process.env.EXPO_PUBLIC_API_URL}/api`,
  web: `${process.env.EXPO_PUBLIC_API_URL}/api`,
});
export abstract class BaseApiService<T> {
  protected abstract endpoint: string;
  protected axiosInstance: AxiosInstance;
  protected storage: StorageInterface;

  constructor(baseURL: string = 'http://localhost:3333/api') {
    this.axiosInstance = axios.create({
      baseURL: DEV_API_URL ? DEV_API_URL : baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.storage = storageService

    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await this.storage.getItem('token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  async getAll(params?: string): Promise<{ data: T[], meta: any }> {
    try {
      // const queryString = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
      const url = `${this.endpoint}${params ? `?${params}` : ''}`;
      const response = await this.axiosInstance.get<{ data: T[], meta: any }>(url);
      return response.data;
    } catch (error) {
      console.error(`Error in getAll for ${this.endpoint}:`, error);
      throw error;
    }
  }

  async get(id: string): Promise<T> {
    try {
      const response = await this.axiosInstance.get<T>(`${this.endpoint}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error in get for ${this.endpoint}/${id}:`, error);
      throw error;
    }
  }

  async create(data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<T> {
    try {
      const response = await this.axiosInstance.post<T>(this.endpoint, data);
      return response.data;
    } catch (error) {
      console.error(`Error in create for ${this.endpoint}:`, error);
      throw error;
    }
  }

  async update(id: string, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<T> {
    try {
      const response = await this.axiosInstance.put<T>(`${this.endpoint}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error in update for ${this.endpoint}/${id}:`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.axiosInstance.delete(`${this.endpoint}/${id}`);
    } catch (error) {
      console.error(`Error in delete for ${this.endpoint}/${id}:`, error);
      throw error;
    }
  }
}