import { useCallback, useMemo } from "react";
import { entitiesActions } from "~/store";
import {
  selectCurrentRoomId,
  selectSelectedTableId,
} from "~/store/slices/session.slice";
import { selectOrders, selectTablesRecord } from "~/store/selectors";
import { orderApiService, UpdateOrderStatusPayload } from "~/api/order.api";
import { Status } from "~/types/status.enum";
import { Order } from "~/types/order.types";
import { BulkUpdatePayload } from "~/utils/order-line-tracker";
import { filterOrdersByRoom, isOrderActive } from "~/utils/orderUtils";
import { useAppSelector, useAppDispatch } from "~/store/hooks";

/**
 * Hook spécialisé pour la gestion des commandes
 *
 * 🚀 OPTIMISATIONS v2.0 :
 * - Utilisation de fonctions utilitaires memoizables
 * - Complexité réduite grâce à filterOrdersByRoom optimisé
 */
export const useOrders = () => {
  const dispatch = useAppDispatch();

  // Sélecteurs
  const orders = useAppSelector(selectOrders);
  const tables = useAppSelector(selectTablesRecord);
  const currentRoomId = useAppSelector(selectCurrentRoomId);
  const selectedTableId = useAppSelector(selectSelectedTableId);

  // 🚀 Commandes de la salle courante (excluant les commandes terminées)
  // Utilise filterOrdersByRoom optimisé au lieu du filter inline
  const currentRoomOrders = useMemo(() => {
    if (!currentRoomId) return [];
    return filterOrdersByRoom(orders, currentRoomId, tables, false);
  }, [orders, currentRoomId, tables]);

  // 🚀 Commande de la table sélectionnée (excluant les terminées)
  // Utilise isOrderActive pour une vérification cohérente
  const selectedTableOrder = useMemo(() => {
    if (!selectedTableId) return null;
    return (
      orders.find(
        (order) => order.tableId === selectedTableId && isOrderActive(order),
      ) || null
    );
  }, [orders, selectedTableId]);

  const loadAllOrders = useCallback(async () => {
    try {
      const { data: orders } = await orderApiService.getAll();

      dispatch(entitiesActions.setOrders({ orders }));
      return orders;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erreur lors du chargement des commandes";
      console.error(
        "Erreur lors du chargement de toutes les commandes:",
        errorMessage,
      );
      throw error;
    }
  }, [dispatch]);

  const createOrder = useCallback(
    async (orderData: Partial<Order>) => {
      try {
        const newOrder = await orderApiService.create(orderData);
        dispatch(entitiesActions.createOrder({ order: newOrder }));
        return newOrder;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Erreur lors de la création de la commande";
        console.error(
          "Erreur lors de la création de la commande:",
          errorMessage,
        );
        throw error;
      }
    },
    [dispatch],
  );

  const updateOrder = useCallback(
    async (orderId: string, orderData: Partial<Order>) => {
      try {
        const updatedOrder = await orderApiService.update(orderId, orderData);
        dispatch(entitiesActions.updateOrder({ order: updatedOrder }));
        return updatedOrder;
      } catch (error) {
        console.error("Erreur lors de la mise à jour de la commande:", error);
        throw error;
      }
    },
    [dispatch],
  );

  // Update order status avec possibilité de mise à jour en masse des orderLines
  const updateOrderStatus = useCallback(
    async (orderId: string, statusData: UpdateOrderStatusPayload) => {
      try {
        const updatedOrder = await orderApiService.updateStatus(
          orderId,
          statusData,
        );
        dispatch(entitiesActions.updateOrder({ order: updatedOrder }));
        return updatedOrder;
      } catch (error) {
        console.error(
          "Erreur lors de la mise à jour du statut de la commande:",
          error,
        );
        throw error;
      }
    },
    [dispatch],
  );

  const deleteOrder = useCallback(
    async (orderId: string) => {
      try {
        await orderApiService.delete(orderId);
        dispatch(entitiesActions.deleteOrder({ orderId }));
      } catch (error) {
        throw error;
      }
    },
    [dispatch],
  );

  /**
   * Mettre à jour une commande avec ses lignes en utilisant le système de payload bulk
   */
  const updateOrderWithLines = useCallback(
    async (orderId: string, payload: BulkUpdatePayload) => {
      try {
        const updatedOrder = await orderApiService.updateWithLines(
          orderId,
          payload,
        );
        dispatch(entitiesActions.updateOrder({ order: updatedOrder }));
        return updatedOrder;
      } catch (error) {
        console.error(
          "Erreur lors de la mise à jour de la commande avec lignes:",
          error,
        );
        throw error;
      }
    },
    [dispatch],
  );

  // Utilitaires
  const getOrderById = useCallback(
    (orderId: string) => {
      return orders.find((order) => order.id === orderId) || null;
    },
    [orders],
  );

  const getOrderByTableId = useCallback(
    (tableId: string) => {
      // Retourne la commande active de la table (non terminée et non brouillon)
      return (
        orders.find(
          (order) =>
            order.tableId === tableId &&
            order.status !== Status.TERMINATED &&
            order.status !== Status.DRAFT,
        ) || null
      );
    },
    [orders],
  );

  const getOrdersByStatus = useCallback(
    (status: Status) => {
      return orders.filter((order) => order.status === status);
    },
    [orders],
  );

  const getActiveOrders = useCallback(() => {
    return orders.filter(
      (order) =>
        order.status !== Status.TERMINATED && order.status !== Status.DRAFT,
    );
  }, [orders]);

  const hasActiveOrder = useCallback(
    (tableId: string) => {
      return orders.some(
        (order) =>
          order.tableId === tableId &&
          order.status !== Status.TERMINATED &&
          order.status !== Status.DRAFT,
      );
    },
    [orders],
  );

  return {
    // Données
    orders,
    currentRoomOrders,
    selectedTableOrder,

    // Actions CRUD
    loadAllOrders,
    createOrder,
    updateOrder,
    updateOrderStatus,
    updateOrderWithLines,
    deleteOrder,

    // Utilitaires
    getOrderById,
    getOrderByTableId,
    getOrdersByStatus,
    getActiveOrders,
    hasActiveOrder,
  };
};
