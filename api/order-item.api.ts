import { OrderItem } from "~/types/order-item.types";
import { BaseApiService } from "./base.api";
import { Status } from "~/types/status.enum";

export class OrderItemApiService extends BaseApiService<OrderItem> {
  protected endpoint = '/orderItem';

  async updateManyStatus(orderItemIds: string[], status: Status): Promise<any> {
    try {
      const response = await this.axiosInstance.put(`${this.endpoint}/update-many-status`, { orderItemIds, status });
      return response.data;
    } catch (error) {
      console.error(`Error in updateManyStatus for ${this.endpoint}:`, error);
      throw error;
    }
  }
}
export const orderItemApiService = new OrderItemApiService()