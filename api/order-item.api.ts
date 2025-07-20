import { OrderItem } from "~/types/order-item.types";
import { BaseApiService } from "./base.api";
import { Status } from "~/types/status.enum";

export class OrderItemApiService extends BaseApiService<OrderItem> {
  protected endpoint = '/orderItem';

  async updateManyStatus(orderItemIds: string[], status: Status): Promise<any> {
    try {
      const response = await this.axiosInstance.put(`${this.endpoint}/update-many-status`, { 
        orderItemIds, 
        status,
        updatedAt: new Date().toISOString() // Forcer la mise à jour du timestamp
      });
      return response.data;
    } catch (error) {
      console.error(`Error in updateManyStatus for ${this.endpoint}:`, error);
      throw error;
    }
  }

  async deleteManyOrderItems(orderItemIds: string[]): Promise<{ deletedCount: number; deletedIds: string[] }> {
    try {
      const response = await this.axiosInstance.delete(`${this.endpoint}/bulk`, { 
        data: { orderItemIds } 
      });
      return response.data;
    } catch (error) {
      console.error(`Error in deleteManyOrderItems for ${this.endpoint}:`, error);
      throw error;
    }
  }

  async createBulk(bulkData: {
    orderId: string;
    items: Array<{
      itemId: string;
      quantity: number;
      status?: Status;
    }>;
  }): Promise<OrderItem[]> {
    try {
      const response = await this.axiosInstance.post(`${this.endpoint}/bulk`, bulkData);
      return response.data;
    } catch (error) {
      console.error(`Error in createBulk for ${this.endpoint}:`, error);
      throw error;
    }
  }
}
export const orderItemApiService = new OrderItemApiService()