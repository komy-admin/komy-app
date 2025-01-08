import axios, { AxiosInstance } from "axios";
import { QueryParams } from "~/types/filter.types";

export abstract class BaseApiService<T> {
  protected abstract endpoint: string;
  protected axiosInstance: AxiosInstance;

  constructor(baseURL: string = 'http://localhost:3333/api') {
    this.axiosInstance = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Ajout de l'intercepteur directement dans le constructeur de base
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
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

  // Obtenir tous les éléments avec pagination et filtres optionnels
  async getAll(params?: QueryParams): Promise<{ data: T[], meta: any }> {
    try {
      const queryString = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
      const url = `${this.endpoint}${queryString ? `?${queryString}` : ''}`;
      const response = await this.axiosInstance.get<{ data: T[], meta: any }>(url);
      return response.data;
    } catch (error) {
      console.error(`Error in getAll for ${this.endpoint}:`, error);
      throw error;
    }
  }

  // Obtenir un élément par ID
  async get(id: string): Promise<T> {
    try {
      const response = await this.axiosInstance.get<T>(`${this.endpoint}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error in get for ${this.endpoint}/${id}:`, error);
      throw error;
    }
  }

  // Créer un nouvel élément
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    try {
      const response = await this.axiosInstance.post<T>(this.endpoint, data);
      return response.data;
    } catch (error) {
      console.error(`Error in create for ${this.endpoint}:`, error);
      throw error;
    }
  }

  // Mettre à jour un élément
  async update(id: string, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<T> {
    try {
      const response = await this.axiosInstance.put<T>(`${this.endpoint}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error in update for ${this.endpoint}/${id}:`, error);
      throw error;
    }
  }

  // Supprimer un élément
  async delete(id: string): Promise<void> {
    try {
      await this.axiosInstance.delete(`${this.endpoint}/${id}`);
    } catch (error) {
      console.error(`Error in delete for ${this.endpoint}/${id}:`, error);
      throw error;
    }
  }
}