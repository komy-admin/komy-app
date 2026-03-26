import { BaseApiService } from "./base.api";
import { Menu, MenuPriceCalculationRequest, MenuPriceCalculationResponse, MenuBulkUpdateRequest, MenuBulkCreateRequest } from "~/types/menu.types";

export class MenuApiService extends BaseApiService<Menu> {
  protected endpoint = '/menu';

  async calculatePrice(data: MenuPriceCalculationRequest): Promise<MenuPriceCalculationResponse> {
    try {
      const response = await this.axiosInstance.post(`${this.endpoint}/calculate-price`, data);
      return response.data;
    } catch (error) {
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
      throw error;
    }
  }

  // ✅ Nouvelle API bulk pour créer menu + catégories + items en 1 seule requête
  async createBulk(data: MenuBulkCreateRequest): Promise<Menu> {
    try {
      const response = await this.axiosInstance.post(`${this.endpoint}/bulk`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // ✅ Nouvelle API bulk pour sauvegarder menu + catégories + items en 1 seule requête
  async updateBulk(menuId: string, data: MenuBulkUpdateRequest): Promise<Menu> {
    try {
      const response = await this.axiosInstance.put(`${this.endpoint}/${menuId}/bulk`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export const menuApiService = new MenuApiService();