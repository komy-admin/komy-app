import { BaseApiService } from './base.api';
import type { LoginCredentials, RegisterCredentials, AuthResponse, currentUser } from '~/types/auth.types';

export class AuthApiService extends BaseApiService<AuthResponse> {
  protected endpoint = '/auth';

  constructor() {
    super();
    this.setupAuthInterceptor();
  }

  private async setCurrentUser(user: currentUser): Promise<void> {
    await this.storage.setItem('currentUser', JSON.stringify(user));
  }

  private async removeCurrentUser(): Promise<void> {
    await this.storage.removeItem('currentUser');
  }

  public async getCurrentUser(): Promise<currentUser | null> {
    const userStr = await this.storage.getItem('currentUser');
    if (!userStr) return null;
    return JSON.parse(userStr) as currentUser;
  }

  private async setToken(token: string): Promise<void> {
    await this.storage.setItem('token', token);
  }

  private async removeToken(): Promise<void> {
    await this.storage.removeItem('token');
  }

  public async getToken(): Promise<string | null> {
    return this.storage.getItem('token');
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const { data } = await this.axiosInstance.post<any>(
        `${this.endpoint}/login`,
        credentials
      );

      const user: currentUser = {
        id: data.id,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        profil: data.profil,
        accountId: data.accountId,
        loginId: data.loginId
      };
      
      await this.setCurrentUser(user);
      await this.setToken(data.token.token);

      return {
        accountType: data.profil,
        token: { token: data.token.token },
        user
      };
    } catch (err) {
      console.error('Error in login:', err);
      throw err;
    }
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const { data } = await this.axiosInstance.post<any>(
        `${this.endpoint}/register`,
        credentials
      );
      // Utile ???
      const user: currentUser = {
        id: data.id,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        profil: data.profil,
        accountId: data.accountId,
        loginId: data.loginId
      };

      await this.setCurrentUser(user);
      await this.setToken(data.token.token);

      return {
        accountType: data.profil,
        token: { token: data.token.token },
        user
      };
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
      await this.setToken(data.token.token);
      return data;
    } catch (err) {
      console.error('Error in refreshToken:', err);
      throw err;
    }
  }

  async logout(): Promise<void> {
    await this.removeToken();
    await this.removeCurrentUser();
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
            await this.logout();
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );
  }
}

export const authApiService = new AuthApiService();