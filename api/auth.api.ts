import { axiosInstance } from './axios.config';
import type { LoginCredentials, RegisterCredentials, AuthResponse } from '~/types/auth.types';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const { data } = await axiosInstance.post<AuthResponse>('/auth/login', credentials);
      localStorage.setItem('token', data.token.token);
      return data;
    } catch (err) {
      console.error('Error in login:', err);
      throw err;
    }
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    try {
      const { data } = await axiosInstance.post<AuthResponse>('/auth/register', credentials);
      localStorage.setItem('token', data.token.token);
      return data;
    } catch (err) {
      console.error('Error in register:', err);
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  refreshToken: async (): Promise<AuthResponse> => {
    try {
      const { data } = await axiosInstance.post<AuthResponse>('/auth/refresh');
      localStorage.setItem('token', data.token.token);
      return data;
    } catch (err) {
      console.error('Error in refreshToken:', err);
      throw err;
    }
  },
};