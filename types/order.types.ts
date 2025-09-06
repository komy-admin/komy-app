import { OrderLine } from "~/types/order-line.types";
import { Status } from "~/types/status.enum";
import { Table } from '~/types/table.types';

export type Order = {
  id: string;
  tableId: string;
  table: Table;
  
  // 🆕 Structure unifiée OrderLine
  lines: OrderLine[];
  
  status: Status;
  account: string;
  createdAt: string;
  updatedAt: string;
}