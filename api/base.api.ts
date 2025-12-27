import axios, { AxiosInstance } from "axios";
import { Platform } from "react-native";
import { StorageInterface, storageService } from "~/lib/storageService";
import { store } from "~/store";
import { logout } from "~/store";

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
        // Define endpoint whitelists for robust matching
        const AUTH_ENDPOINTS = [
          '/auth/login',
          '/auth/register',
          '/auth/forgot-password',
          '/auth/reset-password',
          '/auth/qr-login',
          '/auth/setup-account'
        ];

        const PIN_ENDPOINTS = [
          '/auth/verify-pin',
          '/auth/set-pin'
        ];

        // Helper to extract path from config.url
        const getEndpointPath = (url: string | undefined): string => {
          if (!url) return '';
          // Remove query params and base URL if present
          const path = url.split('?')[0];
          // Handle both relative and absolute URLs
          if (path.startsWith('http')) {
            try {
              const urlObj = new URL(path);
              return urlObj.pathname;
            } catch {
              return path;
            }
          }
          return path;
        };

        const endpointPath = getEndpointPath(config.url);

        // Check if this is an auth endpoint (no token needed)
        const isAuthEndpoint = AUTH_ENDPOINTS.some(endpoint => endpointPath.endsWith(endpoint));
        if (isAuthEndpoint) {
          return config;
        }

        // Check if this is a PIN endpoint (authToken handled in specific methods)
        const isPinEndpoint = PIN_ENDPOINTS.some(endpoint => endpointPath.endsWith(endpoint));
        if (isPinEndpoint) {
          // Token is already set in the specific method call
          return config;
        }

        // For all other endpoints, use sessionToken from Redux store
        const state = store.getState();
        const sessionToken = state.session.sessionToken;
        const sessionExpiresAt = state.session.sessionExpiresAt;

        if (sessionToken && sessionExpiresAt) {
          // Check if session is still valid
          if (new Date() < new Date(sessionExpiresAt)) {
            if (config.headers) {
              config.headers.Authorization = `Bearer ${sessionToken}`;
            }
          }
          // If expired, don't set header - let 401 handler deal with it
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle QR token revocation
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        // Check for QR token revocation
        if (error.response?.status === 401 && error.response?.data?.code === 'QR_TOKEN_REVOKED') {
          // Dispatch logout action
          store.dispatch(logout());
        }
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
      throw error;
    }
  }
}