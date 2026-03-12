// Mode de vue : colonnes ou tickets
export type ViewMode = 'columns' | 'tickets';

export type AccountConfig = {
  id: string;
  reminderNotificationsEnabled: boolean;
  reminderMinutes: number;
  teamEnabled: boolean;
  kitchenEnabled: boolean;
  barEnabled: boolean;
  // View modes
  kitchenViewMode: ViewMode;
  barViewMode: ViewMode;
  // 2FA
  twoFactorEnabled: boolean;
  twoFactorMethod: string | null;
  createdAt: string;
  updatedAt: string;
};