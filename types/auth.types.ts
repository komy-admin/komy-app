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

// Updated for new dual token system
export interface LoginResponse {
  requirePin?: boolean;
  requirePinSetup?: boolean;  // True if user needs to create PIN for first time
  authToken?: string;  // Long-lived token (1 year) for PIN verification only
  message: string;
  // 2FA login flow
  requiresTwoFactor?: boolean;
  twoFactorMethods?: { totp: boolean; email: boolean };
  loginToken?: string;  // Short-lived token for 2FA verification
}

export interface PinVerificationResponse {
  sessionToken: string;  // Short-lived token (4h) for API access
  expiresIn: number;     // Seconds until expiration (14400 = 4h)
  user: User;
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

export interface Setup2FAResponse {
  secret?: string;
  qrCodeUrl?: string;
  message: string;
}

export interface Enable2FAResponse {
  message: string;
}

export interface TrustedDevice {
  id: string;
  deviceFingerprint: string;
  deviceName: string | null;
  devicePlatform: string | null;
  lastIp: string | null;
  lastUsedAt: string | null;
  isActive: boolean;
  createdAt: string;
  user?: { id: string; firstName: string | null; lastName: string | null; profil: string };
}

