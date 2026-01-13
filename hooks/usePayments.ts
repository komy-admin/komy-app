import { useSelector, useDispatch } from 'react-redux';
import { useCallback, useMemo } from 'react';
import { entitiesActions, RootState } from '~/store';
import { selectAllPayments, selectAllPaymentAllocations } from '~/store/slices/entities.slice';
import { paymentApiService } from '~/api/payment.api';
import type { Payment } from '~/types/payment.types';
import type { PaymentHistoryFilters, OrderWithPayments } from '~/types/payment-history.types';

/**
 * Hook spécialisé pour la gestion des paiements
 * Suit le pattern Redux comme useOrders, useMenu, etc.
 */
export const usePayments = () => {
  const dispatch = useDispatch();

  // Sélecteurs Redux
  const payments = useSelector(selectAllPayments);
  const paymentAllocations = useSelector(selectAllPaymentAllocations);
  const loading = false; // Géré globalement maintenant
  const error = null; // Géré globalement maintenant

  /**
   * Charge tous les paiements et les stocke dans Redux
   */
  const loadAllPayments = useCallback(async (): Promise<Payment[]> => {
    try {
      const { data: payments } = await paymentApiService.getAll();
      dispatch(entitiesActions.setPayments({ payments }));
      return payments;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des paiements';
      console.error('Erreur lors du chargement des paiements:', errorMessage);
      throw err;
    }
  }, [dispatch]);

  /**
   * Charge les commandes avec paiements (pour la vue historique)
   * Note: Cette fonction ne stocke pas dans Redux car c'est une vue enrichie temporaire
   */
  const getOrdersWithPayments = useCallback(async (filters: PaymentHistoryFilters): Promise<OrderWithPayments[]> => {
    try {
      const data = await paymentApiService.getOrdersWithPayments(filters);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des commandes';
      console.error('Erreur lors du chargement des commandes avec paiements:', errorMessage);
      throw err;
    }
  }, []);

  /**
   * Récupère les paiements d'une commande depuis Redux
   */
  const getPaymentsByOrder = useCallback((orderId: string): Payment[] => {
    return payments.filter(p => p.orderId === orderId);
  }, [payments]);

  /**
   * Récupère un paiement par son ID depuis Redux
   */
  const getPaymentById = useCallback((paymentId: string): Payment | undefined => {
    return payments.find(p => p.id === paymentId);
  }, [payments]);

  /**
   * Vérifie si une orderLine a des allocations de paiement (donc ne peut pas être modifiée/supprimée)
   */
  const isOrderLinePaid = useCallback((orderLineId: string): boolean => {
    return paymentAllocations.some(allocation => allocation.orderLineId === orderLineId);
  }, [paymentAllocations]);

  /**
   * Récupère les allocations pour une orderLine spécifique
   */
  const getAllocationsByOrderLine = useCallback((orderLineId: string) => {
    return paymentAllocations.filter(allocation => allocation.orderLineId === orderLineId);
  }, [paymentAllocations]);

  /**
   * Crée un nouveau paiement via API et met à jour Redux
   */
  const createPayment = useCallback(async (paymentData: Partial<Payment>): Promise<Payment> => {
    try {
      const newPayment = await paymentApiService.createPayment(paymentData as any);
      dispatch(entitiesActions.createPayment({ payment: newPayment }));
      return newPayment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du paiement';
      console.error('Erreur lors de la création du paiement:', errorMessage);
      throw err;
    }
  }, [dispatch]);

  /**
   * Met à jour un paiement existant
   */
  const updatePayment = useCallback(async (paymentId: string, paymentData: Partial<Payment>): Promise<Payment> => {
    try {
      const updatedPayment = await paymentApiService.update(paymentId, paymentData);
      dispatch(entitiesActions.updatePayment({ payment: updatedPayment }));
      return updatedPayment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour du paiement';
      console.error('Erreur lors de la mise à jour du paiement:', errorMessage);
      throw err;
    }
  }, [dispatch]);

  /**
   * Supprime un paiement
   */
  const deletePayment = useCallback(async (paymentId: string): Promise<void> => {
    try {
      await paymentApiService.delete(paymentId);
      dispatch(entitiesActions.deletePayment({ paymentId }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression du paiement';
      console.error('Erreur lors de la suppression du paiement:', errorMessage);
      throw err;
    }
  }, [dispatch]);

  /**
   * Imprime un ticket de paiement
   */
  const printTicket = useCallback(async (paymentId: string): Promise<void> => {
    try {
      await paymentApiService.printTicket(paymentId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'impression du ticket';
      console.error('Erreur lors de l\'impression du ticket:', errorMessage);
      throw err;
    }
  }, []);

  /**
   * Charge les logs d'audit d'un paiement (NF525)
   * Ne stocke pas dans Redux car c'est une donnée de consultation ponctuelle
   */
  const getAuditLogs = useCallback(async (paymentId: string): Promise<any[]> => {
    try {
      const data = await paymentApiService.getAuditLogs(paymentId);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des logs d\'audit';
      console.error('Erreur lors du chargement des logs d\'audit:', errorMessage);
      throw err;
    }
  }, []);

  return {
    // Données depuis Redux
    payments,
    paymentAllocations,

    // État
    loading,
    error,

    // Actions CRUD
    loadAllPayments,
    createPayment,
    updatePayment,
    deletePayment,

    // Utilitaires
    getPaymentById,
    getPaymentsByOrder,
    getOrdersWithPayments,
    printTicket,
    getAuditLogs,
    isOrderLinePaid,
    getAllocationsByOrderLine,
  };
};
