import { QRLoginResponse } from '@/types/user.qr.types';
import { BaseApiService } from './base.api';
import type {
  LoginCredentials,
  RegisterCredentials,
  ForgotCredentials,
  ResetCredentials,
  AuthResponse,
  SetupAccountCredentials,
  LoginResponse,
  PinVerificationResponse,
  Setup2FAResponse,
  Enable2FAResponse,
  TrustedDevice,
} from '~/types/auth.types';
import { User, UserProfile } from '~/types/user.types';
import { extractApiError } from '~/lib/apiErrorHandler';

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
    } catch (err) {
      const info = extractApiError(err);
      if (info.status === 401) {
        return { valid: false, error: info.message || 'Token révoqué' };
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

  async confirmPin(pin: string): Promise<{ confirmed: boolean }> {
    try {
      const { data } = await this.axiosInstance.post<{ confirmed: boolean }>(
        `${this.endpoint}/confirm-pin`,
        { pin }
      );
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

  async changePassword(oldPassword: string, newPassword: string): Promise<{ message: string }> {
    const { data } = await this.axiosInstance.post<{ message: string }>(
      `${this.endpoint}/change-password`,
      { oldPassword, newPassword }
    );
    return data;
  }

  async changePin(oldPin: string, newPin: string): Promise<{ message: string }> {
    const { data } = await this.axiosInstance.post<{ message: string }>(
      `${this.endpoint}/change-pin`,
      { oldPin, newPin }
    );
    return data;
  }

  // Login 2FA methods (unauthenticated, use loginToken)
  async verifyLogin2FA(code: string, loginToken: string, via?: 'totp' | 'email'): Promise<LoginResponse> {
    const { data } = await this.axiosInstance.post<LoginResponse>(
      `${this.endpoint}/verify-login-2fa`,
      { code, via },
      { headers: { 'X-Login-Token': loginToken } }
    );
    return data;
  }

  async sendLogin2FAEmail(loginToken: string): Promise<{ message: string }> {
    const { data } = await this.axiosInstance.post<{ message: string }>(
      `${this.endpoint}/send-login-2fa-email`,
      {},
      { headers: { 'X-Login-Token': loginToken } }
    );
    return data;
  }

  // Trusted devices methods
  async getDevices(): Promise<TrustedDevice[]> {
    const { data } = await this.axiosInstance.get<TrustedDevice[]>(
      `${this.endpoint}/devices`
    );
    return data;
  }

  async revokeDevice(id: string): Promise<{ message: string }> {
    const { data } = await this.axiosInstance.delete<{ message: string }>(
      `${this.endpoint}/devices/${id}`
    );
    return data;
  }

  // Two-Factor Authentication (account-level) methods
  async setupTwoFactor(method: 'totp' | 'email'): Promise<Setup2FAResponse> {
    const { data } = await this.axiosInstance.post<Setup2FAResponse>(
      '/account-config/two-factor/setup',
      { method }
    );
    return data;
  }

  async verifyAndEnableTwoFactor(method: 'totp' | 'email', code: string): Promise<Enable2FAResponse> {
    const { data } = await this.axiosInstance.post<Enable2FAResponse>(
      '/account-config/two-factor/verify-setup',
      { method, code }
    );
    return data;
  }

  async disableTwoFactor(method: 'totp' | 'email', code: string, verifyVia?: 'totp' | 'email'): Promise<{ message: string; enabled: boolean; totp: boolean; email: boolean }> {
    const { data } = await this.axiosInstance.post<{ message: string; enabled: boolean; totp: boolean; email: boolean }>(
      '/account-config/two-factor/disable',
      { method, code, verifyVia }
    );
    return data;
  }

  async sendTwoFactorEmailCode(): Promise<{ message: string }> {
    const { data } = await this.axiosInstance.post<{ message: string }>(
      '/account-config/two-factor/send-email'
    );
    return data;
  }

  async logout(): Promise<void> {
    try {
      await this.axiosInstance.post(`${this.endpoint}/logout`);
    } catch {
      // Server-side cleanup failed — proceed with local cleanup
    } finally {
      await this.removeToken();
      await this.removeUserProfile();
    }
  }

  private setupAuthInterceptor(): void {
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // No config = network error (no request was sent) — bail out immediately
        if (!originalRequest) {
          return Promise.reject(error);
        }

        const errorCode = error.response?.data?.code;

        // Don't try to refresh on PIN-related or login 2FA endpoints
        const isPinEndpoint = originalRequest.url?.includes('/verify-pin') ||
                              originalRequest.url?.includes('/set-pin') ||
                              originalRequest.url?.includes('/change-password') ||
                              originalRequest.url?.includes('/change-pin') ||
                              originalRequest.url?.includes('/verify-login-2fa') ||
                              originalRequest.url?.includes('/send-login-2fa-email') ||
                              originalRequest.url?.includes('/auth/logout');

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

          // Device revoked - force full logout (clear authToken + Redux state)
          if (errorCode === 'DEVICE_REVOKED') {
            const { store } = await import('~/store');
            const { logout: logoutAction } = await import('~/store/slices/session.slice');
            await this.logout();
            store.dispatch(logoutAction());
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
            await this.logout();
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