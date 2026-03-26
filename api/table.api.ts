import { BaseApiService } from "./base.api";
import { Table } from "~/types/table.types";

export class TableApiService extends BaseApiService<Table> {
  protected endpoint = '/table';
  
  async create(data: Omit<Table, "id" | "status" | "orders" | "seats" | "account" | "createdAt" | "updatedAt">): Promise<Table> {
    try {
      const response = await this.axiosInstance.post<Table>(this.endpoint, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}
export const tableApiService = new TableApiService()