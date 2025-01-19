import { OrderItem } from "~/types/order-item.types";
import { BaseApiService } from "./base.api";
import { Order } from "~/types/order.types";

export class OrderItemApiService extends BaseApiService<OrderItem> {
  protected endpoint = '/orderItem';
}
export const orderItemApiService = new OrderItemApiService()