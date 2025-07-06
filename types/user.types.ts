export enum UserProfile {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  SERVER = 'server',
  CHEF = 'chef'
}

export type User = {
  id: string;
  accountId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profil: UserProfile;
  profileImage?: string | null;
  password: string;
  loginId: string;
};