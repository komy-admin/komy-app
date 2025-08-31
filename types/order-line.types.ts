import { Item } from './item.types';
import { Menu } from './menu.types';
import { Status } from './status.enum';

// Type énuméré pour le type d'OrderLine
export enum OrderLineType {
  ITEM = 'ITEM',
  MENU = 'MENU',
}

// Snapshot d'un item au moment de la commande (prix figé)
export type OrderLineItemSnapshot = {
  id: string;
  name: string;
  price: number;
  description?: string;
  allergens?: string[] | null;
  snapshotAt: string; // ISO timestamp du snapshot
};

// Snapshot d'un menu au moment de la commande (prix figé)
export type OrderLineMenuSnapshot = {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  snapshotAt: string; // ISO timestamp du snapshot
};

// Item spécifique dans un menu avec son status individuel
export type OrderLineItem = {
  id: string; // ID du OrderLineItem
  categoryName: string; // Nom de la catégorie (ex: "Entrées", "Plats")
  status: Status; // Status individuel de cet item dans le menu
  item: OrderLineItemSnapshot; // Snapshot de l'item
};

// Structure unifiée OrderLine remplaçant OrderItem + MenuOrderGroup
export type OrderLine = {
  id: string;
  type: OrderLineType; // ITEM ou MENU
  quantity: number;
  unitPrice: number; // Prix unitaire
  totalPrice: number; // Prix total (unitPrice * quantity)
  note?: string; // Note sur la ligne

  // Status : seulement pour les ITEM (pour les MENU, le status est sur chaque OrderLineItem)
  status?: Status;

  // Références aux données (mutuellement exclusives selon le type)
  item: OrderLineItemSnapshot | null; // Données item (si type = ITEM)
  menu: OrderLineMenuSnapshot | null; // Données menu (si type = MENU)

  // Items du menu avec statuts individuels (seulement si type = MENU)
  items?: OrderLineItem[];
};

// Types pour les requêtes de création
export type CreateOrderLineItemRequest = {
  type: OrderLineType.ITEM;
  quantity: number;
  itemId: string;
  note?: string;
};

export type CreateOrderLineMenuRequest = {
  type: OrderLineType.MENU;
  quantity: number;
  menuId: string;
  note?: string;
  selectedItems: Record<string, string>; // categoryName -> itemId
};

export type CreateOrderLineRequest = CreateOrderLineItemRequest | CreateOrderLineMenuRequest;

// Types pour les requêtes de modification
export type UpdateOrderLineRequest = {
  quantity?: number;
  note?: string;
  status?: Status; // Seulement pour les ITEM
};

export type UpdateOrderLineItemRequest = {
  status: Status;
};

// Types pour les réponses de l'API
export type OrderLineResponse = OrderLine;

export type CreateOrderLinesResponse = {
  lines: OrderLine[];
};

// Helper type guards
export const isOrderLineItem = (orderLine: OrderLine): orderLine is OrderLine & { type: OrderLineType.ITEM } => {
  return orderLine.type === OrderLineType.ITEM;
};

export const isOrderLineMenu = (orderLine: OrderLine): orderLine is OrderLine & { type: OrderLineType.MENU } => {
  return orderLine.type === OrderLineType.MENU;
};