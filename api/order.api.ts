import { BaseApiService } from "./base.api";
import { Order } from "~/types/order.types";

export class OrderApiService extends BaseApiService<Order> {
  protected endpoint = '/order';
}
export const orderApiService = new OrderApiService()