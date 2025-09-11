import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '~/types/user.types';

/**
 * État de session : authentification, navigation et contexte utilisateur
 * Remplace auth.slice.ts et parties navigation de ui.slice.ts
 */
export interface SessionState {
  // Authentification
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  
  // Navigation
  currentRoomId: string | null;
  selectedTableId: string | null;
  
  // Connexion WebSocket
  isWebSocketConnected: boolean;
  lastSyncTime: number | null;
  
  // État de chargement
  isLoggingIn: boolean;
  isLoggingOut: boolean;
  authError: string | null;
}

// État initial
const initialState: SessionState = {
  // Auth
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  
  // Navigation
  currentRoomId: null,
  selectedTableId: null,
  
  // WebSocket
  isWebSocketConnected: false,
  lastSyncTime: null,
  
  // Loading states
  isLoggingIn: false,
  isLoggingOut: false,
  authError: null,
};

/**
 * Slice de session pour auth et navigation
 */
const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    // === AUTHENTIFICATION ===
    loginStart: (state) => {
      state.isLoggingIn = true;
      state.authError = null;
    },
    
    loginSuccess: (state, action: PayloadAction<{
      user: User;
      token: string;
      refreshToken?: string;
    }>) => {
      const { user, token, refreshToken } = action.payload;
      state.user = user;
      state.token = token;
      state.refreshToken = refreshToken || null;
      state.isAuthenticated = true;
      state.isLoggingIn = false;
      state.authError = null;
    },
    
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoggingIn = false;
      state.authError = action.payload;
      state.isAuthenticated = false;
    },
    
    logout: (state) => {
      // Reset auth
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.authError = null;
      
      // Reset navigation
      state.currentRoomId = null;
      state.selectedTableId = null;
      
      // Reset WebSocket
      state.isWebSocketConnected = false;
      state.lastSyncTime = null;
    },
    
    updateToken: (state, action: PayloadAction<{ 
      token: string; 
      refreshToken?: string 
    }>) => {
      state.token = action.payload.token;
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken;
      }
    },
    
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    
    // === NAVIGATION ===
    setCurrentRoom: (state, action: PayloadAction<string | null>) => {
      state.currentRoomId = action.payload;
      // Reset la table sélectionnée quand on change de salle
      if (action.payload !== state.currentRoomId) {
        state.selectedTableId = null;
      }
    },
    
    setSelectedTable: (state, action: PayloadAction<string | null>) => {
      state.selectedTableId = action.payload;
    },
    
    resetNavigation: (state) => {
      state.currentRoomId = null;
      state.selectedTableId = null;
    },
    
    // === WEBSOCKET ===
    setWebSocketConnected: (state, action: PayloadAction<boolean>) => {
      state.isWebSocketConnected = action.payload;
      if (action.payload) {
        state.lastSyncTime = Date.now();
      }
    },
    
    updateLastSyncTime: (state) => {
      state.lastSyncTime = Date.now();
    },
    
    setConnected: (state, action: PayloadAction<boolean>) => {
      // Alias pour compatibilité
      state.isWebSocketConnected = action.payload;
      if (action.payload) {
        state.lastSyncTime = Date.now();
      }
    },
    
    // === RESET ===
    resetSession: () => initialState,
  },
});

// Export des actions
export const sessionActions = sessionSlice.actions;

// Export du reducer
export default sessionSlice.reducer;

// === SELECTORS ===
import { RootState } from '../index';
import { createSelector } from '@reduxjs/toolkit';

// Auth selectors
export const selectCurrentUser = (state: RootState) => state.session.user;
export const selectAuthToken = (state: RootState) => state.session.token;
export const selectIsAuthenticated = (state: RootState) => state.session.isAuthenticated;
export const selectIsLoggingIn = (state: RootState) => state.session.isLoggingIn;
export const selectAuthError = (state: RootState) => state.session.authError;

// Navigation selectors
export const selectCurrentRoomId = (state: RootState) => state.session.currentRoomId;
export const selectSelectedTableId = (state: RootState) => state.session.selectedTableId;

// Current room selector (combines session and entities)
export const selectCurrentRoom = createSelector(
  [(state: RootState) => state.session.currentRoomId, (state: RootState) => state.entities.rooms],
  (currentRoomId, rooms) => currentRoomId ? rooms[currentRoomId] : null
);

// WebSocket selectors
export const selectIsWebSocketConnected = (state: RootState) => state.session.isWebSocketConnected;
export const selectLastSyncTime = (state: RootState) => state.session.lastSyncTime;

// Alias pour compatibilité
export const selectIsConnected = selectIsWebSocketConnected;