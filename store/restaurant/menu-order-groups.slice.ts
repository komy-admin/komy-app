import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MenuOrderGroup } from '~/types/menu-order-group.types';

export interface MenuOrderGroupsState {
  menuOrderGroups: MenuOrderGroup[];
  isLoading: boolean;
  error: string | null;
}

const initialState: MenuOrderGroupsState = {
  menuOrderGroups: [],
  isLoading: false,
  error: null,
};

const menuOrderGroupsSlice = createSlice({
  name: 'menuOrderGroups',
  initialState,
  reducers: {
    setMenuOrderGroups: (state, action: PayloadAction<MenuOrderGroup[]>) => {
      state.menuOrderGroups = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    addMenuOrderGroup: (state, action: PayloadAction<MenuOrderGroup>) => {
      // 🔧 Éviter les doublons - ne pas ajouter si déjà présent
      const exists = state.menuOrderGroups.some(group => group.id === action.payload.id);
      if (!exists) {
        state.menuOrderGroups.push(action.payload);
      }
    },
    deleteMenuOrderGroup: (state, action: PayloadAction<{ menuOrderGroupId: string }>) => {
      state.menuOrderGroups = state.menuOrderGroups.filter(
        group => group.id !== action.payload.menuOrderGroupId
      );
    },
    deleteMenuOrderGroupWithItems: (state, action: PayloadAction<{ 
      menuOrderGroupId: string, 
      deletedOrderItemIds: number[] 
    }>) => {
      // Supprimer le MenuOrderGroup
      state.menuOrderGroups = state.menuOrderGroups.filter(
        group => group.id !== action.payload.menuOrderGroupId
      );
      // Note: Les OrderItems sont gérés dans le slice orders, pas ici
      // Cette action est principalement pour la cohérence sémantique
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

// Actions groupées (comme les autres slices)
export const menuOrderGroupsActions = menuOrderGroupsSlice.actions;

// Actions individuelles pour rétrocompatibilité
export const { 
  setMenuOrderGroups, 
  addMenuOrderGroup, 
  deleteMenuOrderGroup,
  setLoading, 
  setError, 
  clearError 
} = menuOrderGroupsSlice.actions;

// Sélecteurs de base
export const selectAllMenuOrderGroups = (state: { menuOrderGroups: MenuOrderGroupsState }) => 
  state.menuOrderGroups.menuOrderGroups;

export const selectMenuOrderGroupsLoading = (state: { menuOrderGroups: MenuOrderGroupsState }) => 
  state.menuOrderGroups.isLoading;

export const selectMenuOrderGroupsError = (state: { menuOrderGroups: MenuOrderGroupsState }) => 
  state.menuOrderGroups.error;

export default menuOrderGroupsSlice.reducer;