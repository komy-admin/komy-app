import { useSelector, useDispatch } from "react-redux";
import { useCallback, useState } from "react";
import { entitiesActions, RootState } from "~/store";
import {
  selectAllPayments,
  selectAllPaymentAllocations,
} from "~/store/slices/entities.slice";
import { paymentApiService } from "~/api/payment.api";
import type { Payment } from "~/types/payment.types";
import type {
  PaymentHistoryFilters,
  OrderWithPayments,
} from "~/types/payment-history.types";

/**
 * Hook spécialisé pour la gestion des paiements
 * Utilise l'API directement pour éviter les incohérences de cache
 */
export const usePayments = () => {
  const dispatch = useDispatch();

  // Sélecteurs Redux (gardés pour compatibilité mais non utilisés principalement)
  const paymentsFromRedux = useSelector(selectAllPayments);
  const paymentAllocations = useSelector(selectAllPaymentAllocations);

  // Loading et error states locaux
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Charge tous les paiements et les stocke dans Redux
   */
  const loadAllPayments = useCallback(async (): Promise<Payment[]> => {
    try {
      const { data: payments } = await paymentApiService.getAll();
      dispatch(entitiesActions.setPayments({ payments }));
      return payments;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des paiements";
      console.error("Erreur lors du chargement des paiements:", errorMessage);
      throw err;
    }
  }, [dispatch]);

  /**
   * Charge les commandes avec paiements (pour la vue historique)
   * Note: Cette fonction ne stocke pas dans Redux car c'est une vue enrichie temporaire
   */
  const getOrdersWithPayments = useCallback(
    async (filters: PaymentHistoryFilters): Promise<OrderWithPayments[]> => {
      try {
        const data = await paymentApiService.getOrdersWithPayments(filters);
        return data;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erreur lors du chargement des commandes";
        console.error(
          "Erreur lors du chargement des commandes avec paiements:",
          errorMessage,
        );
        throw err;
      }
    },
    [],
  );

  /**
   * Récupère les paiements d'une commande depuis l'API et les stocke dans Redux
   */
  const getPaymentsByOrder = useCallback(
    async (orderId: string): Promise<Payment[]> => {
      try {
        setLoading(true);
        setError(null);
        const payments = await paymentApiService.getByOrder(orderId);
        dispatch(entitiesActions.mergePayments({ payments }));
        return payments;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erreur lors du chargement des paiements";
        setError(errorMessage);
        console.error(
          "Erreur lors du chargement des paiements de la commande:",
          errorMessage,
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [dispatch],
  );

  /**
   * Récupère un paiement par son ID depuis l'API
   */
  const getPaymentById = useCallback(
    async (paymentId: string): Promise<Payment | null> => {
      try {
        setLoading(true);
        setError(null);
        const payment = await paymentApiService.getById(paymentId);
        // Mettre à jour Redux avec le paiement frais
        if (payment) {
          dispatch(entitiesActions.updatePayment({ payment }));
        }
        return payment;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erreur lors du chargement du paiement";
        setError(errorMessage);
        console.error("Erreur lors du chargement du paiement:", errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [dispatch],
  );

  /**
   * Vérifie si une orderLine a des allocations de paiement (donc ne peut pas être modifiée/supprimée)
   */
  const isOrderLinePaid = useCallback(
    (orderLineId: string): boolean => {
      return paymentAllocations.some(
        (allocation) => allocation.orderLineId === orderLineId,
      );
    },
    [paymentAllocations],
  );

  /**
   * Récupère les allocations pour une orderLine spécifique
   */
  const getAllocationsByOrderLine = useCallback(
    (orderLineId: string) => {
      return paymentAllocations.filter(
        (allocation) => allocation.orderLineId === orderLineId,
      );
    },
    [paymentAllocations],
  );

  /**
   * Retourne le ratio de paiement d'une orderLine (0 à 1)
   * 0 = non payé, 1 = entièrement payé, entre 0 et 1 = partiellement payé
   *
   * @param orderLineId ID de la ligne de commande
   * @param totalPrice Prix total de la ligne en centimes
   * @returns Ratio entre 0 et 1 représentant le pourcentage payé
   */
  const getOrderLinePaymentFraction = useCallback(
    (orderLineId: string, totalPrice: number): number => {
      // Si pas de prix total, retourner 0
      if (!totalPrice || totalPrice <= 0) return 0;

      // Récupérer toutes les allocations pour cette orderLine
      const allocations = paymentAllocations.filter(
        (a) => a.orderLineId === orderLineId,
      );
      if (allocations.length === 0) return 0;

      // Filtrer uniquement les allocations des paiements complétés
      const validAllocations = allocations.filter((allocation) => {
        const payment = paymentsFromRedux.find(
          (p) => p.id === allocation.paymentId,
        );
        return payment && payment.status === "completed";
      });

      // Sommer les montants alloués (allocatedAmount est en centimes)
      const paidAmount = validAllocations.reduce(
        (sum, a) => sum + a.allocatedAmount,
        0,
      );
      // Calculer le ratio (plafonné à 1 pour éviter les surpaiements)
      return Math.min(1, paidAmount / totalPrice);
    },
    [paymentAllocations, paymentsFromRedux],
  );

  /**
   * Crée un nouveau paiement via API et met à jour Redux
   */
  const createPayment = useCallback(
    async (paymentData: {
      orderId: string;
      amount: number;
      paymentMethod: Payment["paymentMethod"];
      tipAmount?: number;
      transactionReference?: string;
      metadata?: any;
      notes?: string;
      allocations: Array<{
        orderLineId: string;
        quantityFraction: number;
      }>;
    }): Promise<Payment> => {
      try {
        const newPayment = await paymentApiService.createPayment(paymentData);
        dispatch(entitiesActions.createPayment({ payment: newPayment }));
        return newPayment;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erreur lors de la création du paiement";
        console.error("Erreur lors de la création du paiement:", errorMessage);
        throw err;
      }
    },
    [dispatch],
  );

  /**
   * Met à jour un paiement existant
   */
  const updatePayment = useCallback(
    async (
      paymentId: string,
      paymentData: Partial<Payment>,
    ): Promise<Payment> => {
      try {
        const updatedPayment = await paymentApiService.update(
          paymentId,
          paymentData,
        );
        dispatch(entitiesActions.updatePayment({ payment: updatedPayment }));
        return updatedPayment;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erreur lors de la mise à jour du paiement";
        console.error(
          "Erreur lors de la mise à jour du paiement:",
          errorMessage,
        );
        throw err;
      }
    },
    [dispatch],
  );

  /**
   * Supprime un paiement
   */
  const deletePayment = useCallback(
    async (paymentId: string): Promise<void> => {
      try {
        await paymentApiService.delete(paymentId);
        dispatch(entitiesActions.deletePayment({ paymentId }));
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erreur lors de la suppression du paiement";
        console.error(
          "Erreur lors de la suppression du paiement:",
          errorMessage,
        );
        throw err;
      }
    },
    [dispatch],
  );

  /**
   * Imprime un ticket de paiement
   */
  const printTicket = useCallback(async (paymentId: string): Promise<void> => {
    try {
      await paymentApiService.printTicket(paymentId);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur lors de l'impression du ticket";
      console.error("Erreur lors de l'impression du ticket:", errorMessage);
      throw err;
    }
  }, []);

  /**
   * Charge les logs d'audit d'un paiement (NF525)
   * Ne stocke pas dans Redux car c'est une donnée de consultation ponctuelle
   */
  const getAuditLogs = useCallback(
    async (paymentId: string): Promise<any[]> => {
      try {
        const data = await paymentApiService.getAuditLogs(paymentId);
        return data;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erreur lors du chargement des logs d'audit";
        console.error(
          "Erreur lors du chargement des logs d'audit:",
          errorMessage,
        );
        throw err;
      }
    },
    [],
  );

  return {
    // Données depuis Redux (pour compatibilité)
    payments: paymentsFromRedux,
    paymentAllocations,

    // État
    loading,
    error,

    // Actions CRUD
    loadAllPayments,
    createPayment,
    updatePayment,
    deletePayment,

    // Utilitaires (maintenant async depuis l'API)
    getPaymentById,
    getPaymentsByOrder,
    getOrdersWithPayments,
    printTicket,
    getAuditLogs,
    isOrderLinePaid,
    getAllocationsByOrderLine,
    getOrderLinePaymentFraction,
  };
};
