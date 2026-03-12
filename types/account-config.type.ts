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
  // Device trust
  deviceTrustEnabled: boolean;
  deviceTrustMethod: string | null;
  createdAt: string;
  updatedAt: string;
};