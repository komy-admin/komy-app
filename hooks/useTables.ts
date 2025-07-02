import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { 
  restaurantActions,
  selectAllTables,
  selectTablesByRoomId,
  selectSelectedTableId,
  selectSelectedTable,
  selectTableById,
  selectTablesLoading,
  selectTablesError,
  selectEnrichedTables,
  selectCurrentRoomTables,
} from '~/store/restaurant';
import { tableApiService } from '~/api/table.api';
import { Table } from '~/types/table.types';
import { Status } from '~/types/status.enum';

/**
 * Hook spécialisé pour la gestion des tables
 */
export const useTables = () => {
  const dispatch = useDispatch();

  // Sélecteurs
  const tables = useSelector((state: any) => selectAllTables({ tables: state.restaurant.tables }));
  const enrichedTables = useSelector((state: any) => selectEnrichedTables(state));
  const currentRoomTables = useSelector((state: any) => selectCurrentRoomTables(state));
  const selectedTableId = useSelector((state: any) => selectSelectedTableId({ tables: state.restaurant.tables }));
  const selectedTable = useSelector((state: any) => selectSelectedTable({ tables: state.restaurant.tables }));
  const loading = useSelector((state: any) => selectTablesLoading({ tables: state.restaurant.tables }));
  const error = useSelector((state: any) => selectTablesError({ tables: state.restaurant.tables }));

  // Actions synchrones
  const setSelectedTable = useCallback((tableId: string | null) => {
    console.log('Selected table ID:', tableId);
    dispatch(restaurantActions.setSelectedTable(tableId));
  }, [dispatch]);

  const selectTable = useCallback((table: Table) => {
    setSelectedTable(table.id);
  }, [setSelectedTable]);

  const clearSelection = useCallback(() => {
    setSelectedTable(null);
  }, [setSelectedTable]);

  // Actions asynchrones
  const loadTables = useCallback(async () => {
    try {
      dispatch(restaurantActions.setLoadingTables(true));
      const { data: tables } = await tableApiService.getAll();
      dispatch(restaurantActions.setTables({ tables }));
      return tables;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement des tables';
      dispatch(restaurantActions.setErrorTables(errorMessage));
      throw error;
    }
  }, [dispatch]);

  const createTable = useCallback(async (tableData: Omit<Table, "orders" | "id" | "createdAt" | "updatedAt" | "status" | "account" | "seats">) => {
    try {
      dispatch(restaurantActions.setLoadingTables(true));
      const newTable = await tableApiService.create(tableData);
      dispatch(restaurantActions.createTable({ table: newTable }));
      return newTable;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la création de la table';
      dispatch(restaurantActions.setErrorTables(errorMessage));
      throw error;
    }
  }, [dispatch]);

  const updateTable = useCallback(async (tableId: string, tableData: Partial<Table>) => {
    try {
      const updatedTable = await tableApiService.update(tableId, tableData);
      dispatch(restaurantActions.updateTable({ table: updatedTable }));
      return updatedTable;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la table:', error);
      throw error;
    }
  }, [dispatch]);

  const deleteTable = useCallback(async (tableId: string) => {
    try {
      await tableApiService.delete(tableId);
      dispatch(restaurantActions.deleteTable({ tableId }));
    } catch (error) {
      console.error('Erreur lors de la suppression de la table:', error);
      throw error;
    }
  }, [dispatch]);

  // Utilitaires
  const getTableById = useCallback((tableId: string) => {
    return enrichedTables.find(table => table.id === tableId) || null;
  }, [enrichedTables]);

  const getTablesByRoom = useCallback((roomId: string) => {
    return enrichedTables.filter(table => table.roomId === roomId);
  }, [enrichedTables]);

  const getTableStatus = useCallback((tableId: string) => {
    const table = enrichedTables.find(t => t.id === tableId);
    return table?.status || Status.DRAFT;
  }, [enrichedTables]);

  const hasOrder = useCallback((tableId: string) => {
    const table = enrichedTables.find(t => t.id === tableId);
    return !!table?.currentOrder;
  }, [enrichedTables]);

  const getSelectedTableOrder = useCallback(() => {
    if (!selectedTableId) return null;
    const table = enrichedTables.find(t => t.id === selectedTableId);
    return table?.currentOrder || null;
  }, [selectedTableId, enrichedTables]);

  return {
    // Données
    tables,
    enrichedTables,
    currentRoomTables,
    selectedTableId,
    selectedTable,
    
    // État
    loading,
    error,
    
    // Actions de sélection
    setSelectedTable,
    selectTable,
    clearSelection,
    
    // Actions CRUD
    loadTables,
    createTable,
    updateTable,
    deleteTable,
    
    // Utilitaires
    getTableById,
    getTablesByRoom,
    getTableStatus,
    hasOrder,
    getSelectedTableOrder,
  };
};