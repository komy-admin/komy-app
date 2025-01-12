import { BaseApiService } from "~/api/base.api";
import { Item } from "~/types/item.types";
export class ItemApiService extends BaseApiService<Item> {
  protected endpoint = '/item';
}
export const itemApiService = new ItemApiService()