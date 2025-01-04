import { ItemTypes } from "./item-types.enum";

export type Item = {
  id?: string;
  name: string;
  price: number;
  allergens?: string[];
  description?: string;
  itemType: ItemTypes;
};