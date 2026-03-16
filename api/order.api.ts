import { BaseApiService } from "./base.api";
import { Order } from "~/types/order.types";
import { Status } from "~/types/status.enum";
import { OrderLineType, CreateOrderLineRequest } from "~/types/order-line.types";

// Types pour la nouvelle route PATCH /order/:id/status
export interface UpdateOrderStatusPayload {
  status: Status;
  orderLineIds?: string[];
  orderLineItemIds?: string[];
}

// Types pour la route PUT /order/:id avec lignes
export interface BulkUpdateOrderPayload {
  tableId?: string;
  lines?: Array<{
    id?: string; // Optionnel pour création
    type: OrderLineType;
    quantity?: number;
    note?: string;
    status?: Status;
    itemId?: string; // Pour création ITEM
    menuId?: string; // Pour création MENU
    tags?: Record<string, any>; // Tags pour ITEM
    selectedItems?: Record<string, Array<{ itemId: string; tags?: Record<string, any> }>>; // Pour MENU
  }>;
}

export interface CreateOrderPayload {
  tableId?: string;
  lines: CreateOrderLineRequest[];
  status?: Status;
}

export class OrderApiService extends BaseApiService<Order> {
  protected endpoint = '/order';

  /**
   * Créer une commande avec ses lignes
   */
  async createWithLines(data: CreateOrderPayload): Promise<Order> {
    try {
      const response = await this.axiosInstance.post<Order>(this.endpoint, data);
      return response.data;
    } catch (error) {
      console.error(`Error in createWithLines for ${this.endpoint}:`, error);
      throw error;
    }
  }

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

  /**
   * Mise à jour complète d'une commande avec ses lignes (CRUD complet)
   * Utilise la route PUT /order/:id
   * Supporte création, modification et suppression de lignes en une transaction
   */
  async updateWithLines(orderId: string, payload: BulkUpdateOrderPayload): Promise<Order> {
    try {
      const response = await this.axiosInstance.put(`${this.endpoint}/${orderId}`, payload);
      return response.data;
    } catch (error) {
      console.error(`Error in updateWithLines for ${this.endpoint}/${orderId}:`, error);
      throw error;
    }
  }
}
export const orderApiService = new OrderApiService()