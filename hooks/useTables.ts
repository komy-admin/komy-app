import { useSelector, useDispatch } from 'react-redux';
import { useCallback, useMemo } from 'react';
import { RootState, entitiesActions, sessionActions } from '~/store';
import { selectTablesByRoomId } from '~/store/slices/entities.slice';
import { selectCurrentRoomId, selectSelectedTableId } from '~/store/slices/session.slice';
import { tableApiService } from '~/api/table.api';
import { Table } from '~/types/table.types';
import { Status } from '~/types/status.enum';

/**
 * Hook spécialisé pour la gestion des tables
 */
export const useTables = () => {
  const dispatch = useDispatch();

  // Sélecteurs
  const tables = useSelector((state: RootState) => Object.values(state.entities.tables));
  const orders = useSelector((state: RootState) => state.entities.orders);
  const currentRoomId = useSelector(selectCurrentRoomId);
  const selectedTableId = useSelector(selectSelectedTableId);
  
  // Tables enrichies avec leurs commandes
  const enrichedTables = useMemo(() => {
    return tables.map(table => ({
      ...table,
      currentOrder: Object.values(orders).find(order => 
        order.tableId === table.id && 
        order.status !== Status.PAID && 
        order.status !== Status.DRAFT
      )
    }));
  }, [tables, orders]);

  // Tables de la salle courante
  const currentRoomTables = useMemo(() => {
    if (!currentRoomId) return [];
    return enrichedTables.filter(table => table.roomId === currentRoomId);
  }, [enrichedTables, currentRoomId]);

  const selectedTable = useMemo(() => {
    if (!selectedTableId) return null;
    return enrichedTables.find(table => table.id === selectedTableId) || null;
  }, [selectedTableId, enrichedTables]);

  const loading = false; // Géré globalement
  const error = null; // Géré globalement

  // Actions synchrones
  const setSelectedTable = useCallback((tableId: string | null) => {
    dispatch(sessionActions.setSelectedTable(tableId));
  }, [dispatch]);

  const selectTable = useCallback((table: Table) => {
    setSelectedTable(table.id);
  }, [setSelectedTable]);

  const clearSelection = useCallback(() => {
    setSelectedTable(null);
  }, [setSelectedTable]);

  // Actions asynchrones
  const createTable = useCallback(async (tableData: Omit<Table, "orders" | "id" | "createdAt" | "updatedAt" | "status" | "account" | "seats">) => {
    try {
      const newTable = await tableApiService.create(tableData);
      dispatch(entitiesActions.createTable({ table: newTable }));
      return newTable;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la création de la table';
      console.error('Erreur lors de la création de la table:', errorMessage);
      throw error;
    }
  }, [dispatch]);

  const updateTable = useCallback(async (tableId: string, tableData: Partial<Table>) => {
    try {
      const updatedTable = await tableApiService.update(tableId, tableData);
      dispatch(entitiesActions.updateTable({ table: updatedTable }));
      return updatedTable;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la table:', error);
      throw error;
    }
  }, [dispatch]);

  const deleteTable = useCallback(async (tableId: string) => {
    try {
      await tableApiService.delete(tableId);
      dispatch(entitiesActions.deleteTable({ tableId }));
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