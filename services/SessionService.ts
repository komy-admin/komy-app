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
   * Persist user profile for session restore on app restart.
   * Called whenever we receive user data from the backend.
   */
  private async persistUserProfile(user: any): Promise<void> {
    try {
      await storageService.setItem('userProfile', JSON.stringify(user));
    } catch {
      // Non-critical — worst case user goes to PIN instead of standby on restart
    }
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

      // Restore persisted user profile (needed for skipPinRequired routing)
      let user: any = null;
      try {
        const userJson = await storageService.getItem('userProfile');
        if (userJson) user = JSON.parse(userJson);
      } catch {
        // Ignore parse errors
      }

      // We have authToken, set it in Redux (with user if available)
      store.dispatch(sessionActions.setStoredAuthToken({ authToken, user }));

      // User needs to enter PIN (or standby for skipPinRequired)
      return { requireLogin: false, requirePin: !user?.skipPinRequired };
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

    // skipPinRequired users get full auth immediately after 2FA
    if (response.skipPin && response.sessionToken && response.authToken) {
      await storageService.setItem('authToken', response.authToken);
      await storageService.setItem('sessionToken', response.sessionToken);

      store.dispatch(sessionActions.setAuthToken({
        authToken: response.authToken,
        requirePin: false
      }));

      store.dispatch(sessionActions.setSessionToken({
        sessionToken: response.sessionToken,
        expiresIn: response.expiresIn ?? 0,
        user: response.user ?? {}
      }));

      if (response.user) {
        store.dispatch(sessionActions.updateUser(response.user));
        await this.persistUserProfile(response.user);
      }

      return response;
    }

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

    // 2FA required for this device
    if (response.requiresTwoFactor && response.loginToken) {
      store.dispatch(sessionActions.setLogin2FARequired({
        loginToken: response.loginToken,
        methods: response.twoFactorMethods || { totp: false, email: false },
      }));
      return response;
    }

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
          user: response.user ?? {}
        }));

        if (response.user) {
          store.dispatch(sessionActions.updateUser(response.user));
          await this.persistUserProfile(response.user);
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
        await this.persistUserProfile(response.user);
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

      if (response.user) {
        await this.persistUserProfile(response.user);
      }
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

      if (response.user) {
        await this.persistUserProfile(response.user);
      }
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
    const { sessionToken, authToken } = store.getState().session;

    await storageService.removeItem('authToken');
    await storageService.removeItem('sessionToken');
    await storageService.removeItem('userProfile');

    // Always try API logout to delete TrustedDevice.
    // Use sessionToken if available, otherwise fallback to authToken (standby case).
    const token = sessionToken || authToken;
    if (token) {
      try {
        await authApiService.logout(sessionToken ? undefined : authToken ?? undefined);
      } catch {
        // Proceed with local cleanup even if API call fails
      }
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
      const authToken = state.session.authToken;

      // Only check for quick-created users (with skipPinRequired flag)
      if (!user || !user.skipPinRequired || !authToken) {
        return true; // Regular users don't need QR token check
      }

      const result = await authApiService.verifyQrToken(authToken);

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

  /**
   * Clear session for standby mode (skipPinRequired users)
   * Same as clearSession but without requiring PIN on unlock
   */
  clearSessionStandby(): void {
    store.dispatch(sessionActions.expireSessionStandby());
  }

  /**
   * Unlock from standby mode
   * Verifies QR token + gets fresh sessionToken for skipPinRequired users
   */
  async unlockStandby(): Promise<boolean> {
    const state = store.getState();
    const authToken = state.session.authToken;

    if (!authToken) return false;

    try {
      const result = await authApiService.unlockStandby(authToken);

      if (!result.valid || !result.sessionToken) {
        await this.logout();
        return false;
      }

      store.dispatch(sessionActions.setSessionToken({
        sessionToken: result.sessionToken,
        expiresIn: result.expiresIn ?? 0,
        user: result.user ?? {}
      }));

      if (result.user) {
        store.dispatch(sessionActions.updateUser(result.user));
        await this.persistUserProfile(result.user);
      }

      return true;
    } catch {
      await this.logout();
      return false;
    }
  }
}

export const sessionService = SessionService.getInstance();