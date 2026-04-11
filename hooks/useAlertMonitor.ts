import { useEffect, useRef, useCallback, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '~/store';
import { Order } from '~/types/order.types';
import { Status } from '~/types/status.enum';
import { sessionActions } from '~/store/slices/session.slice';

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
 */
export const useAlertMonitor = () => {
  const dispatch = useDispatch();
  const intervalRef = useRef<number | null>(null);
  
  // Récupérer la configuration depuis le store
  const accountConfig = useSelector((state: RootState) => state.session.accountConfig);
  const reminderMinutes = accountConfig?.reminderMinutes || 15;
  const reminderNotificationsEnabled = accountConfig?.reminderNotificationsEnabled || false;
  
  const { sessionToken, user } = useSelector((state: RootState) => state.session);
  const isAuthenticated = !!(sessionToken && user);
  
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
      dispatch(sessionActions.setOverdueOrders([]));
      dispatch(sessionActions.setOverdueOrderItems([]));
      return;
    }

    const now = new Date();
    const overdueOrderIds: string[] = [];
    const overdueOrderItemIds: string[] = [];

    orders.forEach((order: Order) => {
      // Vérifier si la commande est en retard
      if ([Status.PENDING, Status.READY].includes(order.status)) {
        // Utiliser updatedAt si disponible, sinon createdAt
        const dateToCheck = order.updatedAt || order.createdAt;
        if (dateToCheck) {
          const orderDate = new Date(dateToCheck);
          const diffMinutes = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60));
          
          if (diffMinutes >= reminderMinutes) {
            overdueOrderIds.push(order.id);
          }
        }
      }

      // Vérifier les items de la commande (OrderLines)
      if (order.lines && order.lines.length > 0) {
        order.lines.forEach(line => {
          if (line.status && [Status.PENDING, Status.READY].includes(line.status)) {
            // Utiliser updatedAt si disponible, sinon createdAt
            const dateToCheck = line.updatedAt || line.createdAt;
            if (dateToCheck) {
              const lineDate = new Date(dateToCheck);
              const diffMinutes = Math.floor((now.getTime() - lineDate.getTime()) / (1000 * 60));

              if (diffMinutes >= reminderMinutes) {
                overdueOrderItemIds.push(line.id);
              }
            }
          }

          // Vérifier aussi les items de menu (OrderLineItems) si c'est un menu
          if (line.type === 'MENU' && line.items && line.items.length > 0) {
            line.items.forEach(menuItem => {
              if (menuItem.status && [Status.PENDING, Status.READY].includes(menuItem.status)) {
                // Utiliser updatedAt si disponible, sinon la date de la ligne parente
                const dateToCheck = menuItem.updatedAt || line.createdAt;
                if (dateToCheck) {
                  const itemDate = new Date(dateToCheck);
                  const diffMinutes = Math.floor((now.getTime() - itemDate.getTime()) / (1000 * 60));

                  if (diffMinutes >= reminderMinutes) {
                    overdueOrderItemIds.push(menuItem.id);
                  }
                }
              }
            });
          }
        });
      }
    });

    const results = {
      overdueOrderIds,
      overdueOrderItemIds
    };

    setAlertResults(results);
    
    // Mettre à jour le store avec les commandes en retard
    dispatch(sessionActions.setOverdueOrders(overdueOrderIds));
    dispatch(sessionActions.setOverdueOrderItems(overdueOrderItemIds));
    dispatch(sessionActions.updateLastAlertCheck());
  }, [orders, reminderMinutes, reminderNotificationsEnabled, isAuthenticated]);

  // Configuration de l'intervalle
  useEffect(() => {
    // Ne pas démarrer le monitoring si désactivé ou pas authentifié
    if (!reminderNotificationsEnabled || !isAuthenticated) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Nettoyer les alertes existantes dans le store
      dispatch(sessionActions.setOverdueOrders([]));
      dispatch(sessionActions.setOverdueOrderItems([]));
      setAlertResults({ overdueOrderIds: [], overdueOrderItemIds: [] });
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
  }, [updateAlertState, reminderNotificationsEnabled, isAuthenticated, dispatch]);

  return {
    overdueOrderIds: alertResults.overdueOrderIds,
    overdueOrderItemIds: alertResults.overdueOrderItemIds,
    isMonitoring: reminderNotificationsEnabled && isAuthenticated,
    checkNow: updateAlertState
  };
};