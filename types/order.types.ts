import { OrderItem } from "./order-item.types";
import { Status } from "./status.enum";
import { FilterConfig } from '~/types/filter.types';
import { Table } from '~/types/table.types';

export type Order = {
  id: string;
  tableId: string;
  table: Table;
  orderItems: OrderItem[];
  status: string;
  account: string;
  createdAt: string;
  updatedAt: string;
}

export const filterOrder: FilterConfig<Order>[] = [
  { 
    field: 'name', 
    type: 'text',
    label: 'Nom',
  },
];