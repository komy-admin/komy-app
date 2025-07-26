import { OrderItem } from "~/types/order-item.types";
import { Status } from "~/types/status.enum";
import { Table } from '~/types/table.types';
import { MenuGroup } from '~/types/menu.types';

export type Order = {
  id: string;
  tableId: string;
  table: Table;
  
  // Nouvelle structure pour le système de menus
  individualItems?: OrderItem[];  // Items commandés à la carte
  menus?: MenuGroup[];           // Menus groupés avec prix calculés
  
  // Structure existante (conservée pour rétrocompatibilité)
  orderItems: OrderItem[];
  status: Status;
  account: string;
  createdAt: string;
  updatedAt: string;
}