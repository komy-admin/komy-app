import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ConfigState {
  // Configuration modulaire
  configId: string; // ID de la config pour les updates
  reminderMinutes: number;
  reminderNotificationsEnabled: boolean;
  // Données d'exécution des alertes
  overdueOrderIds: string[];
  overdueOrderItemIds: string[];
  lastAlertCheck: number;
  triggerAlertCheck: number; // Timestamp pour déclencher une vérification
}

const initialState: ConfigState = {
  configId: '',
  reminderMinutes: 15,
  reminderNotificationsEnabled: false,
  overdueOrderIds: [],
  overdueOrderItemIds: [],
  lastAlertCheck: Date.now(),
  triggerAlertCheck: 0,
};

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    setReminderConfig: (state, action: PayloadAction<{configId: string, reminderMinutes: number, reminderNotificationsEnabled: boolean}>) => {
      state.configId = action.payload.configId;
      state.reminderMinutes = action.payload.reminderMinutes;
      state.reminderNotificationsEnabled = action.payload.reminderNotificationsEnabled;
    },
    setOverdueOrders: (state, action: PayloadAction<string[]>) => {
      state.overdueOrderIds = action.payload;
    },
    setOverdueOrderItems: (state, action: PayloadAction<string[]>) => {
      state.overdueOrderItemIds = action.payload;
    },
    addOverdueOrder: (state, action: PayloadAction<string>) => {
      if (!state.overdueOrderIds.includes(action.payload)) {
        state.overdueOrderIds.push(action.payload);
      }
    },
    removeOverdueOrder: (state, action: PayloadAction<string>) => {
      state.overdueOrderIds = state.overdueOrderIds.filter(id => id !== action.payload);
    },
    updateLastAlertCheck: (state) => {
      state.lastAlertCheck = Date.now();
    },
    triggerAlertCheck: (state) => {
      state.triggerAlertCheck = Date.now();
    },
  },
});

export const {
  setReminderConfig,
  setOverdueOrders,
  setOverdueOrderItems,
  addOverdueOrder,
  removeOverdueOrder,
  updateLastAlertCheck,
  triggerAlertCheck,
} = configSlice.actions;

export default configSlice.reducer;