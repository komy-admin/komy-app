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
import { orderItemApiService } from '~/api/order-item.api';
import { Status } from '~/types/status.enum';
import { Order } from '~/types/order.types';
import { FilterQueryBuilder } from './useFilter/query-builder';

/**
 * Hook spécialisé pour la gestion des commandes
 */
export const useOrders = () => {
  const dispatch = useDispatch();

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

      let orderItemsToUpdate;
      if (itemTypeId) {
        orderItemsToUpdate = order.orderItems.filter(
          orderItem => orderItem.item.itemType.id === itemTypeId
        );
      } else {
        orderItemsToUpdate = order.orderItems;
      }

      const orderItemsIds = orderItemsToUpdate.map(orderItem => orderItem.id);

      await orderItemApiService.updateManyStatus(orderItemsIds, status);

      dispatch(restaurantActions.updateOrderStatus({
        orderId,
        status,
        itemTypeId,
      }));

      return { orderId, status, itemTypeId };
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      throw error;
    }
  }, [orders, dispatch]);

  // Utilitaires
  const getOrderById = useCallback((orderId: string) => {
    return orders.find(order => order.id === orderId) || null;
  }, [orders]);

  const getOrderByTableId = useCallback((tableId: string) => {
    return orders.find(order => order.tableId === tableId) || null;
  }, [orders]);

  const getOrderItems = useCallback((orderId: string) => {
    const order = getOrderById(orderId);
    return order?.orderItems || [];
  }, [getOrderById]);

  const getOrderItemsByType = useCallback((orderId: string, itemTypeId: string) => {
    const order = getOrderById(orderId);
    if (!order) return [];
    
    return order.orderItems.filter(
      orderItem => orderItem.item.itemType.id === itemTypeId
    );
  }, [getOrderById]);

  const getOrdersByRoom = useCallback((roomId: string) => {
    return orders.filter(order => order.table?.roomId === roomId);
  }, [orders]);

  // Nouvelles méthodes pour la structure avec menus
  const getOrderIndividualItems = useCallback((orderId: string) => {
    const order = getOrderById(orderId);
    if (order?.individualItems) {
      return order.individualItems;
    }
    // Fallback: filtrer les items sans menuGroupId
    return order?.orderItems?.filter(item => !item.menuGroupId) || [];
  }, [getOrderById]);

  const getOrderMenus = useCallback((orderId: string) => {
    const order = getOrderById(orderId);
    return order?.menus || [];
  }, [getOrderById]);

  const getOrderAllItems = useCallback((orderId: string) => {
    const order = getOrderById(orderId);
    if (!order) return [];
    
    const allItems = [];
    
    // Ajouter les items individuels
    if (order.individualItems) {
      allItems.push(...order.individualItems);
    }
    
    // Ajouter les items des menus
    if (order.menus) {
      order.menus.forEach(menu => {
        if (menu.orderItems) {
          allItems.push(...menu.orderItems);
        }
      });
    }
    
    // Fallback sur l'ancienne structure si la nouvelle est vide
    if (allItems.length === 0 && order.orderItems) {
      allItems.push(...order.orderItems);
    }
    
    return allItems;
  }, [getOrderById]);

  const hasOrderMenus = useCallback((orderId: string) => {
    const order = getOrderById(orderId);
    return Boolean(order?.menus && order.menus.length > 0);
  }, [getOrderById]);

  const hasOrderIndividualItems = useCallback((orderId: string) => {
    const order = getOrderById(orderId);
    return Boolean(order?.individualItems && order.individualItems.length > 0);
  }, [getOrderById]);

  // Actions pour les orderItems
  const createOrderItem = useCallback(async (
    orderId: string, 
    itemId: string, 
    status: Status = Status.DRAFT,
    menuGroupId?: string | null
  ) => {
    try {
      const newOrderItem = await orderItemApiService.create({
        orderId,
        itemId,
        status,
        menuGroupId
      });

      // Mettre à jour le store Redux
      dispatch(restaurantActions.updateOrderItem({ orderItem: newOrderItem }));
      return newOrderItem;
    } catch (error) {
      console.error('Erreur lors de la création de l\'orderItem:', error);
      throw error;
    }
  }, [dispatch]);

  const deleteOrderItem = useCallback(async (orderItemId: string) => {
    try {
      await orderItemApiService.delete(orderItemId);
      
      // Mettre à jour le store Redux
      dispatch(restaurantActions.deleteOrderItem({ orderItemId }));
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'orderItem:', error);
      throw error;
    }
  }, [dispatch]);

  const deleteManyOrderItems = useCallback(async (orderItemIds: string[]) => {
    try {
      const result = await orderItemApiService.deleteManyOrderItems(orderItemIds);
      
      // Mettre à jour le store Redux pour chaque item supprimé
      result.deletedIds.forEach(orderItemId => {
        dispatch(restaurantActions.deleteOrderItem({ orderItemId }));
      });
      
      return result;
    } catch (error) {
      console.error('Erreur lors de la suppression multiple d\'orderItems:', error);
      throw error;
    }
  }, [dispatch]);

  const updateOrderItemStatus = useCallback(async (orderItemIds: string[], status: Status) => {
    try {
      const result = await orderItemApiService.updateManyStatus(orderItemIds, status);
      
      dispatch(restaurantActions.orderItemsStatusUpdated({
        orderItemIds,
        status,
        updatedAt: result.updatedAt || new Date().toISOString()
      }));

    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut des orderItems:', error);
      throw error;
    }
  }, [dispatch]);

  // Nouvelle méthode pour créer des orderItems de menu
  const createMenuOrderItems = useCallback(async (
    orderId: string,
    menuGroupId: string,
    items: Array<{ itemId: string; status?: Status }>
  ) => {
    try {
      const orderItems = await Promise.all(
        items.map(({ itemId, status = Status.DRAFT }) =>
          orderItemApiService.create({
            orderId,
            itemId,
            status,
            menuGroupId
          })
        )
      );

      // Mettre à jour le store Redux pour chaque item
      orderItems.forEach(orderItem => {
        dispatch(restaurantActions.updateOrderItem({ orderItem }));
      });

      return orderItems;
    } catch (error) {
      console.error('Erreur lors de la création des orderItems de menu:', error);
      throw error;
    }
  }, [dispatch]);

  // Méthode pour créer un item individuel (à la carte)
  const createIndividualOrderItem = useCallback(async (
    orderId: string,
    itemId: string,
    status: Status = Status.DRAFT
  ) => {
    return createOrderItem(orderId, itemId, status, null);
  }, [createOrderItem]);

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
    
    // Actions CRUD pour les orderItems
    createOrderItem,
    createMenuOrderItems,
    createIndividualOrderItem,
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