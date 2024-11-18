import { ItemTypes } from "./item-types.enum";
import { Status } from "./status.enum";

export type OrderItem = {
  id: string;
  name: string;
  status: Status;
  price: number;
  itemType: ItemTypes;
  createdAt: string;
  updatedAt: string;
};