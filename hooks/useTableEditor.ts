import { useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { restaurantActions } from '~/store/restaurant';
import { tableApiService } from '~/api/table.api';
import { Table } from '~/types/table.types';

/**
 * Hook spécialisé pour l'édition haute performance des tables
 * Optimisé pour les opérations fréquentes sans états de loading intermédiaires
 */
export const useTableEditor = () => {
  const dispatch = useDispatch();
  const createOperationInProgress = useRef(false);
  const updateOperationInProgress = useRef(false);
  const deleteOperationInProgress = useRef(false);

  /**
   * Création rapide d'une table sans loading states
   * Optimisé pour les opérations en série
   */
  const createTableFast = useCallback(async (tableData: Omit<Table, "orders" | "id" | "createdAt" | "updatedAt" | "status" | "account" | "seats">) => {
    // Protection contre les appels multiples de création
    if (createOperationInProgress.current) {
      throw new Error('Une opération de création est déjà en cours');
    }

    createOperationInProgress.current = true;

    try {
      // Validation des données avant l'appel API
      if (!tableData.roomId) {
        throw new Error('roomId est requis pour créer une table');
      }
      
      if (!tableData.name) {
        throw new Error('Le nom de la table est requis');
      }

      if (tableData.xStart < 0 || tableData.yStart < 0) {
        throw new Error('Les coordonnées doivent être positives');
      }

      if (tableData.width <= 0 || tableData.height <= 0) {
        throw new Error('Les dimensions doivent être positives');
      }

      // Appel API avec retry automatique
      let retryCount = 0;
      const maxRetries = 3;
      let newTable: Table | null = null;

      while (retryCount < maxRetries) {
        try {
          newTable = await tableApiService.create(tableData);
          break;
        } catch (error) {
          retryCount++;
          if (retryCount === maxRetries) {
            throw error;
          }
          // Attendre avant le retry (backoff exponentiel)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 100));
        }
      }

      // Validation de la réponse API
      if (!newTable || !newTable.id) {
        throw new Error('Réponse API invalide: table créée sans ID');
      }

      // Dispatch direct pour performance maximale
      dispatch(restaurantActions.createTable({ table: newTable }));

      return newTable;
    } catch (error) {
      // Log détaillé pour le debugging
      console.error('Erreur lors de la création de table:', {
        error,
        tableData,
        timestamp: new Date().toISOString()
      });

      // Re-throw avec message utilisateur friendly
      if (error instanceof Error) {
        throw new Error(`Erreur lors de la création de la table: ${error.message}`);
      } else {
        throw new Error('Erreur inconnue lors de la création de la table');
      }
    } finally {
      // Délai pour permettre à Redux de propager avant la prochaine opération
      setTimeout(() => {
        createOperationInProgress.current = false;
      }, 250);
    }
  }, [dispatch]);

  /**
   * Mise à jour rapide d'une table
   */
  const updateTableFast = useCallback(async (tableId: string, updates: Partial<Table>) => {
    if (updateOperationInProgress.current) {
      console.warn('Opération de mise à jour déjà en cours, reset du verrou');
      updateOperationInProgress.current = false;
    }

    updateOperationInProgress.current = true;

    try {
      if (!tableId) {
        throw new Error('ID de table requis pour la mise à jour');
      }

      const updatedTable = await tableApiService.update(tableId, updates);
      
      if (!updatedTable || !updatedTable.id) {
        throw new Error('Réponse API invalide: table mise à jour sans ID');
      }

      dispatch(restaurantActions.updateTable({ table: updatedTable }));
      return updatedTable;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de table:', {
        error,
        tableId,
        updates,
        timestamp: new Date().toISOString()
      });

      if (error instanceof Error) {
        throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
      } else {
        throw new Error('Erreur inconnue lors de la mise à jour');
      }
    } finally {
      // Reset immédiat du verrou pour éviter les blocages
      updateOperationInProgress.current = false;
    }
  }, [dispatch]);

  /**
   * Suppression rapide d'une table
   */
  const deleteTableFast = useCallback(async (tableId: string) => {
    if (deleteOperationInProgress.current) {
      console.warn('Opération de suppression déjà en cours, reset du verrou');
      deleteOperationInProgress.current = false;
    }

    deleteOperationInProgress.current = true;

    try {
      if (!tableId) {
        throw new Error('ID de table requis pour la suppression');
      }

      await tableApiService.delete(tableId);
      dispatch(restaurantActions.deleteTable({ tableId }));
    } catch (error) {
      console.error('Erreur lors de la suppression de table:', {
        error,
        tableId,
        timestamp: new Date().toISOString()
      });

      if (error instanceof Error) {
        throw new Error(`Erreur lors de la suppression: ${error.message}`);
      } else {
        throw new Error('Erreur inconnue lors de la suppression');
      }
    } finally {
      // Reset immédiat du verrou pour éviter les blocages
      deleteOperationInProgress.current = false;
    }
  }, [dispatch]);

  /**
   * Vérifier si une opération de création est en cours
   */
  const isCreateOperationInProgress = useCallback(() => {
    return createOperationInProgress.current;
  }, []);

  /**
   * Vérifier si une opération de mise à jour est en cours
   */
  const isUpdateOperationInProgress = useCallback(() => {
    return updateOperationInProgress.current;
  }, []);

  /**
   * Vérifier si une opération de suppression est en cours
   */
  const isDeleteOperationInProgress = useCallback(() => {
    return deleteOperationInProgress.current;
  }, []);

  /**
   * Vérifier si une opération quelconque est en cours
   */
  const isAnyOperationInProgress = useCallback(() => {
    return createOperationInProgress.current || updateOperationInProgress.current || deleteOperationInProgress.current;
  }, []);

  return {
    createTableFast,
    updateTableFast,
    deleteTableFast,
    isCreateOperationInProgress,
    isUpdateOperationInProgress,
    isDeleteOperationInProgress,
    isAnyOperationInProgress,
  };
};