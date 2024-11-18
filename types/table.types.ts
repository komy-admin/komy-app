import { Order } from "./order.types";
import { Status } from "./status.enum";

export type Table = {
  id: string;
  name: string;
  xStart: number;
  yStart: number;
  width: number;
  height: number;
  roomId: string;
  orders: Order[];
  seats: number;
  status: Status;
  account: string;
  createdAt: string;
  updatedAt: string;
};