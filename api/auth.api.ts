import { QRLoginResponse } from '@/types/user.qr.types';
import { BaseApiService } from './base.api';
import type { LoginCredentials, RegisterCredentials, ForgotCredentials, ResetCredentials, AuthResponse } from '~/types/auth.types';
import { User, UserProfile } from '~/types/user.types';

export class AuthApiService extends BaseApiService<AuthResponse> {
  protected endpoint = '/auth';

  constructor() {
    super();
    this.setupAuthInterceptor();
  }

  private async setToken(token: string): Promise<void> {
    await this.storage.setItem('token', token);
  }

  private async setUserProfile(userProfile: UserProfile): Promise<void> {
    await this.storage.setItem('userProfile', userProfile);
  }

  private async removeToken(): Promise<void> {
    await this.storage.removeItem('token');
  }

  private async removeUserProfile(): Promise<void> {
    await this.storage.removeItem('userProfile');
  }

  public async getUserProfile(): Promise<UserProfile | null> {
    return this.storage.getItem('userProfile') as Promise<UserProfile | null>;
  }

  public async getToken(): Promise<string | null> {
    return this.storage.getItem('token');
  }

  public async getUserWithToken(): Promise<User> {
    try {
      const { data } = await this.axiosInstance.get<User>(`${this.endpoint}/me`);
      return data;
    } catch (err) {
      console.error('Error in getUserWithToken:', err);
      throw err;
    }
  }

  async qrLogin(token: string): Promise<QRLoginResponse> {
    try {
      const { data } = await this.axiosInstance.post<QRLoginResponse>(
        `${this.endpoint}/qr-login`,
        { token }
      );
      await this.setToken(data.token.token);
      await this.setUserProfile(data.user.profil);
      return data;
    } catch (err) {
      console.error('Error in qrLogin:', err);
      throw err;
    }
  }

  async login(credentials: LoginCredentials, showToast?: (message: string, type: 'success' | 'error') => void): Promise<AuthResponse> {
    try {
      const { data } = await this.axiosInstance.post<AuthResponse>(
        `${this.endpoint}/login`,
        credentials
      );
      await this.setToken(data.token.token);
      await this.setUserProfile(data.profil);  
      return data;
    } catch (error: any) {
      if (showToast) {
        // Log temporaire pour debug
        
        let errorMessage = 'Identifiants incorrects';
        
        if (error?.response?.status === 422) {
          errorMessage = 'Identifiant ou mot de passe incorrect';
        } else if (error?.response?.status === 500) {
          errorMessage = 'Erreur serveur, veuillez réessayer';
        } else if (!error?.response) {
          errorMessage = 'Problème de connexion réseau';
        }
        
        showToast(errorMessage, 'error');
      }
      
      throw error;
    }
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const { data } = await this.axiosInstance.post<AuthResponse>(
        `${this.endpoint}/register`,
        credentials
      );
      await this.setToken(data.token.token);
      await this.setUserProfile(data.profil);
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
      await this.setToken(data.token.token);
      await this.setUserProfile(data.profil);
      return data;
    } catch (err) {
      console.error('Error in refreshToken:', err);
      throw err;
    }
  }

  async forgotPassword(credentials: ForgotCredentials): Promise<AuthResponse> {
    try {
      const { data } = await this.axiosInstance.post<AuthResponse>(
        `${this.endpoint}/forgot-password`,
        credentials
      );
      return data;
    } catch (err) {
      console.error('Error in login:', err);
      throw err;
    }
  }

  async resetPassword(credentials: ResetCredentials): Promise<AuthResponse> {
    try {
      const { data } = await this.axiosInstance.post<AuthResponse>(
        `${this.endpoint}/reset-password`,
        credentials
      );
      return data;
    } catch (err) {
      console.error('Error in login:', err);
      throw err;
    }
  }

  logout(): void {
    this.removeToken();
    this.removeUserProfile()
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