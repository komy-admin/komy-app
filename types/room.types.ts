import { Table } from "./table.types";

export type Room = {
  id: string;
  name: string;
  number?: number;
  tables: Table[];
  account: string;
  createdAt: string;
  updatedAt: string;
}