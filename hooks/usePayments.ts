import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { entitiesActions } from "~/store";
import { selectAllPayments, selectAllPaymentAllocations } from "~/store/slices/entities.slice";
import { Payment, PaymentAllocation } from "~/types/payment.types";
import { paymentApi } from "~/api/payment.api";

/**
 * Hook pour gérer les paiements et leurs allocations
 * Centralise la logique de paiement et le calcul des états de paiement
 */
export const usePayments = () => {
  const dispatch = useDispatch();

  // Sélecteurs Redux
  const paymentsFromRedux = useSelector(selectAllPayments);
  const paymentAllocations = useSelector(selectAllPaymentAllocations);

  // ==============================
  // API & Redux Operations
  // ==============================

  /**
   * Récupère les paiements d'une commande via API
   */
  const getPaymentsByOrder = useCallback(async (orderId: string) => {
    try {
      const response = await paymentApi.getByOrder(orderId);
      return response;
    } catch (error) {
      return [];
    }
  }, []);

  /**
   * Récupère les commandes avec paiements
   */
  const getOrdersWithPayments = useCallback(
    async (params?: any) => {
      try {
        const response = await paymentApi.getOrdersWithPayments(params);
        return response;
      } catch (error) {
        return [];
      }
    },
    [],
  );

  /**
   * Récupère un paiement par son ID
   */
  const getPaymentById = useCallback(async (paymentId: string) => {
    try {
      const response = await paymentApi.getById(paymentId);
      return response;
    } catch (error) {
      return null;
    }
  }, []);

  /**
   * Impression de ticket
   */
  const printTicket = useCallback(async (paymentId: string) => {
    try {
      await paymentApi.printTicket(paymentId);
      return true;
    } catch (error) {
      throw error;
    }
  }, []);

  /**
   * Récupère les logs d'audit d'un paiement
   */
  const getAuditLogs = useCallback(async (paymentId: string) => {
    try {
      const response = await paymentApi.getAuditLogs(paymentId);
      return response;
    } catch (error) {
      return [];
    }
  }, []);

  // ==============================
  // Payment State Calculations
  // ==============================

  /**
   * Sélectionne les paiements par Order
   * Cache le résultat avec useMemo pour optimiser les performances
   */
  const paymentsByOrder = useMemo(() => {
    const map = new Map<string, Payment[]>();
    paymentsFromRedux.forEach((payment) => {
      const orderId = payment.orderId;
      if (!map.has(orderId)) {
        map.set(orderId, []);
      }
      map.get(orderId)!.push(payment);
    });
    return map;
  }, [paymentsFromRedux]);

  /**
   * Sélectionne les allocations par OrderLine
   * Groupe les allocations par orderLineId pour un accès rapide
   */
  const allocationsByOrderLine = useMemo(() => {
    const map = new Map<string, PaymentAllocation[]>();
    paymentAllocations.forEach((allocation) => {
      const lineId = allocation.orderLineId;
      if (!map.has(lineId)) {
        map.set(lineId, []);
      }
      map.get(lineId)!.push(allocation);
    });
    return map;
  }, [paymentAllocations]);

  /**
   * Vérifie si une ligne de commande est payée
   * @param orderLineId ID de la ligne de commande
   * @returns true si la ligne est entièrement payée
   */
  const isOrderLinePaid = useCallback(
    (orderLineId: string): boolean => {
      const allocations = allocationsByOrderLine.get(orderLineId) || [];
      if (allocations.length === 0) return false;

      // Vérifier que toutes les allocations sont sur des paiements complétés
      return allocations.some((allocation) => {
        const payment = paymentsFromRedux.find(
          (p) => p.id === allocation.paymentId,
        );
        return payment && payment.status === "completed";
      });
    },
    [allocationsByOrderLine, paymentsFromRedux],
  );

  /**
   * Crée un nouveau paiement via API et met à jour Redux
   */
  const createPayment = useCallback(
    async (data: any) => {
      try {
        const payment = await paymentApi.createPayment(data);

        // Mise à jour Redux
        dispatch(entitiesActions.createPayment({ payment }));

        // Mise à jour des allocations si présentes
        if (payment.allocations) {
          payment.allocations.forEach((allocation: PaymentAllocation) => {
            dispatch(entitiesActions.createPaymentAllocation({ paymentAllocation: allocation }));
          });
        }

        return payment;
      } catch (error) {
        throw error;
      }
    },
    [dispatch],
  );

  /**
   * Met à jour un paiement existant
   */
  const updatePayment = useCallback(
    async (id: string, data: any) => {
      try {
        const payment = await paymentApi.update(id, data);

        // Mise à jour Redux
        dispatch(entitiesActions.updatePayment({ payment: { ...payment, id } }));

        return payment;
      } catch (error) {
        throw error;
      }
    },
    [dispatch],
  );

  /**
   * Supprime un paiement
   */
  const deletePayment = useCallback(
    async (id: string) => {
      try {
        await paymentApi.delete(id);

        // Suppression Redux - supprimer d'abord les allocations associées
        const allocations = paymentAllocations.filter(
          (a) => a.paymentId === id,
        );
        allocations.forEach((allocation) => {
          dispatch(entitiesActions.deletePaymentAllocation({ paymentAllocationId: allocation.id }));
        });

        // Puis supprimer le paiement
        dispatch(entitiesActions.deletePayment({ paymentId: id }));

        return true;
      } catch (error) {
        throw error;
      }
    },
    [dispatch, paymentAllocations],
  );

  /**
   * Effectue un remboursement total ou partiel
   */
  const refundPayment = useCallback(
    async (
      paymentId: string,
      refundData: {
        amount?: number; // Si non spécifié, remboursement total
        reason: string;
        refundMethod?: 'original' | 'cash';
      },
    ): Promise<{ refundPayment: Payment; originalPayment: Payment }> => {
      try {
        const result = await paymentApi.refundPayment(paymentId, refundData);

        // Mettre à jour les deux paiements dans Redux
        if (result.refundPayment) {
          dispatch(entitiesActions.createPayment({ payment: result.refundPayment }));
        }
        if (result.originalPayment) {
          dispatch(entitiesActions.updatePayment({ payment: result.originalPayment }));
        }

        return result;
      } catch (err) {
        throw err;
      }
    },
    [dispatch],
  );

  /**
   * Récupère les allocations pour une ligne de commande
   * @param orderLineId ID de la ligne de commande
   * @returns Liste des allocations de paiement pour cette ligne
   */
  const getAllocationsByOrderLine = useCallback(
    (orderLineId: string): PaymentAllocation[] => {
      return allocationsByOrderLine.get(orderLineId) || [];
    },
    [allocationsByOrderLine],
  );

  // ==============================
  // Export
  // ==============================

  return {
    // State
    payments: paymentsFromRedux as Payment[],
    paymentAllocations: paymentAllocations as PaymentAllocation[],
    paymentsByOrder,
    allocationsByOrderLine,

    // CRUD Operations
    createPayment,
    updatePayment,
    deletePayment,
    refundPayment,

    // Query Operations
    getPaymentById,
    getPaymentsByOrder,
    getOrdersWithPayments,
    printTicket,
    getAuditLogs,
    isOrderLinePaid,
    getAllocationsByOrderLine,
  };
};