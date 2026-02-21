import { Table } from "./table.types";

export type Room = {
  id: string;
  name: string;
  number?: number;
  width: number;
  height: number;
  color?: string | null;
  tables: Table[];
  account: string;
  createdAt: string;
  updatedAt: string;
}