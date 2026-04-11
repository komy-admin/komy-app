export type AccountConfig = {
  id: string;
  accountName: string;
  reminderNotificationsEnabled: boolean;
  reminderMinutes: number;
  teamEnabled: boolean;
  kitchenEnabled: boolean;
  barEnabled: boolean;
  roomEnabled: boolean;
  // 2FA
  twoFactorEnabled: boolean;
  twoFactorMethod: string | null;
  createdAt: string;
  updatedAt: string;
};
