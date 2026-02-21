import { useState, useCallback } from 'react';
import { cashRegisterApiService, CashRegisterSession, CloseSummary } from '~/api/cash-register.api';

/**
 * Hook pour gérer la caisse enregistreuse
 *
 * Fournit les fonctions pour :
 * - Récupérer la session en cours
 * - Ouvrir une nouvelle session
 * - Fermer la session avec comptage
 * - Générer le Z
 */
export function useCashRegister() {
  const [currentSession, setCurrentSession] = useState<CashRegisterSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Récupérer la session en cours
   */
  const getCurrentSession = useCallback(async (): Promise<CashRegisterSession | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const session = await cashRegisterApiService.getCurrent();
      setCurrentSession(session);
      return session;
    } catch (err: any) {
      console.error('Erreur récupération session:', err);
      setError(err.response?.data?.error || err.message || 'Erreur lors de la récupération de la session');
      setCurrentSession(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Ouvrir une nouvelle session
   */
  const openSession = useCallback(async (
    openingBalance: number,
    notes?: string
  ): Promise<CashRegisterSession> => {
    try {
      setIsLoading(true);
      setError(null);

      const session = await cashRegisterApiService.open(openingBalance, notes);
      setCurrentSession(session);
      return session;
    } catch (err: any) {
      console.error('Erreur ouverture session:', err);
      setError(err.response?.data?.error || err.message || 'Erreur lors de l\'ouverture de la session');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fermer la session en cours
   */
  const closeSession = useCallback(async (
    actualCash: number,
    notes?: string
  ): Promise<CloseSummary> => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await cashRegisterApiService.close(actualCash, notes);
      setCurrentSession(null); // La session est fermée
      return result;
    } catch (err: any) {
      console.error('Erreur fermeture session:', err);
      setError(err.response?.data?.error || err.message || 'Erreur lors de la fermeture de la session');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Récupérer l'historique des sessions
   */
  const getSessionHistory = useCallback(async (
    page = 1,
    limit = 20
  ): Promise<{
    data: CashRegisterSession[];
    meta: any;
  }> => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await cashRegisterApiService.getHistory(page, limit);
      return result;
    } catch (err: any) {
      console.error('Erreur récupération historique:', err);
      setError(err.response?.data?.error || err.message || 'Erreur lors de la récupération de l\'historique');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Générer un rapport Z
   */
  const generateZReport = useCallback(async (sessionId: string): Promise<any> => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await cashRegisterApiService.generateZReport(sessionId);
      return result;
    } catch (err: any) {
      console.error('Erreur génération Z:', err);
      setError(err.response?.data?.error || err.message || 'Erreur lors de la génération du Z');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Rafraîchir la session courante
   */
  const refreshSession = useCallback(async () => {
    return getCurrentSession();
  }, [getCurrentSession]);

  return {
    // État
    currentSession,
    isLoading,
    error,

    // Actions
    getCurrentSession,
    openSession,
    closeSession,
    getSessionHistory,
    generateZReport,
    refreshSession,
  };
}

// Re-export types for backward compatibility
export type { CashRegisterSession, CloseSummary } from '~/api/cash-register.api';