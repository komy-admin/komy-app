import { useState, useCallback } from 'react';
import axios from 'axios';
import { Platform } from 'react-native';
import { storageService } from '~/lib/storageService';

// Create axios instance for API calls
const API_URL = Platform.select({
  android: `${process.env.EXPO_PUBLIC_API_URL}/api`,
  ios: `${process.env.EXPO_PUBLIC_API_URL}/api`,
  web: `${process.env.EXPO_PUBLIC_API_URL}/api`,
});

const api = axios.create({
  baseURL: API_URL || 'http://localhost:3333/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  async (config) => {
    const sessionToken = await storageService.getItem('sessionToken');
    const authToken = await storageService.getItem('authToken');

    if (sessionToken) {
      config.headers['Authorization'] = `Bearer ${sessionToken}`;
    } else if (authToken) {
      config.headers['Authorization'] = `Bearer ${authToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Interface pour une session de caisse
 */
export interface CashRegisterSession {
  id: string;
  accountId: string;
  userId: string;
  openedAt: string;
  closedAt?: string | null;
  openingBalance: number;
  expectedCash?: number | null;
  actualCash?: number | null;
  discrepancy?: number | null;
  notes?: string | null;
  status: 'open' | 'closed';
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  stats?: {
    paymentsCount: number;
    totalAmount: number;
    totalCash: number;
    totalCard: number;
    totalTicketResto: number;
    totalCheck: number;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface pour le résumé de clôture
 */
export interface CloseSummary {
  session: CashRegisterSession;
  summary: {
    totalAmount: number;
    cashAmount: number;
    cardAmount: number;
    ticketRestoAmount: number;
    checkAmount: number;
    expectedCash: number;
    actualCash: number;
    discrepancy: number;
    paymentsCount: number;
    refundsCount: number;
    tvaDetails: Array<{
      rate: number;
      base: number;
      amount: number;
    }>;
  };
  zNumber: string;
  closedAt: string;
}

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

      const response = await api.get('/cash-register/current');
      const session = response.data.data;

      setCurrentSession(session);
      return session;
    } catch (err: any) {
      console.error('Erreur récupération session:', err);
      setError(err.message || 'Erreur lors de la récupération de la session');
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

      const response = await api.post('/cash-register/open', {
        openingBalance,
        notes,
      });

      const session = response.data.data;
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

      const response = await api.post('/cash-register/close', {
        actualCash,
        notes,
      });

      const result = response.data.data;
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

      const response = await api.get('/cash-register/history', {
        params: { page, limit },
      });

      return response.data;
    } catch (err: any) {
      console.error('Erreur récupération historique:', err);
      setError(err.message || 'Erreur lors de la récupération de l\'historique');
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

      const response = await api.get(`/cash-register/${sessionId}/z-report`);
      return response.data;
    } catch (err: any) {
      console.error('Erreur génération Z:', err);
      setError(err.message || 'Erreur lors de la génération du Z');
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