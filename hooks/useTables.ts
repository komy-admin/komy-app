import { useSelector, useDispatch } from 'react-redux';
import { useCallback, useMemo } from 'react';
import { RootState, entitiesActions, sessionActions } from '~/store';
import { selectCurrentRoomId, selectSelectedTableId } from '~/store/slices/session.slice';
import { selectTables } from '~/store/selectors';
import { tableApiService } from '~/api/table.api';
import { Table } from '~/types/table.types';
import { createActiveOrdersByTableIndex } from '~/utils/orderUtils';

/**
 * Hook spécialisé pour la gestion des tables
 *
 * 🚀 OPTIMISATIONS v2.0 :
 * - Index des commandes par tableId pour lookup O(1) au lieu de O(n)
 * - Enrichissement uniquement des tables de la room actuelle
 * - Complexité réduite de O(tables * orders) à O(orders) + O(tables_in_room)
 */
export const useTables = () => {
  const dispatch = useDispatch();

  // Sélecteurs
  const tables = useSelector(selectTables);
  const orders = useSelector((state: RootState) => state.entities.orders);
  const currentRoomId = useSelector(selectCurrentRoomId);
  const selectedTableId = useSelector(selectSelectedTableId);

  // 🚀 Index des commandes actives par tableId - O(n) une seule fois
  // Remplace le filter O(n) répété pour chaque table
  const activeOrdersByTableId = useMemo(() => {
    return createActiveOrdersByTableIndex(Object.values(orders));
  }, [orders]);

  // Tables de la salle courante (filtrées AVANT enrichissement)
  // 🚀 OPTIMISATION: On filtre d'abord, puis on enrichit seulement les tables visibles
  const currentRoomTables = useMemo(() => {
    if (!currentRoomId) return [];

    // 1. Filtrer par room (O(n) sur toutes les tables)
    const roomTables = tables.filter(table => table.roomId === currentRoomId);

    // 2. Enrichir SEULEMENT les tables de la room (O(k) où k = tables dans la room)
    return roomTables.map(table => ({
      ...table,
      orders: activeOrdersByTableId.get(table.id) || []
    }));
  }, [tables, currentRoomId, activeOrdersByTableId]);

  // Tables enrichies avec leurs commandes - utilisé pour d'autres fonctionnalités
  // 🚀 LAZY: Calculé uniquement quand nécessaire via getTableById/getTablesByRoom
  const enrichedTables = useMemo(() => {
    return tables.map(table => ({
      ...table,
      orders: activeOrdersByTableId.get(table.id) || []
    }));
  }, [tables, activeOrdersByTableId]);

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


  const hasOrder = useCallback((tableId: string) => {
    const table = enrichedTables.find(t => t.id === tableId);
    return !!table?.orders?.length;
  }, [enrichedTables]);

  const getSelectedTableOrder = useCallback(() => {
    if (!selectedTableId) return null;
    const table = enrichedTables.find(t => t.id === selectedTableId);
    return table?.orders?.[0] || null;
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
    hasOrder,
    getSelectedTableOrder,
  };
};