import { useEffect, useRef, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { createSelector } from '@reduxjs/toolkit';
import { useAppDispatch } from '~/store/hooks';
import { RootState } from '~/store';
import { setOverdueOrders, setOverdueOrderItems, updateLastAlertCheck } from '@/store/account-config.slice';
import { Order } from '~/types/order.types';

const CHECK_INTERVAL = 60000; // 1 minute - interval fixe et simple

// Sélecteur mémorisé pour éviter les re-renders
const selectOrdersArray = createSelector(
  [(state: RootState) => state.restaurant?.orders?.orders],
  (ordersState) => {
    if (ordersState) {
      return Object.values(ordersState);
    }
    return [];
  }
);

export const useAlertMonitor = () => {
  const dispatch = useAppDispatch();
  const intervalRef = useRef<number | null>(null);
  
  const { reminderMinutes, reminderNotificationsEnabled } = useSelector((state: RootState) => state.accountConfig);
  const { token, userProfile } = useSelector((state: RootState) => state.auth);
  const isAuthenticated = !!(token && userProfile);
  
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
      dispatch(setOverdueOrders([]));
      dispatch(setOverdueOrderItems([]));
      return;
    }

    const currentTime = Date.now();
    const alertTimeMs = reminderMinutes * 60 * 1000;
    // Plus besoin de warningTimeMs car pas d'interval adaptatif
    
    const overdueOrderIds: string[] = [];
    const overdueOrderItemIds: string[] = [];
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      
      let hasOverdueItems = false;
      
      if (order.lines?.length) {
        for (let j = 0; j < order.lines.length; j++) {
          const orderLine = order.lines[j];
          // Pour les OrderLines, on utilise createdAt/updatedAt de la commande
          const itemUpdateTime = new Date(order.updatedAt || order.createdAt).getTime();
          
          const timeDiff = currentTime - itemUpdateTime;
          
          // Vérifier si en retard (optimisé sans calcul inutile de minutes)
          if (timeDiff > alertTimeMs) {
            overdueOrderItemIds.push(orderLine.id);
            hasOverdueItems = true;
            
          }
        }
      }
      
      if (hasOverdueItems) {
        overdueOrderIds.push(order.id);
      }
    }

    const newResults = {
      overdueOrderIds,
      overdueOrderItemIds
    };
    
    setAlertResults(newResults);
    dispatch(setOverdueOrders(overdueOrderIds));
    dispatch(setOverdueOrderItems(overdueOrderItemIds));
    dispatch(updateLastAlertCheck());
  }, [isAuthenticated, reminderMinutes, reminderNotificationsEnabled, orders, dispatch]);

  // Initialisation des alertes au démarrage et nettoyage quand désactivées
  useEffect(() => {
    if (isAuthenticated && orders?.length && reminderNotificationsEnabled) {
      updateAlertState();
    } else if (!reminderNotificationsEnabled) {
      // Nettoyer immédiatement les alertes visuelles quand désactivées
      const emptyResults = {
        overdueOrderIds: [],
        overdueOrderItemIds: []
      };
      setAlertResults(emptyResults);
      dispatch(setOverdueOrders([]));
      dispatch(setOverdueOrderItems([]));
    }
  }, [isAuthenticated, orders, reminderNotificationsEnabled, updateAlertState, dispatch]);

  // Effet pour gérer l'intervalle de vérification
  useEffect(() => {
    // Ne démarrer que si authentifié, qu'il y a des orders et que les alertes sont activées
    if (!isAuthenticated || !orders?.length || !reminderNotificationsEnabled) {
      // Nettoyer l'intervalle si les conditions ne sont plus remplies
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Démarrer l'intervalle de vérification fixe (60s)
    intervalRef.current = window.setInterval(() => {
      console.log(`🔄 TICK - Seuil: ${reminderMinutes}min, Orders: ${orders?.length || 0}`);
      updateAlertState();
    }, CHECK_INTERVAL);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAuthenticated, orders, reminderNotificationsEnabled, updateAlertState]);


  // Fonction pour forcer une vérification manuelle
  const forceCheck = useCallback(() => {
    if (reminderNotificationsEnabled) {
      updateAlertState();
    }
  }, [reminderNotificationsEnabled, updateAlertState]);

  return { 
    forceCheck,
    // Exposer les résultats calculés
    alertResults,
    // Statut des alertes
    isEnabled: reminderNotificationsEnabled
  };
};