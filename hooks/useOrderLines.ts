import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { RootState, entitiesActions } from '~/store';
import { selectOrderLines, selectOrderLineItems } from '~/store/selectors';
import { orderLineApiService } from '~/api/order-line.api';
import { orderApiService } from '~/api/order.api';
import { 
  OrderLine, 
  OrderLineItem,
  CreateOrderLineRequest,
  UpdateOrderLineRequest,
  UpdateOrderLineItemRequest,
  OrderLineType
} from '~/types/order-line.types';
import { Order } from '~/types/order.types';
import { Status } from '~/types/status.enum';

/**
 * Hook spécialisé pour la gestion des OrderLines (nouvelle architecture unifiée)
 */
export const useOrderLines = () => {
  const dispatch = useDispatch();

  // Sélecteurs de base
  const allOrderLines = useSelector(selectOrderLines);
  const allOrderLineItems = useSelector(selectOrderLineItems);

  // Sélecteurs spécifiques
  const getOrderLineById = useCallback((orderLineId: string) => {
    return allOrderLines.find(line => line.id === orderLineId) || null;
  }, [allOrderLines]);

  const getOrderLineItemById = useCallback((orderLineItemId: string) => {
    return allOrderLineItems.find(item => item.id === orderLineItemId) || null;
  }, [allOrderLineItems]);

  const getOrderLinesByOrderId = useCallback((orderId: string) => {
    return allOrderLines.filter(line => line.orderId === orderId);
  }, [allOrderLines]);

  const getOrderHasLines = useCallback((orderId: string) => {
    return allOrderLines.some(line => line.orderId === orderId);
  }, [allOrderLines]);

  const getOrderStatusFromLines = useCallback((orderId: string) => {
    const orderLines = getOrderLinesByOrderId(orderId);
    if (!orderLines.length) return null;

    const allStatuses: Status[] = [];
    
    orderLines.forEach(line => {
      if (line.type === OrderLineType.ITEM && line.status) {
        allStatuses.push(line.status);
      } else if (line.type === OrderLineType.MENU && line.items) {
        line.items.forEach(menuItem => {
          const orderLineItem = getOrderLineItemById(menuItem.id);
          if (orderLineItem) {
            allStatuses.push(orderLineItem.status);
          }
        });
      }
    });
    
    if (allStatuses.every(s => s === Status.SERVED)) return Status.SERVED;
    if (allStatuses.some(s => s === Status.ERROR)) return Status.ERROR;
    if (allStatuses.some(s => s === Status.INPROGRESS)) return Status.INPROGRESS;
    if (allStatuses.some(s => s === Status.READY)) return Status.READY;
    if (allStatuses.some(s => s === Status.TERMINATED)) return Status.TERMINATED;
    return Status.PENDING;
  }, [allOrderLines, getOrderLinesByOrderId, getOrderLineItemById]);

  const getOrderMenuProgress = useCallback((orderId: string) => {
    const orderLines = getOrderLinesByOrderId(orderId);
    const menuLines = orderLines.filter(line => line.type === OrderLineType.MENU);
    
    if (!menuLines.length) return { completed: 0, total: 0, percentage: 0, hasErrors: false };

    let totalCompleted = 0;
    let totalItems = 0;
    let hasErrors = false;

    menuLines.forEach(line => {
      if (line.items) {
        const items = line.items.map(item => getOrderLineItemById(item.id)).filter(Boolean) as OrderLineItem[];
        const completedCount = items.filter(item => 
          [Status.READY, Status.SERVED, Status.TERMINATED].includes(item.status)
        ).length;
        
        totalCompleted += completedCount;
        totalItems += items.length;
        hasErrors = hasErrors || items.some(item => item.status === Status.ERROR);
      }
    });

    return {
      completed: totalCompleted,
      total: totalItems,
      percentage: totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0,
      hasErrors
    };
  }, [getOrderLinesByOrderId, getOrderLineItemById]);

  // Actions pour gérer les OrderLines

  /**
   * Charger toutes les lignes d'une commande
   */
  const loadOrderLines = useCallback(async (orderId: string): Promise<OrderLine[]> => {
    try {
      const orderLines = await orderLineApiService.getByOrderId(orderId);
      // Note: Nous pourrions dispatcher une action pour mettre à jour le store
      // mais pour l'instant, on suppose que les données sont déjà synchronisées via WebSocket
      return orderLines;
    } catch (error) {
      console.error('Erreur lors du chargement des lignes de commande:', error);
      throw error;
    }
  }, []);

  /**
   * Créer une ligne de commande
   */
  const createOrderLine = useCallback(async (orderId: string, lineData: CreateOrderLineRequest): Promise<OrderLine> => {
    try {
      const newOrderLine = await orderLineApiService.createLine(orderId, lineData);
      
      // Dispatcher l'action pour mettre à jour le store
      dispatch(entitiesActions.updateOrderLine({ orderLine: newOrderLine }));
      
      return newOrderLine;
    } catch (error) {
      console.error('Erreur lors de la création de la ligne de commande:', error);
      throw error;
    }
  }, [dispatch]);

  /**
   * Créer une commande avec les lignes de commande directement
   * CETTE FONCTION SERA UTILISÉE QUAND LE SERVEUR VALIDE LA COMMANDE
   */
  const createOrderWithLines = useCallback(async (
    tableId: string, 
    linesData: CreateOrderLineRequest[]
  ): Promise<Order> => {
    try {
      // Créer directement la commande avec toutes les lines
      const newOrder = await orderApiService.create({
        tableId,
        lines: linesData, // Envoyer les CreateOrderLineRequest directement
        status: Status.DRAFT
      });
      
      // Enrichir l'order avec les infos de table si manquantes (fallback côté frontend)
      const enrichedOrder = {
        ...newOrder,
        table: newOrder.table || { id: tableId, name: `Table ${tableId}` } // Fallback minimal
      };
      
      // Dispatcher l'action pour mettre à jour le store
      dispatch(entitiesActions.createOrder({ order: enrichedOrder }));
      
      return enrichedOrder;
    } catch (error) {
      console.error('Erreur lors de la création de la commande avec lignes:', error);
      throw error;
    }
  }, [dispatch]);

  /**
   * Créer plusieurs lignes de commande en une fois
   */
  const createOrderLines = useCallback(async (orderId: string, linesData: CreateOrderLineRequest[]): Promise<Order> => {
    try {
      const orderWithNewLines = await orderLineApiService.createLines(orderId, linesData);
      
      // Dispatcher l'action pour mettre à jour le store
      dispatch(entitiesActions.updateOrder({ order: orderWithNewLines }));
      
      return orderWithNewLines;
    } catch (error) {
      console.error('Erreur lors de la création des lignes de commande:', error);
      throw error;
    }
  }, [dispatch]);

  /**
   * Modifier une ligne de commande
   */
  const updateOrderLine = useCallback(async (orderLineId: string, updateData: UpdateOrderLineRequest): Promise<OrderLine> => {
    try {
      const updatedOrderLine = await orderLineApiService.update(orderLineId, updateData);
      
      // Dispatcher l'action pour mettre à jour le store
      dispatch(entitiesActions.updateOrderLine({ orderLine: updatedOrderLine }));
      
      return updatedOrderLine;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la ligne de commande:', error);
      throw error;
    }
  }, [dispatch]);

  /**
   * Supprimer une ligne de commande
   */
  const deleteOrderLine = useCallback(async (orderLineId: string): Promise<void> => {
    try {
      await orderLineApiService.delete(orderLineId);
      
      // Dispatcher l'action pour mettre à jour le store
      dispatch(entitiesActions.deleteOrderLine({ orderLineId }));
    } catch (error) {
      console.error('Erreur lors de la suppression de la ligne de commande:', error);
      throw error;
    }
  }, [dispatch]);

  /**
   * Modifier le statut d'un item dans un menu
   */
  const updateOrderLineItemStatus = useCallback(async (
    orderLineItemId: string, 
    status: Status
  ): Promise<void> => {
    try {
      await orderLineApiService.updateLineItemStatus(orderLineItemId, { status });
      
      // Dispatcher l'action pour mettre à jour le store
      dispatch(entitiesActions.orderLineItemsStatusUpdated({ 
        orderLineItemIds: [orderLineItemId], 
        status 
      }));
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut de l\'item:', error);
      throw error;
    }
  }, [dispatch]);

  /**
   * Modifier le statut de plusieurs items en une fois
   */
  const updateManyOrderLineItemsStatus = useCallback(async (
    orderLineItemIds: string[], 
    status: Status
  ): Promise<void> => {
    try {
      await orderLineApiService.updateManyItemsStatus(orderLineItemIds, status);
      
      // Dispatcher l'action pour mettre à jour le store
      dispatch(entitiesActions.orderLineItemsStatusUpdated({ 
        orderLineItemIds, 
        status 
      }));
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut des items:', error);
      throw error;
    }
  }, [dispatch]);

  /**
   * Modifier le statut de plusieurs lignes en une fois (pour items individuels)
   */
  const updateManyOrderLinesStatus = useCallback(async (
    orderLineIds: string[], 
    status: Status
  ): Promise<void> => {
    try {
      await orderLineApiService.updateManyLinesStatus(orderLineIds, status);
      
      // Dispatcher l'action pour mettre à jour le store
      dispatch(entitiesActions.orderLinesStatusUpdated({ 
        orderLineIds, 
        status 
      }));
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut des lignes:', error);
      throw error;
    }
  }, [dispatch]);

  /**
   * Supprimer plusieurs lignes en une fois
   */
  const deleteOrderLines = useCallback(async (orderLineIds: string[]): Promise<void> => {
    try {
      await orderLineApiService.deleteLines(orderLineIds);
      
      // Dispatcher l'action pour mettre à jour le store
      dispatch(entitiesActions.deleteOrderLinesBatch({ orderLineIds }));
    } catch (error) {
      console.error('Erreur lors de la suppression des lignes:', error);
      throw error;
    }
  }, [dispatch]);

  // Fonctions utilitaires

  /**
   * Calculer le statut global d'une commande basé sur ses OrderLines
   */
  const calculateOrderStatus = useCallback((orderId: string): Status | null => {
    return getOrderStatusFromLines(orderId);
  }, [getOrderStatusFromLines]);

  /**
   * Calculer la progression d'un menu
   */
  const calculateMenuProgress = useCallback((orderLine: OrderLine) => {
    if (orderLine.type !== OrderLineType.MENU || !orderLine.items) {
      return { completed: 0, total: 0, percentage: 0, hasErrors: false };
    }

    const items = orderLine.items.map(item => getOrderLineItemById(item.id)).filter(Boolean) as OrderLineItem[];
    const completedCount = items.filter(item => 
      [Status.READY, Status.SERVED, Status.TERMINATED].includes(item.status)
    ).length;
    
    return {
      completed: completedCount,
      total: items.length,
      percentage: Math.round((completedCount / items.length) * 100),
      hasErrors: items.some(item => item.status === Status.ERROR)
    };
  }, [getOrderLineItemById]);

  return {
    // État
    allOrderLines,
    allOrderLineItems,
    
    // Sélecteurs
    getOrderLineById,
    getOrderLineItemById,
    getOrderLinesByOrderId,
    getOrderHasLines,
    getOrderStatusFromLines,
    getOrderMenuProgress,
    
    // Actions CRUD
    loadOrderLines,
    createOrderLine,
    createOrderLines,
    createOrderWithLines,
    updateOrderLine,
    deleteOrderLine,
    deleteOrderLines,
    
    // Actions de statut
    updateOrderLineItemStatus,
    updateManyOrderLineItemsStatus,
    updateManyOrderLinesStatus,
    
    // Utilitaires
    calculateOrderStatus,
    calculateMenuProgress,
  };
};