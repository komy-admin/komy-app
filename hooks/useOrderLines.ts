import { useCallback } from 'react';
import { entitiesActions } from '~/store';
import { orderLineApiService } from '~/api/order-line.api';
import { orderApiService } from '~/api/order.api';
import { CreateOrderLineRequest } from '~/types/order-line.types';
import { Order } from '~/types/order.types';
import { Status } from '~/types/status.enum';
import { useAppDispatch } from '~/store/hooks';

/**
 * Hook spécialisé pour la gestion des OrderLines
 */
export const useOrderLines = () => {
  const dispatch = useAppDispatch();

  /**
   * Créer une commande avec les lignes de commande directement
   * CETTE FONCTION EST UTILISÉE QUAND LE SERVEUR VALIDE LA COMMANDE POUR LA PREMIÈRE FOIS
   */
  const createOrderWithLines = useCallback(async (
    tableId: string | null | undefined,
    linesData: CreateOrderLineRequest[],
    status: Status = Status.DRAFT
  ): Promise<Order> => {
    try {
      const newOrder = await orderApiService.createWithLines({
        ...(tableId ? { tableId } : {}),
        lines: linesData,
        status
      });

      dispatch(entitiesActions.createOrder({ order: newOrder }));
      return newOrder;
    } catch (error) {
      throw error;
    }
  }, [dispatch]);

  /**
   * Créer plusieurs lignes de commande en une fois
   */
  const createOrderLines = useCallback(async (orderId: string, linesData: CreateOrderLineRequest[]): Promise<Order> => {
    try {
      const orderWithNewLines = await orderLineApiService.createLines(orderId, linesData);

      dispatch(entitiesActions.updateOrder({ order: orderWithNewLines }));

      return orderWithNewLines;
    } catch (error) {
      throw error;
    }
  }, [dispatch]);

  /**
   * Supprimer une ligne de commande
   */
  const deleteOrderLine = useCallback(async (
    orderLineId: string,
    reason?: string,
    notes?: string
  ): Promise<void> => {
    try {
      await orderLineApiService.deleteLine(orderLineId, reason, notes);

      dispatch(entitiesActions.deleteOrderLine({ orderLineId }));
    } catch (error) {
      throw error;
    }
  }, [dispatch]);

  /**
   * Supprimer plusieurs lignes en une fois
   */
  const deleteOrderLines = useCallback(async (
    orderLineIds: string[],
    reason?: string,
    notes?: string
  ): Promise<void> => {
    try {
      await orderLineApiService.deleteLines(orderLineIds, reason, notes);

      dispatch(entitiesActions.deleteOrderLinesBatch({ orderLineIds }));
    } catch (error) {
      throw error;
    }
  }, [dispatch]);

  return {
    createOrderLines,
    createOrderWithLines,
    deleteOrderLine,
    deleteOrderLines,
  };
};
