import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ConfigModule {
  enabled: boolean;
  value: any;
}

interface ConfigState {
  // Configuration modulaire
  alertTimeMinutes: ConfigModule;
  // Données d'exécution des alertes
  overdueOrderIds: string[];
  overdueOrderItemIds: string[];
  lastAlertCheck: number;
  triggerAlertCheck: number; // Timestamp pour déclencher une vérification
}

const initialState: ConfigState = {
  alertTimeMinutes: {
    enabled: false,
    value: 15
  },
  overdueOrderIds: [],
  overdueOrderItemIds: [],
  lastAlertCheck: Date.now(),
  triggerAlertCheck: 0,
};

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    setAlertTimeConfig: (state, action: PayloadAction<{enabled: boolean, value: number}>) => {
      state.alertTimeMinutes = action.payload;
    },
    // Pour compatibilité temporaire avec l'ancien système AsyncStorage
    setAlertTimeValue: (state, action: PayloadAction<number>) => {
      state.alertTimeMinutes.value = action.payload;
      state.alertTimeMinutes.enabled = action.payload > 0;
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
  setAlertTimeConfig,
  setAlertTimeValue,
  setOverdueOrders,
  setOverdueOrderItems,
  addOverdueOrder,
  removeOverdueOrder,
  updateLastAlertCheck,
  triggerAlertCheck,
} = configSlice.actions;

export default configSlice.reducer;