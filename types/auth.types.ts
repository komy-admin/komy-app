import { User } from "./user.types";

export interface LoginCredentials {
  loginId: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  firstName?: string;
  lastName?: string;
}

export interface ForgotCredentials {
  email: string;
}

export interface ResetCredentials {
  token: string;
  password: string;
}

export interface SetupAccountCredentials {
  token: string;
  password: string;
  pin: string;
}

export interface SetPinCredentials {
  pin: string;
}

export interface VerifyPinCredentials {
  pin: string;
  // userId removed - now extracted from authToken
}

// Updated for new dual token system
export interface LoginResponse {
  requirePin?: boolean;
  requirePinSetup?: boolean;  // True if user needs to create PIN for first time
  authToken: string;  // Long-lived token (1 year) for PIN verification only
  message: string;
}

export interface PinVerificationResponse {
  sessionToken: string;  // Short-lived token (4h) for API access
  expiresIn: number;     // Seconds until expiration (14400 = 4h)
  user: User;
}

export interface PinErrorResponse {
  message: string;
  attemptsRemaining?: number;
  error?: string;
  code?: 'ACCOUNT_LOCKED' | 'INVALID_PIN' | 'SESSION_TOKEN_INVALID' | 'AUTH_TOKEN_INVALID';
  remainingMinutes?: number;
}

// Keep for backward compatibility
export interface PinLoginResponse {
  requirePin?: boolean;
  requirePinSetup?: boolean;
  temporaryToken?: { token: string; expiresIn?: number };
  userId?: string;
  message?: string;
  authToken?: string;  // New field
}

// Single, clear interface for authentication responses
export interface AuthResponse extends User {
  token: {
    token: string;
    refreshToken?: string;
  };
  requirePin?: boolean;
  requirePinSetup?: boolean;
  temporaryToken?: { token: string; expiresIn?: number };
  userId?: string;
  message?: string;
  authToken?: string;
}

export interface currentUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: number;
  createdAt: string;
  updatedAt: string;
  profil?: string;
  accountId?: string;
  loginId?: string;
  hasPinConfigured?: boolean;
}