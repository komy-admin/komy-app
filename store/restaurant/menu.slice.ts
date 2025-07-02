import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { Item } from '~/types/item.types';
import { ItemType } from '~/types/item-type.types';

// Types pour le state du menu
export interface MenuState {
  items: Record<string, Item>;
  itemTypes: Record<string, ItemType>;
  loading: boolean;
  error: string | null;
}

// État initial
const initialState: MenuState = {
  items: {},
  itemTypes: {},
  loading: false,
  error: null,
};

// Types pour les actions
interface SetItemsPayload {
  items: Item[];
}

interface SetItemTypesPayload {
  itemTypes: ItemType[];
}

// Slice pour le menu
const menuSlice = createSlice({
  name: 'menu',
  initialState,
  reducers: {
    // Actions de chargement
    setLoadingMenu: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
      if (action.payload) state.error = null;
    },
    
    setErrorMenu: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    
    // Actions pour les données
    setItems: (state, action: PayloadAction<SetItemsPayload>) => {
      const { items } = action.payload;
      
      // Normaliser les items
      state.items = {};
      items.forEach(item => {
        state.items[item.id] = item;
      });
      
      state.loading = false;
      state.error = null;
    },
    
    setItemTypes: (state, action: PayloadAction<SetItemTypesPayload>) => {
      const { itemTypes } = action.payload;
      
      // Normaliser les itemTypes
      state.itemTypes = {};
      itemTypes.forEach(itemType => {
        state.itemTypes[itemType.id] = itemType;
      });
      
      state.loading = false;
      state.error = null;
    },
    
    // Actions WebSocket CRUD pour les items
    createMenuItem: (state, action: PayloadAction<{ item: Item }>) => {
      const { item } = action.payload;
      state.items[item.id] = item;
    },
    
    updateMenuItem: (state, action: PayloadAction<{ item: Item }>) => {
      const { item } = action.payload;
      state.items[item.id] = item;
    },
    
    deleteMenuItem: (state, action: PayloadAction<{ itemId: string }>) => {
      const { itemId } = action.payload;
      delete state.items[itemId];
    },
    
    // Actions WebSocket CRUD pour les itemTypes
    createItemType: (state, action: PayloadAction<{ itemType: ItemType }>) => {
      const { itemType } = action.payload;
      state.itemTypes[itemType.id] = itemType;
    },
    
    updateItemType: (state, action: PayloadAction<{ itemType: ItemType }>) => {
      const { itemType } = action.payload;
      state.itemTypes[itemType.id] = itemType;
    },
    
    deleteItemType: (state, action: PayloadAction<{ itemTypeId: string }>) => {
      const { itemTypeId } = action.payload;
      delete state.itemTypes[itemTypeId];
      
      // Supprimer aussi tous les items de ce type
      Object.keys(state.items).forEach(itemId => {
        if (state.items[itemId].itemType.id === itemTypeId) {
          delete state.items[itemId];
        }
      });
    },
    
    // Action pour nettoyer l'état
    resetMenuState: () => initialState,
  },
});

// Selectors de base
const selectMenuState = (state: { menu: MenuState }) => state.menu;

export const selectAllItems = createSelector(
  [selectMenuState],
  (menuState) => menuState ? Object.values(menuState.items) : []
);

export const selectAllItemTypes = createSelector(
  [selectMenuState],
  (menuState) => menuState ? Object.values(menuState.itemTypes) : []
);

export const selectItemsByType = (itemTypeId: string) => createSelector(
  [selectMenuState],
  (menuState) => {
    if (!menuState) return [];
    return Object.values(menuState.items).filter(item => item.itemType.id === itemTypeId);
  }
);

export const selectItemById = (itemId: string) => createSelector(
  [selectMenuState],
  (menuState) => menuState?.items[itemId] || null
);

export const selectItemTypeById = (itemTypeId: string) => createSelector(
  [selectMenuState],
  (menuState) => menuState?.itemTypes[itemTypeId] || null
);

export const selectMenuLoading = createSelector(
  [selectMenuState],
  (menuState) => menuState?.loading || false
);

export const selectMenuError = createSelector(
  [selectMenuState],
  (menuState) => menuState?.error || null
);

// Actions exportées
export const menuActions = menuSlice.actions;
export default menuSlice.reducer;

// Types exportés
export type {
  SetItemsPayload,
  SetItemTypesPayload,
};