import { Item } from "~/types/item.types";
import { BaseApiService } from "./base.api";

export class ItemApiService extends BaseApiService<Item> {
  protected endpoint = '/item';
}
export const itemApiService = new ItemApiService()