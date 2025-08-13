import { OrderItem } from "~/types/order-item.types";
import { Status } from "~/types/status.enum";
import { Table } from '~/types/table.types';
import { MenuGroup } from '~/types/menu.types';

export type Order = {
  id: string;
  tableId: string;
  table: Table;
  individualItems?: OrderItem[];
  menus?: MenuGroup[];
  orderItems: OrderItem[];
  status: Status;
  account: string;
  createdAt: string;
  updatedAt: string;
}