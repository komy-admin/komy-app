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
    const { data } = await this.axiosInstance.post<LoginResponse>(
      `${this.endpoint}/login`,
      credentials
    );
    return data;
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const { data } = await this.axiosInstance.post<AuthResponse>(
      `${this.endpoint}/register`,
      credentials
    );
    await this.setToken(data.token.token);
    await this.setUserProfile(data.profil);
    return data;
  }

  async forgotPassword(credentials: ForgotCredentials): Promise<AuthResponse> {
    const { data } = await this.axiosInstance.post<AuthResponse>(
      `${this.endpoint}/forgot-password`,
      credentials
    );
    return data;
  }

  async resetPassword(credentials: ResetCredentials): Promise<AuthResponse> {
    const { data } = await this.axiosInstance.post<AuthResponse>(
      `${this.endpoint}/reset-password`,
      credentials
    );
    return data;
  }

  async setupAccount(credentials: SetupAccountCredentials): Promise<AuthResponse> {
    const { data } = await this.axiosInstance.post<AuthResponse>(
      `${this.endpoint}/setup-account`,
      credentials
    );
    await this.setToken(data.token.token);
    await this.setUserProfile(data.profil);
    return data;
  }

  async confirmPin(pin: string): Promise<{ confirmed: boolean }> {
    const { data } = await this.axiosInstance.post<{ confirmed: boolean }>(
      `${this.endpoint}/confirm-pin`,
      { pin }
    );
    return data;
  }

  async verifyPinWithAuthToken(pin: string, authToken: string): Promise<PinVerificationResponse> {
    const { data } = await this.axiosInstance.post<PinVerificationResponse>(
      `${this.endpoint}/verify-pin`,
      { pin },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    return data;
  }

  async setPinWithAuthToken(pin: string, authToken: string): Promise<PinVerificationResponse> {
    const { data } = await this.axiosInstance.post<PinVerificationResponse>(
      `${this.endpoint}/set-pin`,
      { pin },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    return data;
  }

  async forgotPin(email: string): Promise<{ message: string }> {
    const { data } = await this.axiosInstance.post<{ message: string }>(
      `${this.endpoint}/forgot-pin`,
      { email }
    );
    return data;
  }

  async resetPin(token: string, pin: string): Promise<{
    message: string;
    authToken: string;
    requirePinVerification: boolean;
    user: User;
  }> {
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

}

export const authApiService = new AuthApiService()