import { BaseApiService } from "./base.api";
import { Menu, MenuPriceCalculationRequest, MenuPriceCalculationResponse } from "~/types/menu.types";

export class MenuApiService extends BaseApiService<Menu> {
  protected endpoint = '/menu';

  async calculatePrice(data: MenuPriceCalculationRequest): Promise<MenuPriceCalculationResponse> {
    try {
      const response = await this.axiosInstance.post(`${this.endpoint}/calculate-price`, data);
      return response.data;
    } catch (error) {
      console.error(`Error in calculatePrice for ${this.endpoint}:`, error);
      throw error;
    }
  }

  async getActiveMenus(): Promise<Menu[]> {
    try {
      const response = await this.axiosInstance.get(`${this.endpoint}?isActive=true`);
      // S'assurer de retourner un tableau
      const data = response.data.data || response.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error(`Error in getActiveMenus for ${this.endpoint}:`, error);
      throw error;
    }
  }
}

export const menuApiService = new MenuApiService();