import { BaseApiService } from "./base.api";
import { MenuCategory } from "~/types/menu.types";

export class MenuCategoryApiService extends BaseApiService<MenuCategory> {
  protected endpoint = '/menu-category';
}

export const menuCategoryApiService = new MenuCategoryApiService();