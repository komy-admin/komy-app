import { ItemType } from "./item-type.types";
import { Item } from "./item.types";
import { Status } from "./status.enum";

export type OrderItem = {
  id: string;
  orderId: string;
  name: string;
  note: string;
  status: Status;
  itemTypeId: string;
  itemType: ItemType;
  createdAt: string;
  updatedAt: string;
  item: Item;
  itemId: string;
};