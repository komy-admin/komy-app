import { QRLoginResponse } from '@/types/user.qr.types';
import { BaseApiService } from './base.api';
import type {
  LoginCredentials,
  RegisterCredentials,
  ForgotCredentials,
  ResetCredentials,
  AuthResponse,
  SetupAccountCredentials,
  VerifyPinCredentials,
  LoginResponse,
  PinVerificationResponse,
  PinErrorResponse,
} from '~/types/auth.types';
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
      throw err;
    }
  }

  async qrLogin(token: string): Promise<QRLoginResponse> {
    const { data } = await this.axiosInstance.post<QRLoginResponse>(
      `${this.endpoint}/qr-login`,
      { token }
    );
    return data;
  }

  async verifyQrToken(): Promise<{ valid: boolean; user?: User; error?: string }> {
    try {
      const { data } = await this.axiosInstance.get<{ user: User }>(
        `${this.endpoint}/verify-qr-token`
      );
      return { valid: true, user: data.user };
    } catch (err: any) {
      if (err.response?.status === 401) {
        return { valid: false, error: err.response?.data?.error || 'Token révoqué' };
      }
      throw err;
    }
  }

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const { data } = await this.axiosInstance.post<LoginResponse>(
        `${this.endpoint}/login`,
        credentials
      );

      // New dual token system - login returns authToken
      return data;
    } catch (err) {
      throw err;
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
      throw err;
    }
  }

  async setupAccount(credentials: SetupAccountCredentials): Promise<AuthResponse> {
    try {
      const { data } = await this.axiosInstance.post<AuthResponse>(
        `${this.endpoint}/setup-account`,
        credentials
      );
      await this.setToken(data.token.token);
      await this.setUserProfile(data.profil);
      return data;
    } catch (err) {
      throw err;
    }
  }

  async setPin(pin: string, temporaryToken: string): Promise<AuthResponse> {
    try {
      const { data } = await this.axiosInstance.post<AuthResponse>(
        `${this.endpoint}/set-pin`,
        { pin },
        {
          headers: {
            Authorization: `Bearer ${temporaryToken}`
          }
        }
      );
      await this.setToken(data.token.token);
      await this.setUserProfile(data.profil);
      return data;
    } catch (err) {
      throw err;
    }
  }

  // Legacy method - kept for compatibility
  async verifyPin(credentials: VerifyPinCredentials): Promise<AuthResponse> {
    try {
      const { data } = await this.axiosInstance.post<AuthResponse>(
        `${this.endpoint}/verify-pin`,
        credentials
      );
      await this.setToken(data.token.token);
      await this.setUserProfile(data.profil);
      return data;
    } catch (err) {
      throw err;
    }
  }

  // New method for dual token system - verify PIN with authToken
  async verifyPinWithAuthToken(pin: string, authToken: string): Promise<PinVerificationResponse> {
    try {
      const { data } = await this.axiosInstance.post<PinVerificationResponse>(
        `${this.endpoint}/verify-pin`,
        { pin },
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );
      return data;
    } catch (err) {
      throw err;
    }
  }

  // New method for dual token system - set PIN with authToken
  async setPinWithAuthToken(pin: string, authToken: string): Promise<PinVerificationResponse> {
    try {
      const { data } = await this.axiosInstance.post<PinVerificationResponse>(
        `${this.endpoint}/set-pin`,
        { pin },
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );
      return data;
    } catch (err) {
      throw err;
    }
  }

  // Forgot PIN - sends email with reset link
  async forgotPin(email: string): Promise<{ message: string }> {
    try {
      const { data } = await this.axiosInstance.post<{ message: string }>(
        `${this.endpoint}/forgot-pin`,
        { email }
      );
      return data;
    } catch (err) {
      throw err;
    }
  }

  // Reset PIN with token from email
  async resetPin(token: string, pin: string): Promise<{
    message: string;
    authToken: string;
    requirePinVerification: boolean;
    user: User;
  }> {
    try {
      const { data } = await this.axiosInstance.post<{
        message: string;
        authToken: string;
        requirePinVerification: boolean;
        user: User;
      }>(
        `${this.endpoint}/reset-pin`,
        { token, pin }
      );
      return data;
    } catch (err) {
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
        const errorCode = error.response?.data?.code;

        // Don't try to refresh on PIN-related endpoints or PIN errors
        const isPinEndpoint = originalRequest.url?.includes('/verify-pin') ||
                              originalRequest.url?.includes('/set-pin');

        // Don't refresh on PIN errors (401 with attemptsRemaining or PIN in message)
        const isPinError = error.response?.status === 401 &&
                          (error.response?.data?.message?.includes('PIN') ||
                           error.response?.data?.attemptsRemaining !== undefined ||
                           error.response?.data?.error === 'INVALID_PIN');

        if (isPinEndpoint || isPinError) {
          return Promise.reject(error);
        }

        // Handle different 401 scenarios
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          // Session token expired - need PIN verification
          if (errorCode === 'SESSION_TOKEN_INVALID' || errorCode === 'SESSION_TOKEN_MISSING') {
            // The UI will handle redirecting to PIN verification
            return Promise.reject(error);
          }

          // Auth token invalid - need full re-login
          if (errorCode === 'AUTH_TOKEN_INVALID' || errorCode === 'AUTH_TOKEN_MISSING') {
            // The UI will handle redirecting to login
            return Promise.reject(error);
          }

          // Legacy token refresh attempt (for backward compatibility)
          try {
            const response = await this.refreshToken();
            const newToken = response.token.token;

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }

            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            // Let the UI handle logout
            this.logout();
            return Promise.reject(refreshError);
          }
        }

        // Handle rate limiting (429)
        if (error.response?.status === 429) {
          // Rate limit exceeded - handled by UI
          return Promise.reject(error);
        }

        return Promise.reject(error);
      }
    );
  }
}

export const authApiService = new AuthApiService()