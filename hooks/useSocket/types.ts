import { OrderItem } from "~/types/order-line.types";
import { Order } from "~/types/order.types";
import { Status } from "~/types/status.enum";

export enum EventType {
  NEW_ORDER = 'new_order',
  ORDER_READY = 'order_ready',
  ORDER_ITEMS_PENDING = 'order_items_pending',
  ORDER_ITEMS_INPROGRESS = 'order_items_inprogress',
  ORDER_ITEMS_READY = 'order_items_ready',
  UPDATE_ORDER = 'update_order',
  UPDATE_ORDER_ITEM = 'update_order_item',
  UPDATE_ORDER_STATUS = 'update_order_status',
  DELETE_ORDER = 'delete_order',
}

export interface SocketConfig {
  baseUrl: string;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  reconnectionDelayMax?: number;
}

export interface NewOrderPayload {
  order: Order;
}

export interface OrderReadyPayload {
  order: Order;
}

export interface OrderItemsPendingPayload {
  orderItems: OrderItem[];
}

export interface OrderItemsInprogressPayload {
  orderItemIds: string[];
}

export interface OrderItemsReadyPayload {
  orderItemIds: string[];
}

export interface DeleteOrderPayload {
  orderId: string;
}

export interface UpdateOrderItemPayload {
  orderItem: OrderItem;
}

export interface UpdateOrderPayload {
  order: Order;
}

export interface UpdateOrderStatusPayload {
  orderId: string;
  orderStatus: Status;
  orderItemIds: string[];
  orderItemStatus: Status;
}

export interface SocketEvents {
  [EventType.NEW_ORDER]: NewOrderPayload;
  [EventType.ORDER_READY]: OrderReadyPayload;
  [EventType.ORDER_ITEMS_PENDING]: OrderItemsPendingPayload;
  [EventType.ORDER_ITEMS_INPROGRESS]: OrderItemsInprogressPayload;
  [EventType.ORDER_ITEMS_READY]: OrderItemsReadyPayload;
  [EventType.DELETE_ORDER]: DeleteOrderPayload;
  [EventType.UPDATE_ORDER_ITEM]: UpdateOrderItemPayload;
  [EventType.UPDATE_ORDER]: UpdateOrderPayload;
  [EventType.UPDATE_ORDER_STATUS]: UpdateOrderStatusPayload;
}