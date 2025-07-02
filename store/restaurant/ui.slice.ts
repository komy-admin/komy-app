import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { User } from '~/types/user.types';

// Types pour le state de l'interface
export interface UiState {
  users: Record<string, User>;
  isConnected: boolean;
  lastSyncTime: number | null;
  loadingState: {
    rooms: boolean;
    tables: boolean;
    orders: boolean;
    menu: boolean;
    users: boolean;
  };
  errors: {
    rooms: string | null;
    tables: string | null;
    orders: string | null;
    menu: string | null;
    users: string | null;
  };
}

// État initial
const initialState: UiState = {
  users: {},
  isConnected: false,
  lastSyncTime: null,
  loadingState: {
    rooms: false,
    tables: false,
    orders: false,
    menu: false,
    users: false,
  },
  errors: {
    rooms: null,
    tables: null,
    orders: null,
    menu: null,
    users: null,
  },
};

// Types pour les actions
interface SetUsersPayload {
  users: User[];
}

interface SetLoadingPayload {
  domain: keyof UiState['loadingState'];
  loading: boolean;
}

interface SetErrorPayload {
  domain: keyof UiState['errors'];
  error: string;
}

// Slice pour l'interface utilisateur
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Actions de connexion
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
      if (action.payload) {
        state.lastSyncTime = Date.now();
      }
    },
    
    updateLastSyncTime: (state) => {
      state.lastSyncTime = Date.now();
    },
    
    // Actions de chargement génériques
    setLoading: (state, action: PayloadAction<SetLoadingPayload>) => {
      const { domain, loading } = action.payload;
      state.loadingState[domain] = loading;
      if (loading && state.errors[domain]) {
        state.errors[domain] = null;
      }
    },
    
    setError: (state, action: PayloadAction<SetErrorPayload>) => {
      const { domain, error } = action.payload;
      state.errors[domain] = error;
      state.loadingState[domain] = false;
    },
    
    clearError: (state, action: PayloadAction<keyof UiState['errors']>) => {
      state.errors[action.payload] = null;
    },
    
    clearAllErrors: (state) => {
      Object.keys(state.errors).forEach(key => {
        state.errors[key as keyof UiState['errors']] = null;
      });
    },
    
    // Actions pour les utilisateurs
    setUsers: (state, action: PayloadAction<SetUsersPayload>) => {
      const { users } = action.payload;
      
      // Normaliser les users
      state.users = {};
      users.forEach(user => {
        state.users[user.id] = user;
      });
    },
    
    // Actions WebSocket CRUD pour les users
    createUser: (state, action: PayloadAction<{ user: User }>) => {
      const { user } = action.payload;
      state.users[user.id] = user;
    },
    
    updateUser: (state, action: PayloadAction<{ user: User }>) => {
      const { user } = action.payload;
      state.users[user.id] = user;
    },
    
    deleteUser: (state, action: PayloadAction<{ userId: string }>) => {
      const { userId } = action.payload;
      delete state.users[userId];
    },
    
    // Action pour nettoyer l'état
    resetUiState: () => initialState,
  },
});

// Selectors de base
const selectUiState = (state: { ui: UiState }) => state.ui;

export const selectAllUsers = createSelector(
  [selectUiState],
  (uiState) => uiState ? Object.values(uiState.users) : []
);

export const selectUserById = (userId: string) => createSelector(
  [selectUiState],
  (uiState) => uiState?.users[userId] || null
);

export const selectIsConnected = createSelector(
  [selectUiState],
  (uiState) => uiState?.isConnected || false
);

export const selectLastSyncTime = createSelector(
  [selectUiState],
  (uiState) => uiState?.lastSyncTime || null
);

export const selectLoadingState = createSelector(
  [selectUiState],
  (uiState) => uiState?.loadingState || initialState.loadingState
);

export const selectIsLoading = createSelector(
  [selectLoadingState],
  (loadingState) => Object.values(loadingState).some(loading => loading)
);

export const selectErrors = createSelector(
  [selectUiState],
  (uiState) => uiState?.errors || initialState.errors
);

export const selectHasErrors = createSelector(
  [selectErrors],
  (errors) => Object.values(errors).some(error => error !== null)
);

export const selectErrorByDomain = (domain: keyof UiState['errors']) => createSelector(
  [selectUiState],
  (uiState) => uiState?.errors[domain] || null
);

export const selectLoadingByDomain = (domain: keyof UiState['loadingState']) => createSelector(
  [selectUiState],
  (uiState) => uiState?.loadingState[domain] || false
);

// Actions exportées
export const uiActions = uiSlice.actions;
export default uiSlice.reducer;

// Types exportés
export type {
  SetUsersPayload,
  SetLoadingPayload,
  SetErrorPayload,
};