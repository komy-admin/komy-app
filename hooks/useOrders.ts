import { useSelector, useDispatch } from 'react-redux';
import { useCallback, useMemo } from 'react';
import { RootState, entitiesActions } from '~/store';
import { selectCurrentRoomId, selectSelectedTableId } from '~/store/slices/session.slice';
import { orderApiService, UpdateOrderStatusPayload } from '~/api/order.api';
import { useOrderLines } from '~/hooks/useOrderLines';
import { Status } from '~/types/status.enum';
import { Order } from '~/types/order.types';
import { OrderLine } from '~/types/order-line.types';

/**
 * Hook spécialisé pour la gestion des commandes
 */
export const useOrders = () => {
  const dispatch = useDispatch();
  const { 
    deleteOrderLines, 
    updateManyOrderLinesStatus 
  } = useOrderLines();

  // Sélecteurs
  const orders = useSelector((state: RootState) => Object.values(state.entities.orders));
  const tables = useSelector((state: RootState) => state.entities.tables);
  const currentRoomId = useSelector(selectCurrentRoomId);
  const selectedTableId = useSelector(selectSelectedTableId);
  
  // Commandes de la salle courante
  const currentRoomOrders = useMemo(() => {
    if (!currentRoomId) return [];
    return orders.filter(order => {
      // Si la table a un roomId directement, l'utiliser
      if (order.table?.roomId) {
        return order.table.roomId === currentRoomId;
      }
      // Sinon, chercher la table dans le store pour obtenir son roomId
      if (order.tableId && tables[order.tableId]) {
        return tables[order.tableId].roomId === currentRoomId;
      }
      return false;
    });
  }, [orders, currentRoomId, tables]);
  
  // Commande de la table sélectionnée
  const selectedTableOrder = useMemo(() => {
    if (!selectedTableId) return null;
    return orders.find(order => 
      order.tableId === selectedTableId && 
      order.status !== Status.TERMINATED
    ) || null;
  }, [orders, selectedTableId]);
  
  const loading = false; // Géré globalement maintenant
  const error = null; // Géré globalement maintenant

  // Actions asynchrones pour charger les données
  const loadOrdersForRoom = useCallback(async () => {
    try {
      // Pour l'instant, on charge toutes les orders et on filtre côté client
      // TODO: Implémenter le filtre côté serveur quand l'API le supportera
      const { data: orders } = await orderApiService.getAll();
      
      // Corriger les orders qui n'ont pas de status
      const ordersWithStatus = orders.map(order => {
        if (!order.status && order.lines && order.lines.length > 0) {
          // Prendre le status de priorité des lines
          const hasReady = order.lines.some(line => line.status === Status.READY);
          const hasInProgress = order.lines.some(line => line.status === Status.INPROGRESS);
          const hasPending = order.lines.some(line => line.status === Status.PENDING);
          
          let status = Status.PENDING;
          if (hasReady) status = Status.READY;
          else if (hasInProgress) status = Status.INPROGRESS;
          else if (hasPending) status = Status.PENDING;
          
          return { ...order, status };
        }
        return order;
      });
      
      dispatch(entitiesActions.setOrders({ orders: ordersWithStatus }));
      
      return ordersWithStatus;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement des commandes';
      console.error('Erreur lors du chargement des commandes de la salle:', errorMessage);
      throw error;
    }
  }, [dispatch]);

  const loadAllOrders = useCallback(async () => {
    try {
      const { data: orders } = await orderApiService.getAll();
      
      dispatch(entitiesActions.setOrders({ orders }));
      return orders;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement des commandes';
      console.error('Erreur lors du chargement de toutes les commandes:', errorMessage);
      throw error;
    }
  }, [dispatch]);

  const createOrder = useCallback(async (orderData: Partial<Order>) => {
    try {
      const newOrder = await orderApiService.create(orderData);
      dispatch(entitiesActions.createOrder({ order: newOrder }));
      return newOrder;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la création de la commande';
      console.error('Erreur lors de la création de la commande:', errorMessage);
      throw error;
    }
  }, [dispatch]);

  const updateOrder = useCallback(async (orderId: string, orderData: Partial<Order>) => {
    try {
      const updatedOrder = await orderApiService.update(orderId, orderData);
      dispatch(entitiesActions.updateOrder({ order: updatedOrder }));
      return updatedOrder;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la commande:', error);
      throw error;
    }
  }, [dispatch]);

  // Update order status avec possibilité de mise à jour en masse des orderLines
  const updateOrderStatus = useCallback(async (orderId: string, statusData: UpdateOrderStatusPayload) => {
    try {
      const updatedOrder = await orderApiService.updateStatus(orderId, statusData);
      dispatch(entitiesActions.updateOrder({ order: updatedOrder }));
      return updatedOrder;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut de la commande:', error);
      throw error;
    }
  }, [dispatch]);

  const deleteOrder = useCallback(async (orderId: string) => {
    try {
      await orderApiService.delete(orderId);
      dispatch(entitiesActions.deleteOrder({ orderId }));
    } catch (error) {
      console.error('Erreur lors de la suppression de la commande:', error);
      throw error;
    }
  }, [dispatch, orders, deleteOrderLines]);

  // Utilitaires
  const getOrderById = useCallback((orderId: string) => {
    return orders.find(order => order.id === orderId) || null;
  }, [orders]);

  const getOrderByTableId = useCallback((tableId: string) => {
    // Retourne la commande active de la table (non terminée et non brouillon)
    return orders.find(order => 
      order.tableId === tableId && 
      order.status !== Status.TERMINATED && 
      order.status !== Status.DRAFT
    ) || null;
  }, [orders]);

  const getOrdersByStatus = useCallback((status: Status) => {
    return orders.filter(order => order.status === status);
  }, [orders]);

  const getActiveOrders = useCallback(() => {
    return orders.filter(order => 
      order.status !== Status.TERMINATED && 
      order.status !== Status.DRAFT
    );
  }, [orders]);

  const hasActiveOrder = useCallback((tableId: string) => {
    return orders.some(order => 
      order.tableId === tableId && 
      order.status !== Status.TERMINATED && 
      order.status !== Status.DRAFT
    );
  }, [orders]);


  return {
    // Données
    orders,
    currentRoomOrders,
    selectedTableOrder,
    
    // État
    loading,
    error,
    
    // Actions CRUD
    loadOrdersForRoom,
    loadAllOrders,
    createOrder,
    updateOrder,
    updateOrderStatus,
    deleteOrder,
    
    // Utilitaires
    getOrderById,
    getOrderByTableId,
    getOrdersByStatus,
    getActiveOrders,
    hasActiveOrder,
  };
};