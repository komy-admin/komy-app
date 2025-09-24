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
   */
  async login(loginId: string, password: string): Promise<LoginResponse> {
    try {
      const response = await authApiService.login({ loginId, password });

      // Store the long-lived authToken
      if (response.authToken) {
        await storageService.setItem('authToken', response.authToken);

        // Always store authToken in Redux
        store.dispatch(sessionActions.setAuthToken({
          authToken: response.authToken,
          requirePin: response.requirePin || false
        }));

        // Additionally set PIN setup flag if needed
        if (response.requirePinSetup) {
          store.dispatch(sessionActions.setPinRequired({
            requirePin: false,
            requirePinSetup: true
          }));
        }
      }

      return response as LoginResponse;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Handle QR code login
   * Similar to regular login but with QR token
   */
  async qrLogin(qrToken: string): Promise<QRLoginResponse> {
    try {
      const response = await authApiService.qrLogin(qrToken);

      // Store the authToken (same as regular login)
      if (response.authToken) {
        await storageService.setItem('authToken', response.authToken);

        // Set auth state in Redux
        store.dispatch(sessionActions.setAuthToken({
          authToken: response.authToken,
          requirePin: response.requirePinVerification || false
        }));

        // Handle PIN setup flag if needed
        if (response.requirePinSetup) {
          store.dispatch(sessionActions.setPinRequired({
            requirePin: false,
            requirePinSetup: true
          }));
        }

        // Store user info
        if (response.user) {
          store.dispatch(sessionActions.updateUser(response.user));
        }
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify PIN to get sessionToken
   * Uses authToken in headers
   */
  async verifyPin(pin: string): Promise<PinVerificationResponse> {
    try {
      const state = store.getState();
      const authToken = state.session.authToken;

      if (!authToken) {
        throw new Error('No auth token available. Please login first.');
      }

      // Call verify-pin with authToken in headers
      const response = await authApiService.verifyPinWithAuthToken(pin, authToken);

      // Store sessionToken in memory only (Redux)
      if (response.sessionToken) {
        store.dispatch(sessionActions.setSessionToken({
          sessionToken: response.sessionToken,
          expiresIn: response.expiresIn,
          user: response.user
        }));
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Set PIN for first time
   */
  async setPin(pin: string): Promise<PinVerificationResponse> {
    try {
      const state = store.getState();
      const authToken = state.session.authToken;

      if (!authToken) {
        throw new Error('No auth token available');
      }

      // Call set-pin with authToken in headers
      const response = await authApiService.setPinWithAuthToken(pin, authToken);

      // Store sessionToken in memory only
      if (response.sessionToken) {
        store.dispatch(sessionActions.setSessionToken({
          sessionToken: response.sessionToken,
          expiresIn: response.expiresIn,
          user: response.user
        }));
      }

      return response;
    } catch (error) {
      throw error;
    }
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
      store.dispatch(sessionActions.clearSessionToken());
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
    store.dispatch(sessionActions.clearSessionToken());
  }

  /**
   * Full logout - clear everything
   */
  async logout(): Promise<void> {
    try {
      // Clear stored authToken
      await storageService.removeItem('authToken');

      // Optional: notify backend
      try {
        await authApiService.logout();
      } catch (error) {
        // Proceed with local cleanup even if API call fails
      }

      // Clear Redux state
      store.dispatch(sessionActions.logout());
    } catch (error) {
      throw error;
    }
  }
}

export const sessionService = SessionService.getInstance();