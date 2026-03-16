import { OrderLine } from "~/types/order-line.types";
import { Status } from "~/types/status.enum";
import { Table } from '~/types/table.types';

export type Order = {
  id: string;
  tableId: string | null;
  table: Table | null;

  // 🆕 Structure unifiée OrderLine
  lines: OrderLine[];

  status: Status;
  account: string;
  isClosed: boolean;
  note?: string;
  createdAt: string;
  updatedAt: string;

  // Champs de paiement (maintenant fournis par le backend)
  totalAmount: number;
  paidAmount: number;
  paymentStatus: 'unpaid' | 'partial' | 'paid' | 'overpaid';

  // Propriétés optionnelles pour compatibilité
  orderNumber?: string;
  orderItems?: OrderLine[]; // Alias temporaire pour migration
}