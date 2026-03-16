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

      const enrichedOrder = {
        ...newOrder,
        table: newOrder.table || (tableId ? { id: tableId, name: `Table ${tableId}` } : null)
      };

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

      dispatch(entitiesActions.updateOrder({ order: orderWithNewLines }));

      return orderWithNewLines;
    } catch (error) {
      console.error('Erreur lors de la création des lignes de commande:', error);
      throw error;
    }
  }, [dispatch]);

  /**
   * Supprimer une ligne de commande
   */
  const deleteOrderLine = useCallback(async (orderLineId: string): Promise<void> => {
    try {
      await orderLineApiService.delete(orderLineId);

      dispatch(entitiesActions.deleteOrderLine({ orderLineId }));
    } catch (error) {
      console.error('Erreur lors de la suppression de la ligne de commande:', error);
      throw error;
    }
  }, [dispatch]);

  /**
   * Supprimer plusieurs lignes en une fois
   */
  const deleteOrderLines = useCallback(async (orderLineIds: string[]): Promise<void> => {
    try {
      await orderLineApiService.deleteLines(orderLineIds);

      dispatch(entitiesActions.deleteOrderLinesBatch({ orderLineIds }));
    } catch (error) {
      console.error('Erreur lors de la suppression des lignes:', error);
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
