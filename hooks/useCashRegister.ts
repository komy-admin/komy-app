import { useState, useCallback } from 'react';
import { Platform, Linking } from 'react-native';
import { cashRegisterApiService, CashRegisterSession, CloseSummary } from '~/api/cash-register.api';
import { extractApiError } from '~/lib/apiErrorHandler';

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
    } catch (err) {
      const info = extractApiError(err);
      setError(info.message);
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
    } catch (err) {
      const info = extractApiError(err);
      setError(info.message);
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
    } catch (err) {
      const info = extractApiError(err);
      setError(info.message);
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
    } catch (err) {
      const info = extractApiError(err);
      setError(info.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Telecharge et ouvre le rapport Z en PDF
   *
   * @param sessionId ID de la session de caisse
   */
  const downloadZReport = useCallback(async (sessionId: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const blob = await cashRegisterApiService.downloadZReport(sessionId);

      if (Platform.OS === 'web') {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      } else {
        const fileReader = new FileReader();
        fileReader.onload = () => {
          const base64 = (fileReader.result as string).split(',')[1];
          const uri = `data:application/pdf;base64,${base64}`;
          Linking.openURL(uri).catch(() => {});
        };
        fileReader.readAsDataURL(blob);
      }
    } catch (err) {
      const info = extractApiError(err);
      setError(info.message);
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
    downloadZReport,
    refreshSession,
  };
}

// Re-export types for backward compatibility
export type { CashRegisterSession, CloseSummary } from '~/api/cash-register.api';
