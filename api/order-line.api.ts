import { Order } from "@/types/order.types";
import { BaseApiService } from "./base.api";
import { 
  OrderLine, 
  CreateOrderLineRequest, 
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
      throw error;
    }
  }

  /**
   * Créer plusieurs lignes de commande en une fois
   */
  async createLines(orderId: string, linesData: CreateOrderLineRequest[]): Promise<Order> {
    try {
      const response = await this.axiosInstance.post<Order>(`/order/${orderId}/lines`, {
        lines: linesData
      });
      return response.data;
    } catch (error) {
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
      throw error;
    }
  }

  /**
   * Supprimer une ligne avec motif optionnel
   */
  async deleteLine(orderLineId: string, reason?: string, notes?: string): Promise<void> {
    const params: Record<string, string> = {}
    if (reason) params.reason = reason
    if (notes) params.notes = notes
    await this.axiosInstance.delete(`${this.endpoint}/${orderLineId}`, { params })
  }

  /**
   * Supprimer plusieurs lignes en une fois
   */
  async deleteLines(orderLineIds: string[], reason?: string, notes?: string): Promise<{ deletedCount: number; deletedIds: string[] }> {
    try {
      const response = await this.axiosInstance.delete<{ deletedCount: number; deletedIds: string[] }>(`${this.endpoint}/bulk`, {
        data: { orderLineIds, reason, notes }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

// Instance unique du service
export const orderLineApiService = new OrderLineApiService();