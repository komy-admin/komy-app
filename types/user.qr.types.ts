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

export interface QRLoginResponse {
  qrTokenId: string;
  token: AuthToken;
  user: User;
}

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