import { ItemTypes } from "./item-type.enum";
import { OrderItem } from "./order-item.types";
import { Status } from "./status.enum";
import { Table } from "./table.types";

export type Order = {
  id: string;
  tableId: string;
  orderItems: OrderItem[];
  itemType: ItemTypes;
  status: Status;
  account: string;
  createdAt: string;
  updatedAt: string;
}