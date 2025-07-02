import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { Table } from '~/types/table.types';

// Types pour le state des tables
export interface TablesState {
  tables: Record<string, Table>;
  selectedTableId: string | null;
  loading: boolean;
  error: string | null;
}

// État initial
const initialState: TablesState = {
  tables: {},
  selectedTableId: null,
  loading: false,
  error: null,
};

// Slice pour les tables
const tablesSlice = createSlice({
  name: 'tables',
  initialState,
  reducers: {
    // Actions de chargement
    setLoadingTables: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
      if (action.payload) state.error = null;
    },
    
    setErrorTables: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    
    // Actions pour les données (utilisé quand on charge les rooms avec leurs tables)
    setTables: (state, action: PayloadAction<{ tables: Table[] }>) => {
      const { tables } = action.payload;
      
      // Ajouter les tables de cette room au store
      tables.forEach(table => {
        state.tables[table.id] = {
          ...table,
        };
      });
      
      state.loading = false;
      state.error = null;
    },
    
    // Actions de navigation
    setSelectedTable: (state, action: PayloadAction<string | null>) => {
      console.log('Selected table ID:', action.payload);
      state.selectedTableId = action.payload;
    },
    
    // Actions WebSocket CRUD
    createTable: (state, action: PayloadAction<{ table: Table }>) => {
      const { table } = action.payload;
      state.tables[table.id] = table;
    },
    
    updateTable: (state, action: PayloadAction<{ table: Table }>) => {
      const { table } = action.payload;
      state.tables[table.id] = table;
    },
    
    deleteTable: (state, action: PayloadAction<{ tableId: string }>) => {
      const { tableId } = action.payload;
      delete state.tables[tableId];
      
      // Désélectionner la table si c'était celle sélectionnée
      if (state.selectedTableId === tableId) {
        state.selectedTableId = null;
      }
    },
    
    // Action pour nettoyer l'état
    resetTablesState: () => initialState,
  },
});

// Selectors de base
const selectTablesState = (state: { tables: TablesState }) => state.tables;

export const selectAllTables = createSelector(
  [selectTablesState],
  (tablesState) => tablesState ? Object.values(tablesState.tables) : []
);

export const selectTablesByRoomId = (roomId: string) => createSelector(
  [selectTablesState],
  (tablesState) => {
    if (!tablesState) return [];
    return Object.values(tablesState.tables).filter(table => table.roomId === roomId);
  }
);

export const selectSelectedTableId = createSelector(
  [selectTablesState],
  (tablesState) => tablesState?.selectedTableId || null
);

export const selectSelectedTable = createSelector(
  [selectTablesState],
  (tablesState) => {
    console.log('tablesState:', tablesState);
    if (!tablesState || !tablesState.selectedTableId) return null;
    return tablesState.tables[tablesState.selectedTableId] || null;
  }
);

export const selectTableById = (tableId: string) => createSelector(
  [selectTablesState],
  (tablesState) => tablesState?.tables[tableId] || null
);

export const selectTablesLoading = createSelector(
  [selectTablesState],
  (tablesState) => tablesState?.loading || false
);

export const selectTablesError = createSelector(
  [selectTablesState],
  (tablesState) => tablesState?.error || null
);

// Actions exportées
export const tablesActions = tablesSlice.actions;
export default tablesSlice.reducer;