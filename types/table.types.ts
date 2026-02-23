import { Order } from "./order.types";

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
  shape?: 'square' | 'rounded';
  account: string;
  createdAt: string;
  updatedAt: string;
};