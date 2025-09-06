import { BaseApiService } from "./base.api";
import { MenuOrderGroup } from "~/types/menu-order-group.types";
import { Order } from "~/types/order.types";

// Type pour la réponse de suppression d'un MenuOrderGroup
export interface DeleteMenuOrderGroupResponse {
  message: string;
  deletedMenuOrderGroup: MenuOrderGroup;
  deletedOrderItemsCount: number;
  deletedOrderItemIds: number[];
  wasOrderDeleted: boolean;
  deletedOrder: Order | null;
}

export class MenuOrderGroupApiService extends BaseApiService<MenuOrderGroup> {
  protected endpoint = '/menu-order-groups';

  async getAll(): Promise<{ data: MenuOrderGroup[]; meta: any }> {
    try {
      const response = await this.axiosInstance.get(this.endpoint);
      // L'API retourne directement un tableau, on le transforme pour respecter le format BaseApiService
      const data = Array.isArray(response.data) ? response.data : response.data.data || [];
      return {
        data: data,
        meta: response.data.meta || {}
      };
    } catch (error) {
      console.error(`Error in getAll for ${this.endpoint}:`, error);
      throw error;
    }
  }

  // Méthode spécialisée pour la suppression avec réponse détaillée
  async deleteWithResponse(id: string): Promise<DeleteMenuOrderGroupResponse> {
    try {
      const response = await this.axiosInstance.delete<DeleteMenuOrderGroupResponse>(`${this.endpoint}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error in deleteWithResponse for ${this.endpoint}/${id}:`, error);
      throw error;
    }
  }
}

export const menuOrderGroupApiService = new MenuOrderGroupApiService();