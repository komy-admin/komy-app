import { BaseApiService } from "./base.api";
import { Order } from "~/types/order.types";
import { Status } from "~/types/status.enum";

// Types pour la nouvelle route PATCH /order/:id/status
export interface UpdateOrderStatusPayload {
  status: Status;
  orderLineIds?: string[];
  orderLineItemIds?: string[];
}

export class OrderApiService extends BaseApiService<Order> {
  protected endpoint = '/order';

  /**
   * Mise à jour spécialisée des statuts d'OrderLines et OrderLineItems
   * Utilise la nouvelle route PATCH /order/:id/status
   */
  async updateStatus(orderId: string, payload: UpdateOrderStatusPayload): Promise<Order> {
    try {
      const response = await this.axiosInstance.patch(`${this.endpoint}/${orderId}/status`, payload);
      return response.data;
    } catch (error) {
      console.error(`Error in updateStatus for ${this.endpoint}/${orderId}/status:`, error);
      throw error;
    }
  }
}
export const orderApiService = new OrderApiService()