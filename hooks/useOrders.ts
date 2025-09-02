import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { 
  restaurantActions,
  selectOrders,
  selectOrdersByRoomId,
  selectOrderById,
  selectOrderByTableId,
  selectCurrentRoomOrders,
  selectSelectedTableOrder,
  selectOrdersLoading,
  selectOrdersError,
} from '~/store/restaurant';
import { orderApiService } from '~/api/order.api';
import { useOrderLines } from '~/hooks/useOrderLines';
import { Status } from '~/types/status.enum';
import { Order } from '~/types/order.types';
import { FilterQueryBuilder } from './useFilter/query-builder';

/**
 * Hook spécialisé pour la gestion des commandes
 */
export const useOrders = () => {
  const dispatch = useDispatch();
  const { 
    deleteOrderLine, 
    deleteOrderLines, 
    updateManyOrderLinesStatus 
  } = useOrderLines();

  // Sélecteurs
  const orders = useSelector((state: any) => selectOrders({ orders: state.restaurant.orders }));
  const currentRoomOrders = useSelector(selectCurrentRoomOrders);
  const selectedTableOrder = useSelector(selectSelectedTableOrder);
  const loading = useSelector((state: any) => selectOrdersLoading({ orders: state.restaurant.orders }));
  const error = useSelector((state: any) => selectOrdersError({ orders: state.restaurant.orders }));

  // Actions asynchrones pour charger les données
  const loadOrdersForRoom = useCallback(async (roomId: string) => {
    try {
      dispatch(restaurantActions.setLoadingOrders(true));
      
      // Utiliser FilterQueryBuilder pour construire la query string correctement
      const queryString = FilterQueryBuilder.build({
        filters: [
          { field: 'table.roomId', value: roomId, operator: '=' }
        ],
        sort: { field: 'updatedAt', direction: 'asc' },
        perPage: 100
      });
      
      const { data: orders } = await orderApiService.getAll(queryString);
      dispatch(restaurantActions.setOrders({ orders, roomId }));
      return orders;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement des commandes';
      dispatch(restaurantActions.setErrorOrders(errorMessage));
      throw error;
    }
  }, [dispatch]);

  // Actions pour gérer les commandes
  const createOrder = useCallback(async (tableId: string) => {
    try {
      const newOrder = await orderApiService.create({
        tableId,
        lines: [],
        status: Status.DRAFT
      });

      dispatch(restaurantActions.createOrder({ order: newOrder }));
      return newOrder;
    } catch (error) {
      console.error('Erreur lors de la création de la commande:', error);
      throw error;
    }
  }, [dispatch]);

  const updateOrder = useCallback(async (order: Order) => {
    try {
      const updatedOrder = await orderApiService.update(order.id, order);
      dispatch(restaurantActions.updateOrder({ order: updatedOrder }));
      return updatedOrder;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la commande:', error);
      throw error;
    }
  }, [dispatch]);

  const deleteOrder = useCallback(async (orderId: string) => {
    try {
      await orderApiService.delete(orderId);
      dispatch(restaurantActions.deleteOrder({ orderId }));
    } catch (error) {
      console.error('Erreur lors de la suppression de la commande:', error);
      throw error;
    }
  }, [dispatch]);

  const updateOrderStatus = useCallback(async (
    orderId: string, 
    status: Status, 
    itemTypeId?: string
  ) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        throw new Error('Commande non trouvée');
      }

      // Récupérer les OrderLines à mettre à jour
      let orderLinesToUpdate = order.lines || [];
      
      if (itemTypeId) {
        // Filtrer par itemType si spécifié (pour l'instant on met à jour toutes les lignes)
        orderLinesToUpdate = orderLinesToUpdate.filter(line => line.type === 'ITEM');
      }

      const orderLineIds = orderLinesToUpdate.map(line => line.id);

      if (orderLineIds.length > 0) {
        await updateManyOrderLinesStatus(orderLineIds, status);
      }

      return { orderId, status, itemTypeId };
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      throw error;
    }
  }, [orders, updateManyOrderLinesStatus]);

  // Utilitaires
  const getOrderById = useCallback((orderId: string) => {
    return orders.find(order => order.id === orderId) || null;
  }, [orders]);

  const getOrderByTableId = useCallback((tableId: string) => {
    return orders.find(order => order.tableId === tableId) || null;
  }, [orders]);

  const getOrderItems = useCallback((orderId: string) => {
    const order = getOrderById(orderId);
    return order?.lines || [];
  }, [getOrderById]);

  const getOrderItemsByType = useCallback((orderId: string, itemTypeId: string) => {
    const order = getOrderById(orderId);
    if (!order) return [];
    
    // Filtrer les OrderLines de type ITEM (pour l'instant on retourne toutes les lignes ITEM)
    return (order.lines || []).filter(line => line.type === 'ITEM');
  }, [getOrderById]);

  const getOrdersByRoom = useCallback((roomId: string) => {
    return orders.filter(order => order.table?.roomId === roomId);
  }, [orders]);

  // Nouvelles méthodes pour la structure OrderLine
  const getOrderIndividualItems = useCallback((orderId: string) => {
    const order = getOrderById(orderId);
    if (!order) return [];
    // Retourner les OrderLines de type ITEM
    return (order.lines || []).filter(line => line.type === 'ITEM');
  }, [getOrderById]);

  const getOrderMenus = useCallback((orderId: string) => {
    const order = getOrderById(orderId);
    if (!order) return [];
    // Retourner les OrderLines de type MENU
    return (order.lines || []).filter(line => line.type === 'MENU');
  }, [getOrderById]);

  const getOrderAllItems = useCallback((orderId: string) => {
    const order = getOrderById(orderId);
    if (!order) return [];
    
    // Retourner toutes les OrderLines
    return order.lines || [];
  }, [getOrderById]);

  const hasOrderMenus = useCallback((orderId: string) => {
    const order = getOrderById(orderId);
    return Boolean(order?.lines && order.lines.some(line => line.type === 'MENU'));
  }, [getOrderById]);

  const hasOrderIndividualItems = useCallback((orderId: string) => {
    const order = getOrderById(orderId);
    return Boolean(order?.lines && order.lines.some(line => line.type === 'ITEM'));
  }, [getOrderById]);

  // Actions pour les orderItems - MIGRÉES vers OrderLine
  const deleteOrderItem = useCallback(async (orderLineId: string) => {
    try {
      await deleteOrderLine(orderLineId);
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'orderLine:', error);
      throw error;
    }
  }, [deleteOrderLine]);

  const deleteManyOrderItems = useCallback(async (orderLineIds: string[]) => {
    try {
      await deleteOrderLines(orderLineIds);
      
      return {
        deletedCount: orderLineIds.length,
        deletedIds: orderLineIds
      };
    } catch (error) {
      console.error('Erreur lors de la suppression multiple d\'orderLines:', error);
      throw error;
    }
  }, [deleteOrderLines]);

  const updateOrderItemStatus = useCallback(async (orderLineIds: string[], status: Status) => {
    try {
      await updateManyOrderLinesStatus(orderLineIds, status);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut des orderLines:', error);
      throw error;
    }
  }, [updateManyOrderLinesStatus]);

  // NOTE: Les méthodes de création d'orderItems sont maintenant gérées 
  // par OrderItemsForm via useOrderLines.createOrderLines() et createOrderWithLines()

  return {
    // Données
    orders,
    currentRoomOrders,
    selectedTableOrder,
    
    // État
    loading,
    error,
    
    // Actions de chargement
    loadOrdersForRoom,
    
    // Actions CRUD pour les orders
    createOrder,
    updateOrder,
    deleteOrder,
    updateOrderStatus,
    
    // Actions CRUD pour les orderItems (migrées vers OrderLine)
    deleteOrderItem,
    deleteManyOrderItems,
    updateOrderItemStatus,
    
    // Utilitaires (anciens)
    getOrderById,
    getOrderByTableId,
    getOrderItems,
    getOrderItemsByType,
    getOrdersByRoom,
    
    // Nouveaux utilitaires pour structure avec menus
    getOrderIndividualItems,
    getOrderMenus,
    getOrderAllItems,
    hasOrderMenus,
    hasOrderIndividualItems,
  };
};