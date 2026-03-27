import { store } from '~/store';
import { sessionActions } from '~/store/slices/session.slice';
import { storageService } from '~/lib/storageService';
import { authApiService } from '~/api/auth.api';
import type { LoginResponse, PinVerificationResponse } from '~/types/auth.types';
import type { QRLoginResponse } from '~/types/user.qr.types';

class SessionService {
  private static instance: SessionService;

  private constructor() {}

  static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService();
    }
    return SessionService.instance;
  }

  /**
   * Initialize session on app start
   * Checks for stored authToken
   */
  async initialize(): Promise<{ requireLogin: boolean; requirePin: boolean }> {
    try {
      const authToken = await storageService.getItem('authToken');

      if (!authToken) {
        // No auth token, need full login
        return { requireLogin: true, requirePin: false };
      }

      // We have authToken, set it in Redux
      store.dispatch(sessionActions.setStoredAuthToken({ authToken }));

      // User needs to enter PIN to get sessionToken
      return { requireLogin: false, requirePin: true };
    } catch (error) {
      return { requireLogin: true, requirePin: false };
    }
  }

  /**
   * Handle login with email/password
   * Stores authToken and sets up for PIN verification
   * If 2FA required on new device, dispatches login2FA state
   */
  async login(loginId: string, password: string): Promise<LoginResponse> {
    const response = await authApiService.login({ loginId, password });

    // Check if 2FA is required for this device
    if (response.requiresTwoFactor && response.loginToken) {
      store.dispatch(sessionActions.setLogin2FARequired({
        loginToken: response.loginToken,
        methods: response.twoFactorMethods || { totp: false, email: false },
      }));
      return response;
    }

    // Store the long-lived authToken
    if (response.authToken) {
      await storageService.setItem('authToken', response.authToken);

      store.dispatch(sessionActions.setAuthToken({
        authToken: response.authToken,
        requirePin: response.requirePin || false
      }));

      if (response.requirePinSetup) {
        store.dispatch(sessionActions.setPinRequired({
          requirePin: false,
          requirePinSetup: true
        }));
      }
    }

    return response;
  }

  /**
   * Verify 2FA code during login flow
   * Called after login returns requiresTwoFactor
   */
  async verifyLogin2FA(code: string, via?: 'totp' | 'email'): Promise<LoginResponse> {
    const state = store.getState();
    const loginToken = state.session.loginToken;

    if (!loginToken) {
      throw new Error('No login token available');
    }

    const response = await authApiService.verifyLogin2FA(code, loginToken, via);

    store.dispatch(sessionActions.clearLogin2FAState());

    if (response.authToken) {
      await storageService.setItem('authToken', response.authToken);

      store.dispatch(sessionActions.setAuthToken({
        authToken: response.authToken,
        requirePin: response.requirePin || false
      }));

      if (response.requirePinSetup) {
        store.dispatch(sessionActions.setPinRequired({
          requirePin: false,
          requirePinSetup: true
        }));
      }
    }

    return response;
  }

  /**
   * Handle QR code login
   * Similar to regular login but with QR token
   * For quick-created users (skipPin=true), completes full authentication immediately
   */
  async qrLogin(qrToken: string): Promise<QRLoginResponse> {
    const response = await authApiService.qrLogin(qrToken);

    if (response.authToken) {
      await storageService.setItem('authToken', response.authToken);

      // Quick-created users (skipPin) get full auth immediately
      if (response.skipPin && response.sessionToken) {
        await storageService.setItem('sessionToken', response.sessionToken);

        store.dispatch(sessionActions.setAuthToken({
          authToken: response.authToken,
          requirePin: false
        }));

        store.dispatch(sessionActions.setSessionToken({
          sessionToken: response.sessionToken,
          expiresIn: response.expiresIn ?? 0,
          user: response.user
        }));

        if (response.user) {
          store.dispatch(sessionActions.updateUser(response.user));
        }

        return response;
      }

      // Standard flow: requires PIN verification
      store.dispatch(sessionActions.setAuthToken({
        authToken: response.authToken,
        requirePin: response.requirePinVerification || false
      }));

      if (response.requirePinSetup) {
        store.dispatch(sessionActions.setPinRequired({
          requirePin: false,
          requirePinSetup: true
        }));
      }

      if (response.user) {
        store.dispatch(sessionActions.updateUser(response.user));
      }
    }

    return response;
  }

  /**
   * Verify PIN to get sessionToken
   * Uses authToken in headers
   */
  async verifyPin(pin: string): Promise<PinVerificationResponse> {
    const state = store.getState();
    const authToken = state.session.authToken;

    if (!authToken) {
      throw new Error('No auth token available. Please login first.');
    }

    const response = await authApiService.verifyPinWithAuthToken(pin, authToken);

    if (response.sessionToken) {
      store.dispatch(sessionActions.setSessionToken({
        sessionToken: response.sessionToken,
        expiresIn: response.expiresIn,
        user: response.user
      }));
    }

    return response;
  }

  /**
   * Set PIN for first time
   */
  async setPin(pin: string): Promise<PinVerificationResponse> {
    const state = store.getState();
    const authToken = state.session.authToken;

    if (!authToken) {
      throw new Error('No auth token available');
    }

    const response = await authApiService.setPinWithAuthToken(pin, authToken);

    if (response.sessionToken) {
      store.dispatch(sessionActions.setSessionToken({
        sessionToken: response.sessionToken,
        expiresIn: response.expiresIn,
        user: response.user
      }));
    }

    return response;
  }

  /**
   * Get headers for API calls
   * Returns sessionToken for business APIs
   */
  getApiHeaders(): { Authorization: string } {
    const state = store.getState();
    const sessionToken = state.session.sessionToken;
    const sessionExpiresAt = state.session.sessionExpiresAt;

    if (!sessionToken) {
      throw new Error('No session token available. Please verify PIN.');
    }

    // Check if session is expired
    if (sessionExpiresAt && new Date() > new Date(sessionExpiresAt)) {
      store.dispatch(sessionActions.expireSession());
      throw new Error('Session expired. Please verify PIN again.');
    }

    return {
      Authorization: `Bearer ${sessionToken}`
    };
  }

  /**
   * Get auth headers for PIN-related calls
   */
  getAuthHeaders(): { Authorization: string } {
    const state = store.getState();
    const authToken = state.session.authToken;

    if (!authToken) {
      throw new Error('No auth token available. Please login.');
    }

    return {
      Authorization: `Bearer ${authToken}`
    };
  }

  /**
   * Check if session is valid
   */
  isSessionValid(): boolean {
    const state = store.getState();
    const sessionToken = state.session.sessionToken;
    const sessionExpiresAt = state.session.sessionExpiresAt;

    if (!sessionToken || !sessionExpiresAt) {
      return false;
    }

    return new Date() < new Date(sessionExpiresAt);
  }

  /**
   * Check if we have a valid authToken
   */
  hasAuthToken(): boolean {
    const state = store.getState();
    return !!state.session.authToken;
  }

  /**
   * Clear session (but keep authToken)
   * Used when session expires or user backgrounds app
   */
  clearSession(): void {
    store.dispatch(sessionActions.expireSession());
  }

  /**
   * Full logout - clear everything
   */
  async logout(): Promise<void> {
    await storageService.removeItem('authToken');
    await storageService.removeItem('sessionToken');

    try {
      await authApiService.logout();
    } catch {
      // Proceed with local cleanup even if API call fails
    }

    store.dispatch(sessionActions.logout());
  }

  /**
   * Verify if QR token is still valid
   * Used for quick-created users to check if admin has revoked their access
   */
  async verifyQrTokenStatus(): Promise<boolean> {
    try {
      const state = store.getState();
      const user = state.session.user;

      // Only check for quick-created users (with skipPinRequired flag)
      if (!user || !user.skipPinRequired) {
        return true; // Regular users don't need QR token check
      }

      const result = await authApiService.verifyQrToken();

      if (!result.valid) {
        // Token was revoked - logout user
        await this.logout();
        return false;
      }

      return true;
    } catch (error) {
      return true; // Don't logout on network errors
    }
  }
}

export const sessionService = SessionService.getInstance();