import { BaseApiService } from "./base.api";
import { ItemType } from "~/types/item-type.types";

export class ItemTypeApiService extends BaseApiService<ItemType> {
  protected endpoint = '/itemType';
}
export const itemTypeApiService = new ItemTypeApiService()