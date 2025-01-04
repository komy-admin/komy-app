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
  user: User;
  token: { token: string };
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
  updatedAt: string;
}