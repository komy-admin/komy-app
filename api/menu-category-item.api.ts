import { BaseApiService } from "./base.api";
import { MenuCategoryItem } from "~/types/menu.types";

export class MenuCategoryItemApiService extends BaseApiService<MenuCategoryItem> {
  protected endpoint = '/menu-category-item';

  async getByMenuCategoryId(menuCategoryId: string): Promise<MenuCategoryItem[]> {
    try {
      const response = await this.axiosInstance.get(`${this.endpoint}?menuCategoryId=${menuCategoryId}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error in getByMenuCategoryId for ${this.endpoint}:`, error);
      throw error;
    }
  }

  async getAvailableByMenuCategoryId(menuCategoryId: string): Promise<MenuCategoryItem[]> {
    try {
      const response = await this.axiosInstance.get(`${this.endpoint}?menuCategoryId=${menuCategoryId}&isAvailable=true`);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error in getAvailableByMenuCategoryId for ${this.endpoint}:`, error);
      throw error;
    }
  }
}

export const menuCategoryItemApiService = new MenuCategoryItemApiService();