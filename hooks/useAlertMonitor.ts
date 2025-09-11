import { useEffect, useRef, useCallback, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '~/store';
import { Order } from '~/types/order.types';

const CHECK_INTERVAL = 60000; // 1 minute - interval fixe et simple

// Sélecteur mémorisé pour éviter les re-renders
const selectOrdersArray = createSelector(
  [(state: RootState) => state.entities?.orders],
  (ordersState) => {
    if (ordersState) {
      return Object.values(ordersState);
    }
    return [];
  }
);

/**
 * Hook pour monitorer les commandes en retard et déclencher des alertes
 * TODO: This needs to be reimplemented with account config in the new store
 */
export const useAlertMonitor = () => {
  const dispatch = useDispatch();
  const intervalRef = useRef<number | null>(null);
  
  // TODO: Get these from account config when reimplemented
  const reminderMinutes = 15; // Default value
  const reminderNotificationsEnabled = false; // Default value
  
  const { token, user } = useSelector((state: RootState) => state.session);
  const isAuthenticated = !!(token && user);
  
  // Utiliser le sélecteur mémorisé
  const orders = useSelector(selectOrdersArray);

  // État local pour stocker les résultats
  const [alertResults, setAlertResults] = useState<{
    overdueOrderIds: string[];
    overdueOrderItemIds: string[];
  }>({
    overdueOrderIds: [],
    overdueOrderItemIds: []
  });

  // Fonction de calcul et mise à jour des alertes
  const updateAlertState = useCallback(() => {
    // Ne pas calculer si pas authentifié, pas d'orders ou alertes désactivées
    if (!isAuthenticated || !orders?.length || !reminderNotificationsEnabled || !reminderMinutes || reminderMinutes === 0) {
      const emptyResults = {
        overdueOrderIds: [],
        overdueOrderItemIds: []
      };
      setAlertResults(emptyResults);
      // TODO: Dispatch to new store when account config is reimplemented
      // dispatch(setOverdueOrders([]));
      // dispatch(setOverdueOrderItems([]));
      return;
    }

    const now = new Date();
    const overdueOrderIds: string[] = [];
    const overdueOrderItemIds: string[] = [];

    orders.forEach((order: Order) => {
      // Vérifier si la commande est en retard
      if (order.createdAt) {
        const orderDate = new Date(order.createdAt);
        const diffMinutes = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60));
        
        if (diffMinutes >= reminderMinutes) {
          overdueOrderIds.push(order.id);
        }
      }

      // Vérifier les items de la commande
      // TODO: Check order line items when the structure is clarified
    });

    const results = {
      overdueOrderIds,
      overdueOrderItemIds
    };

    setAlertResults(results);
    
    // TODO: Dispatch to new store when account config is reimplemented
    // dispatch(setOverdueOrders(overdueOrderIds));
    // dispatch(setOverdueOrderItems(overdueOrderItemIds));
    // dispatch(updateLastAlertCheck());
  }, [orders, reminderMinutes, reminderNotificationsEnabled, isAuthenticated]);

  // Configuration de l'intervalle
  useEffect(() => {
    // Ne pas démarrer le monitoring si désactivé ou pas authentifié
    if (!reminderNotificationsEnabled || !isAuthenticated) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Vérification initiale
    updateAlertState();

    // Configuration de l'intervalle
    intervalRef.current = window.setInterval(() => {
      updateAlertState();
    }, CHECK_INTERVAL);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [updateAlertState, reminderNotificationsEnabled, isAuthenticated]);

  return {
    overdueOrderIds: alertResults.overdueOrderIds,
    overdueOrderItemIds: alertResults.overdueOrderItemIds,
    isMonitoring: reminderNotificationsEnabled && isAuthenticated,
    checkNow: updateAlertState
  };
};