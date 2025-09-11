import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Toast notification type
 */
export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number; // ms
  action?: {
    label: string;
    onPress: () => void;
  };
}

/**
 * Modal configuration
 */
export interface ModalConfig {
  id: string;
  component: string; // Nom du composant modal à afficher
  props?: any; // Props à passer au modal
  onClose?: () => void;
}

/**
 * État UI pur : modals, toasts, sidebar, etc.
 * Ne contient QUE des éléments d'interface, pas de données métier
 */
export interface UiState {
  // Sidebar / Navigation drawer
  isSidebarOpen: boolean;
  
  // Modals
  activeModal: ModalConfig | null;
  modalStack: ModalConfig[]; // Pour les modals empilés
  
  // Toasts / Notifications
  toasts: Toast[];
  
  // Loading states globaux
  isGlobalLoading: boolean;
  globalLoadingMessage?: string;
  
  // Thème (si applicable)
  theme: 'light' | 'dark' | 'auto';
  
  // Préférences UI
  preferences: {
    compactMode: boolean;
    showAnimations: boolean;
    soundEnabled: boolean;
    hapticEnabled: boolean;
  };
  
  // États de formulaires globaux (optionnel)
  isDirty: boolean; // Formulaire modifié non sauvegardé
  
  // États de focus (pour accessibilité)
  focusedElement?: string;
}

// État initial
const initialState: UiState = {
  isSidebarOpen: false,
  activeModal: null,
  modalStack: [],
  toasts: [],
  isGlobalLoading: false,
  globalLoadingMessage: undefined,
  theme: 'auto',
  preferences: {
    compactMode: false,
    showAnimations: true,
    soundEnabled: true,
    hapticEnabled: true,
  },
  isDirty: false,
  focusedElement: undefined,
};

/**
 * Slice UI pour l'état de l'interface utilisateur
 */
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // === SIDEBAR ===
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    
    openSidebar: (state) => {
      state.isSidebarOpen = true;
    },
    
    closeSidebar: (state) => {
      state.isSidebarOpen = false;
    },
    
    // === MODALS ===
    showModal: (state, action: PayloadAction<ModalConfig>) => {
      // Si un modal est déjà actif, l'ajouter à la pile
      if (state.activeModal) {
        state.modalStack.push(state.activeModal);
      }
      state.activeModal = action.payload;
    },
    
    hideModal: (state) => {
      // Si des modals sont dans la pile, en restaurer un
      if (state.modalStack.length > 0) {
        state.activeModal = state.modalStack.pop() || null;
      } else {
        state.activeModal = null;
      }
    },
    
    hideAllModals: (state) => {
      state.activeModal = null;
      state.modalStack = [];
    },
    
    updateModalProps: (state, action: PayloadAction<{ id: string; props: any }>) => {
      if (state.activeModal?.id === action.payload.id) {
        state.activeModal.props = { 
          ...state.activeModal.props, 
          ...action.payload.props 
        };
      }
    },
    
    // === TOASTS ===
    addToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
      const toast: Toast = {
        ...action.payload,
        id: `toast-${Date.now()}-${Math.random()}`,
        duration: action.payload.duration || 3000,
      };
      state.toasts.push(toast);
    },
    
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter(t => t.id !== action.payload);
    },
    
    clearToasts: (state) => {
      state.toasts = [];
    },
    
    // === LOADING ===
    setGlobalLoading: (state, action: PayloadAction<{ 
      loading: boolean; 
      message?: string 
    }>) => {
      state.isGlobalLoading = action.payload.loading;
      state.globalLoadingMessage = action.payload.message;
    },
    
    // === THEME ===
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'auto'>) => {
      state.theme = action.payload;
    },
    
    // === PREFERENCES ===
    updatePreferences: (state, action: PayloadAction<Partial<UiState['preferences']>>) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    
    toggleCompactMode: (state) => {
      state.preferences.compactMode = !state.preferences.compactMode;
    },
    
    toggleAnimations: (state) => {
      state.preferences.showAnimations = !state.preferences.showAnimations;
    },
    
    toggleSound: (state) => {
      state.preferences.soundEnabled = !state.preferences.soundEnabled;
    },
    
    toggleHaptic: (state) => {
      state.preferences.hapticEnabled = !state.preferences.hapticEnabled;
    },
    
    // === FORM STATE ===
    setFormDirty: (state, action: PayloadAction<boolean>) => {
      state.isDirty = action.payload;
    },
    
    // === FOCUS ===
    setFocusedElement: (state, action: PayloadAction<string | undefined>) => {
      state.focusedElement = action.payload;
    },
    
    // === RESET ===
    resetUi: () => initialState,
    
    resetUiState: () => initialState, // Alias pour compatibilité
  },
});

// Export des actions
export const uiActions = uiSlice.actions;

// Export du reducer
export default uiSlice.reducer;

// === SELECTORS ===
import { RootState } from '../index';

// Sidebar
export const selectIsSidebarOpen = (state: RootState) => state.ui.isSidebarOpen;

// Modals
export const selectActiveModal = (state: RootState) => state.ui.activeModal;
export const selectModalStack = (state: RootState) => state.ui.modalStack;
export const selectHasModal = (state: RootState) => state.ui.activeModal !== null;

// Toasts
export const selectToasts = (state: RootState) => state.ui.toasts;
export const selectHasToasts = (state: RootState) => state.ui.toasts.length > 0;

// Loading
export const selectIsGlobalLoading = (state: RootState) => state.ui.isGlobalLoading;
export const selectGlobalLoadingMessage = (state: RootState) => state.ui.globalLoadingMessage;

// Theme
export const selectTheme = (state: RootState) => state.ui.theme;

// Preferences
export const selectUiPreferences = (state: RootState) => state.ui.preferences;
export const selectIsCompactMode = (state: RootState) => state.ui.preferences.compactMode;
export const selectShowAnimations = (state: RootState) => state.ui.preferences.showAnimations;
export const selectSoundEnabled = (state: RootState) => state.ui.preferences.soundEnabled;
export const selectHapticEnabled = (state: RootState) => state.ui.preferences.hapticEnabled;

// Form
export const selectIsFormDirty = (state: RootState) => state.ui.isDirty;

// Focus
export const selectFocusedElement = (state: RootState) => state.ui.focusedElement;