import { BaseApiService } from './base.api';
import type { LoginCredentials, RegisterCredentials, AuthResponse } from '~/types/auth.types';

export class AuthApiService extends BaseApiService<AuthResponse> {
  protected endpoint = '/auth';

  constructor() {
    super();
    this.setupAuthInterceptor();
  }

  private setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  private removeToken(): void {
    localStorage.removeItem('token');
  }

  public getToken(): string | null {
    return localStorage.getItem('token');
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const { data } = await this.axiosInstance.post<AuthResponse>(
        `${this.endpoint}/login`,
        credentials
      );
      this.setToken(data.token.token);
      return data;
    } catch (err) {
      console.error('Error in login:', err);
      throw err;
    }
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const { data } = await this.axiosInstance.post<AuthResponse>(
        `${this.endpoint}/register`,
        credentials
      );
      this.setToken(data.token.token);
      return data;
    } catch (err) {
      console.error('Error in register:', err);
      throw err;
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    try {
      const { data } = await this.axiosInstance.post<AuthResponse>(
        `${this.endpoint}/refresh`
      );
      this.setToken(data.token.token);
      return data;
    } catch (err) {
      console.error('Error in refreshToken:', err);
      throw err;
    }
  }

  logout(): void {
    this.removeToken();
  }

  private setupAuthInterceptor(): void {
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const response = await this.refreshToken();
            const newToken = response.token.token;
            
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            this.logout();
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );
  }
}

export const authApiService = new AuthApiService()