import { Status } from "./status.enum";

/**
 * Shared type for kitchen and bar item groups
 * Used to group order items by orderId and status for display in columns
 */
export interface ItemGroup {
  id: string; // format: orderId-status
  orderId: string;
  orderNumber: string;
  tableName: string;
  status: Status;
  items: Array<{
    id: string;
    type: 'ITEM' | 'MENU_ITEM';
    itemName: string;
    itemType?: string;
    menuName?: string;
    menuId?: string;
    orderLineId?: string;
    status?: Status;
    isOverdue: boolean;
    note?: string;
    tags?: any[];
    createdAt?: string;
    updatedAt?: string;
  }>;
  isOverdue: boolean;
  createdAt: string;
  updatedAt?: string;
}
