import { BaseApiService } from './base.api';

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
  zNumber?: string | null;
  zSequence?: number | null;
  zReportUrl?: string | null;
  vatBreakdown?: Record<string, number> | null;
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
 * Service API pour la gestion de la caisse enregistreuse
 */
class CashRegisterApiService extends BaseApiService<CashRegisterSession> {
  protected endpoint = 'cash-register';

  /**
   * Récupérer la session de caisse en cours
   */
  async getCurrent(): Promise<CashRegisterSession | null> {
    const response = await this.axiosInstance.get(`/${this.endpoint}/current`);
    return response.data.data;
  }

  /**
   * Ouvrir une nouvelle session de caisse
   */
  async open(openingBalance: number, notes?: string): Promise<CashRegisterSession> {
    const response = await this.axiosInstance.post(`/${this.endpoint}/open`, {
      openingBalance,
      notes,
    });
    return response.data.data;
  }

  /**
   * Fermer la session de caisse en cours
   */
  async close(actualCash: number, notes?: string): Promise<CloseSummary> {
    const response = await this.axiosInstance.post(`/${this.endpoint}/close`, {
      actualCash,
      notes,
    });
    return response.data.data;
  }

  /**
   * Récupérer l'historique des sessions de caisse
   */
  async getHistory(page = 1, limit = 20): Promise<{
    data: CashRegisterSession[];
    meta: any;
  }> {
    const response = await this.axiosInstance.get(`/${this.endpoint}/history`, {
      params: { page, limit },
    });
    return response.data;
  }

  /**
   * Telecharge le rapport Z en PDF pour une session de caisse
   *
   * @param sessionId ID de la session de caisse
   * @returns Blob du PDF
   */
  async downloadZReport(sessionId: string): Promise<Blob> {
    const response = await this.axiosInstance.get(`/${this.endpoint}/${sessionId}/z-report`, {
      responseType: 'blob',
    });
    return response.data;
  }
}

export const cashRegisterApiService = new CashRegisterApiService();