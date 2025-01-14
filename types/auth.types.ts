export interface LoginCredentials {
  loginId: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  accountType: any;
  user: currentUser;
  token: { token: string };
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
}