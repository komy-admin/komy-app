import { OrderItem } from "./order-item.types";
import { Status } from "./status.enum";
import { Table } from '~/types/table.types';

export type Order = {
  id: string;
  tableId: string;
  table: Table;
  orderItems: OrderItem[];
  status: Status;
  account: string;
  createdAt: string;
  updatedAt: string;
}