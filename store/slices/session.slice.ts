import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { User } from '~/types/user.types';
import { storageService } from '~/lib/storageService';
import { uploadProfileImage } from '../thunks/uploadProfileImage.thunk';

// Types pour les payloads des actions
interface AccountConfigPayload {
  id: string;
  reminderMinutes: number;
  reminderNotificationsEnabled: boolean;
  teamEnabled: boolean;
  kitchenEnabled: boolean;
  barEnabled: boolean;
}

// Utilitaire pour les timestamps
const getCurrentTimestamp = () => Date.now();

/**
 * État de session : authentification, navigation et contexte utilisateur
 * Remplace auth.slice.ts et parties navigation de ui.slice.ts
 */
export interface SessionState {
  // Dual Token System
  authToken: string | null;       // Long-lived token (1 year) - stored in AsyncStorage
  sessionToken: string | null;    // Short-lived token (4h) - memory only
  sessionExpiresAt: string | null; // ISO string - When sessionToken expires

  // User
  user: User | null;
  isAuthenticated: boolean;       // true when sessionToken is valid

  // PIN Authentication
  requiresPin: boolean;
  requiresPinSetup: boolean;
  temporaryToken: string | null;
  isPinVerified: boolean;

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
  isLoading: boolean;
  error: string | null;

  // Flags d'initialisation
  authInitialized: boolean;
  appInitialized: boolean;
  isAppInitializing: boolean; // Flag pour l'état de chargement
  initializationProgress: Record<string, boolean>; // Progression de l'initialisation
  isFinalizingStage: boolean; // Phase de finalisation
  finalizationProgress: number; // Progression de finalisation (0-100)

  // Account Config
  accountConfig: {
    id: string;
    reminderMinutes: number;
    reminderNotificationsEnabled: boolean;
    teamEnabled: boolean;
    kitchenEnabled: boolean;
    barEnabled: boolean;
  } | null;
  overdueOrderIds: string[];
  overdueOrderItemIds: string[];
  lastAlertCheck: number;
  triggerAlertCheck: number;
}

/**
 * Thunk asynchrone pour la déconnexion complète
 * Nettoie le store ET le localStorage
 */
export const logout = createAsyncThunk(
  'session/logout',
  async () => {
    try {
      // Remove authToken from storage (dual token system)
      await storageService.removeItem('authToken');
      // TODO [legacy]: Remove the following legacy cleanup once dual token migration is complete (Q1 2025)
      await storageService.removeItem('token');
      await storageService.removeItem('userProfile');
    } catch (error) {
      // Storage cleanup errors are non-critical, but log for debugging purposes
      console.error('Error during storage cleanup in logout:', error);
    }
  }
);

// État initial
const initialState: SessionState = {
  // Dual Token System
  authToken: null,
  sessionToken: null,
  sessionExpiresAt: null,

  // User
  user: null,
  isAuthenticated: false,

  // PIN
  requiresPin: false,
  requiresPinSetup: false,
  temporaryToken: null,
  isPinVerified: false,

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
  isLoading: false,
  error: null,

  // Initialization flags
  authInitialized: false,
  appInitialized: false,
  isAppInitializing: false,
  initializationProgress: {},
  isFinalizingStage: false,
  finalizationProgress: 0,

  // Account Config
  accountConfig: null,
  overdueOrderIds: [],
  overdueOrderItemIds: [],
  lastAlertCheck: getCurrentTimestamp(),
  triggerAlertCheck: 0,
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
    
    // Called after successful email/password login
    setAuthToken: (state, action: PayloadAction<{
      authToken: string;
      requirePin: boolean;
    }>) => {
      state.authToken = action.payload.authToken;
      state.requiresPin = action.payload.requirePin;
      state.isLoggingIn = false;
      state.authError = null;
      // Don't set authenticated yet - need PIN verification
      state.isAuthenticated = false;
      state.isPinVerified = false;
    },

    // Called after successful PIN verification
    setSessionToken: (state, action: PayloadAction<{
      sessionToken: string;
      expiresIn: number;
      user: Partial<User>;
    }>) => {
      const { sessionToken, expiresIn, user } = action.payload;
      state.sessionToken = sessionToken;
      state.sessionExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
      state.user = { ...state.user, ...user } as User;
      state.isAuthenticated = true;
      state.requiresPin = false;
      state.isPinVerified = true;
    },

    // Clear session token (but keep authToken)
    clearSessionToken: (state) => {
      state.sessionToken = null;
      state.sessionExpiresAt = null;
      state.isAuthenticated = false;
      state.isPinVerified = false;
      state.requiresPin = true;  // Need PIN again
    },

    // Legacy - kept for compatibility, will be removed
    loginSuccess: (state, action: PayloadAction<{
      user: User;
      token: string;
      refreshToken?: string;
    }>) => {
      // For now, map to sessionToken for backward compatibility
      const { user, token } = action.payload;
      state.user = user;
      state.sessionToken = token;
      state.isAuthenticated = true;
      state.isLoggingIn = false;
      state.authError = null;
      state.requiresPin = false;
      state.requiresPinSetup = false;
      state.isPinVerified = true;
      state.temporaryToken = null;
    },

    // Called when app starts with stored authToken
    setStoredAuthToken: (state, action: PayloadAction<{
      authToken: string;
    }>) => {
      state.authToken = action.payload.authToken;
      state.requiresPin = true;
      state.isAuthenticated = false;
      state.isPinVerified = false;
      state.isLoggingIn = false;
    },
    
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoggingIn = false;
      state.authError = action.payload;
      state.isAuthenticated = false;
    },
    
    // Update session expiration
    updateSessionExpiration: (state, action: PayloadAction<number>) => {
      state.sessionExpiresAt = new Date(Date.now() + action.payload * 1000).toISOString();
    },
    
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },

    // === PIN AUTHENTICATION ===
    setPinRequired: (state, action: PayloadAction<{
      requirePin?: boolean;
      requirePinSetup?: boolean;
      temporaryToken?: string;
    }>) => {
      state.requiresPin = action.payload.requirePin || false;
      state.requiresPinSetup = action.payload.requirePinSetup || false;
      state.temporaryToken = action.payload.temporaryToken || null;
      state.isPinVerified = false;
    },

    setPinVerified: (state, action: PayloadAction<boolean>) => {
      state.isPinVerified = action.payload;
      if (action.payload) {
        state.requiresPin = false;
        state.requiresPinSetup = false;
        state.temporaryToken = null;
        // Mark as authenticated when PIN is verified and we have a sessionToken
        state.isAuthenticated = !!state.sessionToken && !!state.user;
      }
    },

    clearPinState: (state) => {
      state.requiresPin = false;
      state.requiresPinSetup = false;
      state.temporaryToken = null;
      state.isPinVerified = false;
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
        state.lastSyncTime = getCurrentTimestamp();
      }
    },

    updateLastSyncTime: (state) => {
      state.lastSyncTime = getCurrentTimestamp();
    },

    // Alias pour compatibilité
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isWebSocketConnected = action.payload;
      if (action.payload) {
        state.lastSyncTime = getCurrentTimestamp();
      }
    },
    
    // === ACCOUNT CONFIG ===
    setAccountConfig: (state, action: PayloadAction<AccountConfigPayload>) => {
      state.accountConfig = action.payload;
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
      state.lastAlertCheck = getCurrentTimestamp();
    },
    
    triggerAlertCheck: (state) => {
      state.triggerAlertCheck = getCurrentTimestamp();
    },

    // === INITIALIZATION FLAGS ===
    setAuthInitialized: (state, action: PayloadAction<boolean>) => {
      state.authInitialized = action.payload;
    },

    setAppInitialized: (state, action: PayloadAction<boolean>) => {
      state.appInitialized = action.payload;
    },

    setAppInitializing: (state, action: PayloadAction<boolean>) => {
      state.isAppInitializing = action.payload;
      // Reset progression quand on commence/arrête
      if (action.payload) {
        state.initializationProgress = {};
        state.isFinalizingStage = false;
        state.finalizationProgress = 0;
      }
    },

    setInitializationProgress: (state, action: PayloadAction<{ key: string; value: boolean }>) => {
      state.initializationProgress[action.payload.key] = action.payload.value;
    },

    setFinalizingStage: (state, action: PayloadAction<boolean>) => {
      state.isFinalizingStage = action.payload;
    },

    setFinalizationProgress: (state, action: PayloadAction<number>) => {
      state.finalizationProgress = action.payload;
    },

    // === ERROR HANDLING ===
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // === RESET ===
    resetSession: () => {
      // Clear all session state
      return initialState;
    },

    // Logout - clear everything including authToken
    logout: () => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(logout.fulfilled, () => {
        return initialState;
      })
      // Upload profile image
      .addCase(uploadProfileImage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(uploadProfileImage.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isLoading = false;
      })
      .addCase(uploadProfileImage.rejected, (state, action) => {
        state.error = action.payload || 'Upload failed';
        state.isLoading = false;
      });
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
export const selectAuthToken = (state: RootState) => state.session.authToken;
export const selectSessionToken = (state: RootState) => state.session.sessionToken;
export const selectSessionExpiresAt = (state: RootState) => state.session.sessionExpiresAt;
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

// Initialization selectors
export const selectAuthInitialized = (state: RootState) => state.session.authInitialized;
export const selectAppInitialized = (state: RootState) => state.session.appInitialized;
export const selectIsAppInitializing = (state: RootState) => state.session.isAppInitializing;
export const selectInitializationProgress = (state: RootState) => state.session.initializationProgress;
export const selectIsFinalizingStage = (state: RootState) => state.session.isFinalizingStage;
export const selectFinalizationProgress = (state: RootState) => state.session.finalizationProgress;

// Sélecteur mémorisé pour le pourcentage de progression total
export const selectProgressPercentage = createSelector(
  [selectInitializationProgress, selectIsFinalizingStage, selectFinalizationProgress],
  (progress, isFinalizingStage, finalizationProgress) => {
    const totalSteps = 8; // nombre d'étapes définies
    const completed = Object.values(progress).filter(Boolean).length;
    const baseProgress = Math.round((completed / totalSteps) * 90);

    if (isFinalizingStage) {
      return Math.min(90 + Math.round(finalizationProgress * 0.1), 100);
    }

    return baseProgress;
  }
);
// PIN selectors
export const selectRequiresPin = (state: RootState) => state.session.requiresPin;
export const selectRequiresPinSetup = (state: RootState) => state.session.requiresPinSetup;
export const selectTemporaryToken = (state: RootState) => state.session.temporaryToken;
export const selectIsPinVerified = (state: RootState) => state.session.isPinVerified;

// Alias pour compatibilité
export const selectIsConnected = selectIsWebSocketConnected;