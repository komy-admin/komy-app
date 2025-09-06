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
import { orderApiService, UpdateOrderStatusPayload } from '~/api/order.api';
import { useOrderLines } from '~/hooks/useOrderLines';
import { Status } from '~/types/status.enum';
import { Order } from '~/types/order.types';
import { OrderLine } from '~/types/order-line.types';
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

  const loadAllOrders = useCallback(async () => {
    try {
      dispatch(restaurantActions.setLoadingOrders(true));
      const queryString = FilterQueryBuilder.build({
        filters: [],
        sort: { field: 'updatedAt', direction: 'asc' },
        perPage: 500
      });
      
      const { data: orders } = await orderApiService.getAll(queryString);
      dispatch(restaurantActions.setAllOrders({ orders }));
      return orders;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement de toutes les commandes';
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

  // const updateOrder = useCallback(async (order: Order) => {
  //   try {
  //     const updatedOrder = await orderApiService.update(order.id, order);
  //     dispatch(restaurantActions.updateOrder({ order: updatedOrder }));
  //     return updatedOrder;
  //   } catch (error) {
  //     console.error('Erreur lors de la mise à jour de la commande:', error);
  //     throw error;
  //   }
  // }, [dispatch]);

  // 🆕 Nouvelle fonction pour la mise à jour complète (bulk update)
  const updateOrder = useCallback(async (payload: Order) => {
    try {
      const orderId = payload.id;
      const updatedOrder = await orderApiService.update(orderId, payload);

      dispatch(restaurantActions.updateOrder({ order: updatedOrder }));
      return updatedOrder;
    } catch (error) {
      console.error('Erreur lors de la mise à jour complète de la commande:', error);
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

  // 🆕 Nouvelle fonction utilisant la route PATCH /order/:id/status
  const updateOrderStatus = useCallback(async (payload: UpdateOrderStatusPayload & { orderId: string }) => {
    try {
      const { orderId, ...statusPayload } = payload;

      // Validation : au moins un des deux arrays doit être fourni
      if ((!statusPayload.orderLineIds || statusPayload.orderLineIds.length === 0) && 
          (!statusPayload.orderLineItemIds || statusPayload.orderLineItemIds.length === 0)) {
        throw new Error('Au moins un orderLineId ou orderLineItemId doit être fourni');
      }

      const updatedOrder = await orderApiService.updateStatus(orderId, statusPayload);
      
      // Le WebSocket se charge de la synchronisation des données
      return updatedOrder;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      throw error;
    }
  }, [dispatch]);

  // 🆕 Fonction helper pour mettre à jour le statut d'OrderLines (items individuels)
  const updateOrderLinesStatus = useCallback(async (orderId: string, orderLineIds: string[], status: Status) => {
    return updateOrderStatus({
      orderId,
      status,
      orderLineIds,
    });
  }, [updateOrderStatus]);

  // 🆕 Fonction helper pour mettre à jour le statut d'OrderLineItems (items de menu)
  const updateOrderLineItemsStatus = useCallback(async (orderId: string, orderLineItemIds: string[], status: Status) => {
    return updateOrderStatus({
      orderId,
      status,
      orderLineItemIds,
    });
  }, [updateOrderStatus]);

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
    loadAllOrders,
    
    // Actions CRUD pour les orders
    createOrder,
    updateOrder,
    deleteOrder,
    updateOrderStatus,
    
    // 🆕 Nouvelles fonctions de statut (API spécialisée)
    updateOrderLinesStatus,
    updateOrderLineItemsStatus,
    
    // Actions CRUD pour les orderItems (migrées vers OrderLine)
    deleteOrderItem,
    deleteManyOrderItems,
    updateOrderItemStatus,
    
    // Utilitaires (anciens)
    getOrderById,
    getOrderByTableId,
    getOrderItems,
    getOrdersByRoom,
    
    // Nouveaux utilitaires pour structure avec menus
    getOrderIndividualItems,
    getOrderMenus,
    getOrderAllItems,
    hasOrderMenus,
    hasOrderIndividualItems,
  };
};