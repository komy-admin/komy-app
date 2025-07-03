import { useCallback } from 'react';
import { useAppInit } from './useAppInit';

/**
 * Hook pour l'initialisation de l'application restaurant
 * @deprecated Utiliser useAppInit à la place pour l'initialisation globale
 */
export const useRestaurantInit = () => {
  const { initializeApp, switchRoom, isInitialized } = useAppInit();

  // Compatibilité avec l'ancien API
  const initializeRestaurant = useCallback(async () => {
    if (isInitialized) {
      // Déjà initialisé, retourner des données vides pour compatibilité
      return { rooms: [], itemTypes: [] };
    }
    return initializeApp();
  }, [initializeApp, isInitialized]);

  return {
    initializeRestaurant,
    switchRoom,
    isInitialized,
  };
};