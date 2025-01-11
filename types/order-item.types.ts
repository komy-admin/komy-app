import { Item } from "./item.types";
import { Status } from "./status.enum";

export type OrderItem = {
  id: string;
  name: string;
  note: string;
  status: Status;
  price: number;
  createdAt: string;
  updatedAt: string;
  item: Item;
};