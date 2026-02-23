import { useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { entitiesActions } from '~/store';
import { tableApiService } from '~/api/table.api';
import { Table } from '~/types/table.types';

/**
 * Hook spécialisé pour l'édition haute performance des tables
 * Optimisé pour les opérations fréquentes sans états de loading intermédiaires
 */
export const useTableEditor = () => {
  const dispatch = useDispatch();
  const createOperationInProgress = useRef(false);

  /**
   * Création rapide d'une table sans loading states
   * Optimisé pour les opérations en série
   */
  const createTableFast = useCallback(async (tableData: Omit<Table, "orders" | "id" | "createdAt" | "updatedAt" | "status" | "account" | "seats">) => {
    // Protection contre les double-clicks rapides
    if (createOperationInProgress.current) {
      throw new Error('Une opération de création est déjà en cours');
    }

    createOperationInProgress.current = true;

    try {
      const newTable = await tableApiService.create(tableData);

      if (!newTable || !newTable.id) {
        throw new Error('Réponse API invalide: table créée sans ID');
      }

      dispatch(entitiesActions.createTable({ table: newTable }));
      return newTable;
    } finally {
      createOperationInProgress.current = false;
    }
  }, [dispatch]);

  /**
   * Mise à jour rapide d'une table
   */
  const updateTableFast = useCallback(async (tableId: string, updates: Partial<Table>) => {
    if (!tableId) {
      throw new Error('ID de table requis pour la mise à jour');
    }

    const updatedTable = await tableApiService.update(tableId, updates);

    if (!updatedTable || !updatedTable.id) {
      throw new Error('Réponse API invalide: table mise à jour sans ID');
    }

    dispatch(entitiesActions.updateTable({ table: updatedTable }));
    return updatedTable;
  }, [dispatch]);

  /**
   * Suppression rapide d'une table
   */
  const deleteTableFast = useCallback(async (tableId: string) => {
    if (!tableId) {
      throw new Error('ID de table requis pour la suppression');
    }

    await tableApiService.delete(tableId);
    dispatch(entitiesActions.deleteTable({ tableId }));
  }, [dispatch]);

  /**
   * Vérifier si une opération de création est en cours
   */
  const isCreateOperationInProgress = useCallback(() => {
    return createOperationInProgress.current;
  }, []);

  return {
    createTableFast,
    updateTableFast,
    deleteTableFast,
    isCreateOperationInProgress,
  };
};