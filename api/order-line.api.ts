import { BaseApiService } from "./base.api";
import { 
  OrderLine, 
  CreateOrderLineRequest, 
  CreateOrderLinesResponse, 
  UpdateOrderLineRequest,
  UpdateOrderLineItemRequest 
} from "~/types/order-line.types";
import { Status } from "~/types/status.enum";

export class OrderLineApiService extends BaseApiService<OrderLine> {
  protected endpoint = '/order-lines';

  /**
   * Récupérer toutes les lignes d'une commande
   */
  async getByOrderId(orderId: string): Promise<OrderLine[]> {
    try {
      const response = await this.axiosInstance.get<{ data: OrderLine[] }>(`/order/${orderId}/lines`);
      return response.data.data;
    } catch (error) {
      console.error(`Error in getByOrderId for order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Créer une ligne de commande
   */
  async createLine(orderId: string, lineData: CreateOrderLineRequest): Promise<OrderLine> {
    try {
      const response = await this.axiosInstance.post<{ data: OrderLine }>(`/order/${orderId}/lines`, lineData);
      return response.data.data;
    } catch (error) {
      console.error(`Error in createLine for order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Créer plusieurs lignes de commande en une fois
   */
  async createLines(orderId: string, linesData: CreateOrderLineRequest[]): Promise<CreateOrderLinesResponse> {
    try {
      const response = await this.axiosInstance.post<CreateOrderLinesResponse>(`/order/${orderId}/lines/bulk`, {
        lines: linesData
      });
      return response.data;
    } catch (error) {
      console.error(`Error in createLines for order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Modifier le statut d'un item dans un menu (OrderLineItem)
   */
  async updateLineItemStatus(lineItemId: string, updateData: UpdateOrderLineItemRequest): Promise<{ success: boolean }> {
    try {
      const response = await this.axiosInstance.patch<{ success: boolean }>(`/order-line-items/${lineItemId}`, updateData);
      return response.data;
    } catch (error) {
      console.error(`Error in updateLineItemStatus for line item ${lineItemId}:`, error);
      throw error;
    }
  }

  /**
   * Modifier le statut de plusieurs items en une fois
   */
  async updateManyItemsStatus(lineItemIds: string[], status: Status): Promise<{ updatedCount: number }> {
    try {
      const response = await this.axiosInstance.patch<{ updatedCount: number }>('/order-line-items/bulk-status', {
        lineItemIds,
        status
      });
      return response.data;
    } catch (error) {
      console.error(`Error in updateManyItemsStatus:`, error);
      throw error;
    }
  }

  /**
   * Modifier le statut de plusieurs lignes en une fois (pour items individuels)
   */
  async updateManyLinesStatus(lineIds: string[], status: Status): Promise<{ updatedCount: number }> {
    try {
      const response = await this.axiosInstance.patch<{ updatedCount: number }>(`${this.endpoint}/bulk-status`, {
        lineIds,
        status
      });
      return response.data;
    } catch (error) {
      console.error(`Error in updateManyLinesStatus:`, error);
      throw error;
    }
  }

  /**
   * Supprimer plusieurs lignes en une fois
   */
  async deleteLines(lineIds: string[]): Promise<{ deletedCount: number; deletedIds: string[] }> {
    try {
      const response = await this.axiosInstance.delete<{ deletedCount: number; deletedIds: string[] }>(`${this.endpoint}/bulk`, {
        data: { lineIds }
      });
      return response.data;
    } catch (error) {
      console.error(`Error in deleteLines:`, error);
      throw error;
    }
  }
}

// Instance unique du service
export const orderLineApiService = new OrderLineApiService();