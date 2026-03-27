import axios, { AxiosInstance } from "axios";
import { Platform } from "react-native";
import { StorageInterface, storageService } from "~/lib/storageService";
import { getDeviceId } from "~/lib/deviceId";
import { getDeviceInfoJson } from "~/lib/deviceInfo";
import { store, logout, sessionActions } from "~/store";
import { globalToast } from "~/components/ToastProvider";

/** Codes 401 indiquant une expiration de session (envoyés par auth_middleware backend) */
const SESSION_EXPIRY_CODES = ['UNAUTHORIZED', 'TOKEN_INVALID_OR_EXPIRED', 'SESSION_EXPIRED'];

/** Erreur silencieuse : les catch blocks la propagent mais aucun toast n'est affiché */
export class SessionExpiredError extends Error {
  readonly silent = true;
  constructor() { super('Session expired'); }
}

/** Flag anti-rebond : évite N dispatches si N requêtes parallèles reçoivent 401 */
let isSessionClearing = false;

const DEV_API_URL = Platform.select({
  android: `${process.env.EXPO_PUBLIC_API_URL}/api`,
  ios: `${process.env.EXPO_PUBLIC_API_URL}/api`,
  web: `${process.env.EXPO_PUBLIC_API_URL}/api`,
});
export abstract class BaseApiService<T> {
  protected abstract endpoint: string;
  protected axiosInstance: AxiosInstance;
  protected storage: StorageInterface;

  constructor(baseURL: string = 'http://localhost:3333/api') {
    this.axiosInstance = axios.create({
      baseURL: DEV_API_URL ? DEV_API_URL : baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.storage = storageService

    this.axiosInstance.interceptors.request.use(
      async (config) => {
        // Add device ID and device info to all requests
        const deviceId = await getDeviceId();
        if (config.headers) {
          config.headers['X-Device-Id'] = deviceId;
          config.headers['X-Device-Info'] = getDeviceInfoJson();
        }

        // Define endpoint whitelists for robust matching
        const AUTH_ENDPOINTS = [
          '/auth/login',
          '/auth/register',
          '/auth/forgot-password',
          '/auth/reset-password',
          '/auth/qr-login',
          '/auth/setup-account',
          '/auth/verify-login-2fa',
          '/auth/send-login-2fa-email',
        ];

        const PIN_ENDPOINTS = [
          '/auth/verify-pin',
          '/auth/set-pin'
        ];

        // Helper to extract path from config.url
        const getEndpointPath = (url: string | undefined): string => {
          if (!url) return '';
          // Remove query params and base URL if present
          const path = url.split('?')[0];
          // Handle both relative and absolute URLs
          if (path.startsWith('http')) {
            try {
              const urlObj = new URL(path);
              return urlObj.pathname;
            } catch {
              return path;
            }
          }
          return path;
        };

        const endpointPath = getEndpointPath(config.url);

        // Check if this is an auth endpoint (no token needed)
        const isAuthEndpoint = AUTH_ENDPOINTS.some(endpoint => endpointPath.endsWith(endpoint));
        if (isAuthEndpoint) {
          return config;
        }

        // Check if this is a PIN endpoint (authToken handled in specific methods)
        const isPinEndpoint = PIN_ENDPOINTS.some(endpoint => endpointPath.endsWith(endpoint));
        if (isPinEndpoint) {
          // Token is already set in the specific method call
          return config;
        }

        // For all other endpoints, use sessionToken from Redux store
        const state = store.getState();
        const sessionToken = state.session.sessionToken;
        const sessionExpiresAt = state.session.sessionExpiresAt;

        if (sessionToken && sessionExpiresAt) {
          // Check if session is still valid
          if (new Date() < new Date(sessionExpiresAt)) {
            if (config.headers) {
              config.headers.Authorization = `Bearer ${sessionToken}`;
            }
          }
          // If expired, don't set header - let 401 handler deal with it
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle 401 errors
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        const errorCode = error.response?.data?.error?.code || error.response?.data?.code;
        const errorMessage = error.response?.data?.error?.message || error.response?.data?.message;

        if (error.response?.status === 401) {
          // Auth token expired/invalid or device/QR revoked → full logout + redirect login
          if (errorCode === 'AUTH_TOKEN_INVALID' || errorCode === 'AUTH_TOKEN_MISSING'
            || errorCode === 'DEVICE_REVOKED' || errorCode === 'QR_TOKEN_REVOKED') {
            if (!isSessionClearing) {
              isSessionClearing = true;
              store.dispatch(logout());
              globalToast.show(errorMessage, 'error');
              setTimeout(() => { isSessionClearing = false; }, 2000);
            }
            return Promise.reject(new SessionExpiredError());
          }

          // Session expiry → redirect to PIN verification (keep authToken)
          // Only handle if we actually have a session (avoids catching login-2fa token expiry)
          const currentState = store.getState();
          if (SESSION_EXPIRY_CODES.includes(errorCode) && currentState.session.sessionToken) {
            if (!isSessionClearing) {
              isSessionClearing = true;
              store.dispatch(sessionActions.expireSession());
              globalToast.show(errorMessage, 'warning');
              setTimeout(() => { isSessionClearing = false; }, 2000);
            }
            return Promise.reject(new SessionExpiredError());
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async getAll(params?: string): Promise<{ data: T[], meta: any }> {
    const url = `${this.endpoint}${params ? `?${params}` : ''}`;
    const response = await this.axiosInstance.get<{ data: T[], meta: any }>(url);
    return response.data;
  }

  async get(id: string): Promise<T> {
    const response = await this.axiosInstance.get<T>(`${this.endpoint}/${id}`);
    return response.data;
  }

  async create(data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<T> {
    const response = await this.axiosInstance.post<T>(this.endpoint, data);
    return response.data;
  }

  async update(id: string, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<T> {
    const response = await this.axiosInstance.put<T>(`${this.endpoint}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await this.axiosInstance.delete(`${this.endpoint}/${id}`);
  }
}