import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { Menu, MenuCategory, MenuCategoryItem } from '~/types/menu.types';

// Types pour le state des menus
export interface MenusState {
  menus: Record<string, Menu>;
  menuCategoryItems: Record<string, MenuCategoryItem[]>; // Clé: menuCategoryId
  loading: boolean;
  error: string | null;
}

// État initial
const initialState: MenusState = {
  menus: {},
  menuCategoryItems: {},
  loading: false,
  error: null,
};

// Types pour les actions
interface SetMenusPayload {
  menus: Menu[];
}

interface SetMenuCategoryItemsPayload {
  menuCategoryId: string;
  items: MenuCategoryItem[];
}

// Slice pour les menus
const menusSlice = createSlice({
  name: 'menus',
  initialState,
  reducers: {
    // Actions de chargement
    setLoadingMenus: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
      if (action.payload) state.error = null;
    },
    
    setErrorMenus: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    
    // Actions pour les données
    setMenus: (state, action: PayloadAction<SetMenusPayload>) => {
      const { menus } = action.payload;
      
      // Normaliser les menus avec vérification de sécurité
      state.menus = {};
      
      // Vérifier que menus est bien un tableau
      if (Array.isArray(menus)) {
        menus.forEach(menu => {
          state.menus[menu.id] = menu;
        });
      } else {
        console.warn('setMenus: menus n\'est pas un tableau:', menus);
      }
      
      state.loading = false;
      state.error = null;
    },
    
    setMenuCategoryItems: (state, action: PayloadAction<SetMenuCategoryItemsPayload>) => {
      const { menuCategoryId, items } = action.payload;
      state.menuCategoryItems[menuCategoryId] = items;
      
      state.loading = false;
      state.error = null;
    },
    
    // Actions WebSocket CRUD pour les menus
    createMenu: (state, action: PayloadAction<{ menu: Menu }>) => {
      const { menu } = action.payload;
      // ✅ S'assurer que categories est initialisé
      state.menus[menu.id] = {
        ...menu,
        categories: menu.categories || []
      };
    },
    
    updateMenu: (state, action: PayloadAction<{ menu: Menu }>) => {
      const { menu } = action.payload;
      // ✅ S'assurer que categories est initialisé
      state.menus[menu.id] = {
        ...menu,
        categories: menu.categories || []
      };
    },
    
    deleteMenu: (state, action: PayloadAction<{ menuId: string }>) => {
      const { menuId } = action.payload;
      delete state.menus[menuId];
      
      // Supprimer aussi les items de catégories associés
      Object.keys(state.menuCategoryItems).forEach(categoryId => {
        const menu = Object.values(state.menus).find(m => 
          m.categories.some(cat => cat.id === categoryId)
        );
        if (!menu) {
          delete state.menuCategoryItems[categoryId];
        }
      });
    },
    
    // Actions WebSocket CRUD pour les menuCategories
    createMenuCategory: (state, action: PayloadAction<{ menuCategory: MenuCategory }>) => {
      const { menuCategory } = action.payload;
      const menuId = menuCategory.menuId;
      
      if (state.menus[menuId]) {
        // ✅ Initialiser categories si undefined
        if (!state.menus[menuId].categories) {
          state.menus[menuId].categories = [];
        }
        
        // Vérifier si la catégorie existe déjà
        const existingIndex = state.menus[menuId].categories.findIndex(
          cat => cat.id === menuCategory.id
        );
        
        if (existingIndex >= 0) {
          state.menus[menuId].categories[existingIndex] = menuCategory;
        } else {
          state.menus[menuId].categories.push(menuCategory);
        }
      }
    },
    
    updateMenuCategory: (state, action: PayloadAction<{ menuCategory: MenuCategory }>) => {
      const { menuCategory } = action.payload;
      const menuId = menuCategory.menuId;
      
      if (state.menus[menuId]) {
        const categoryIndex = state.menus[menuId].categories.findIndex(
          cat => cat.id === menuCategory.id
        );
        
        if (categoryIndex >= 0) {
          state.menus[menuId].categories[categoryIndex] = menuCategory;
        }
      }
    },
    
    deleteMenuCategory: (state, action: PayloadAction<{ menuCategoryId: string }>) => {
      const { menuCategoryId } = action.payload;
      
      // Trouver le menu qui contient cette catégorie et la supprimer
      Object.values(state.menus).forEach(menu => {
        menu.categories = menu.categories.filter(cat => cat.id !== menuCategoryId);
      });
      
      // Supprimer aussi les items associés à cette catégorie
      delete state.menuCategoryItems[menuCategoryId];
    },
    
    // Actions WebSocket CRUD pour les menuCategoryItems
    createMenuCategoryItem: (state, action: PayloadAction<{ menuCategoryItem: MenuCategoryItem }>) => {
      const { menuCategoryItem } = action.payload;
      const categoryId = menuCategoryItem.menuCategoryId;
      
      if (!state.menuCategoryItems[categoryId]) {
        state.menuCategoryItems[categoryId] = [];
      }
      
      // Vérifier si l'item existe déjà
      const existingIndex = state.menuCategoryItems[categoryId].findIndex(
        item => item.id === menuCategoryItem.id
      );
      
      if (existingIndex >= 0) {
        state.menuCategoryItems[categoryId][existingIndex] = menuCategoryItem;
      } else {
        state.menuCategoryItems[categoryId].push(menuCategoryItem);
      }
    },
    
    updateMenuCategoryItem: (state, action: PayloadAction<{ menuCategoryItem: MenuCategoryItem }>) => {
      const { menuCategoryItem } = action.payload;
      const categoryId = menuCategoryItem.menuCategoryId;
      
      if (state.menuCategoryItems[categoryId]) {
        const index = state.menuCategoryItems[categoryId].findIndex(
          item => item.id === menuCategoryItem.id
        );
        if (index >= 0) {
          state.menuCategoryItems[categoryId][index] = menuCategoryItem;
        }
      }
    },
    
    deleteMenuCategoryItem: (state, action: PayloadAction<{ menuCategoryItemId: string }>) => {
      const { menuCategoryItemId } = action.payload;
      
      // Trouver et supprimer l'item dans toutes les catégories
      Object.keys(state.menuCategoryItems).forEach(categoryId => {
        state.menuCategoryItems[categoryId] = state.menuCategoryItems[categoryId].filter(
          item => item.id !== menuCategoryItemId
        );
      });
    },
    
    // Action pour nettoyer l'état
    resetMenusState: () => initialState,
  },
});

// Selectors de base
const selectMenusState = (state: { menus: MenusState }) => state.menus;

export const selectAllMenus = createSelector(
  [selectMenusState],
  (menusState) => {
    if (!menusState) return [];
    return Object.values(menusState.menus);
  }
);

export const selectActiveMenus = createSelector(
  [selectAllMenus],
  (menus) => menus.filter(menu => menu.isActive)
);

export const selectMenuById = (menuId: string) => createSelector(
  [selectMenusState],
  (menusState) => menusState?.menus[menuId] || null
);

export const selectMenuCategoryItems = (menuCategoryId: string) => createSelector(
  [selectMenusState],
  (menusState) => menusState?.menuCategoryItems[menuCategoryId] || []
);

export const selectAvailableMenuCategoryItems = (menuCategoryId: string) => createSelector(
  [selectMenuCategoryItems(menuCategoryId)],
  (items) => items.filter(item => item.isAvailable)
);

export const selectMenusLoading = createSelector(
  [selectMenusState],
  (menusState) => menusState?.loading || false
);

export const selectMenusError = createSelector(
  [selectMenusState],
  (menusState) => menusState?.error || null
);

// Actions exportées
export const menusActions = menusSlice.actions;
export default menusSlice.reducer;

// Types exportés
export type {
  SetMenusPayload,
  SetMenuCategoryItemsPayload,
};