// Types pour la gestion des QR codes utilisateur côté API

import { UserProfile } from "./user.types";

export interface UserQrTokenResponse {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    profil: string;
  };
  qrData: {
    token: string;
    app: string;
  };
  createdAt: string;
}

// New QR Login Response aligned with standard login flow
export interface QRLoginResponse {
  requirePinSetup?: boolean;        // True if user needs to create PIN for first time
  requirePinVerification?: boolean;  // True if user needs to verify existing PIN
  authToken: string;                 // JWT 1 year for PIN verification only
  message: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profil: UserProfile;
    accountId: string;
  };
}

// Legacy - can be removed after migration
export interface AuthToken {
  abilities: string[];
  expiresAt: string; // ISO date string
  lastUsedAt: string | null;
  name: string;
  token: string;
  type: "bearer";
}

export interface User {
  accountId: string;
  email: string;
  firstName: string;
  id: string;
  lastName: string;
  profil: UserProfile
}