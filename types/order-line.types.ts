import { Item } from './item.types';
import { Menu } from './menu.types';
import { Status } from './status.enum';
import { ItemType } from './item-type.types';

// Type énuméré pour le type d'OrderLine
export enum OrderLineType {
  ITEM = 'ITEM',
  MENU = 'MENU',
}

// Snapshot d'un item au moment de la commande (prix figé)
export type OrderLineItemSnapshot = {
  id: string;
  name: string;
  price: number; // 💰 Prix en centimes (snapshot figé)
  description?: string;
  allergens?: string[] | null;
  itemType: ItemType; // Type d'item (Entrées, Plats, etc.)
  snapshotAt: string; // ISO timestamp du snapshot
};

// Snapshot d'un menu au moment de la commande (prix figé)
export type OrderLineMenuSnapshot = {
  id: string;
  name: string;
  description?: string;
  basePrice: number; // 💰 Prix en centimes (snapshot figé)
  snapshotAt: string; // ISO timestamp du snapshot
};

// Item spécifique dans un menu avec son status individuel
export type OrderLineItem = {
  id: string; // ID du OrderLineItem
  categoryName: string; // Nom de la catégorie (ex: "Entrées", "Plats")
  status: Status; // Status individuel de cet item dans le menu
  item: OrderLineItemSnapshot; // Snapshot de l'item
  updatedAt?: string; // Timestamp de dernière mise à jour
};

// Structure unifiée OrderLine remplaçant OrderItem + MenuOrderGroup
export type OrderLine = {
  id: string;
  orderId: string; // Référence à la commande parente
  type: OrderLineType; // ITEM ou MENU
  quantity: number;
  unitPrice: number; // 💰 Prix unitaire en centimes
  totalPrice: number; // 💰 Prix total en centimes (unitPrice * quantity)
  note?: string; // Note sur la ligne

  // Status : seulement pour les ITEM (pour les MENU, le status est sur chaque OrderLineItem)
  status?: Status;

  // Références aux données (mutuellement exclusives selon le type)
  item: OrderLineItemSnapshot | null; // Données item (si type = ITEM)
  menu: OrderLineMenuSnapshot | null; // Données menu (si type = MENU)

  // Items du menu avec statuts individuels (seulement si type = MENU)
  items?: OrderLineItem[];

  // selectedItems pour les menus (mappage categoryId -> itemId) - utilisé pour l'API
  selectedItems?: Record<string, string>;

  // Timestamps
  createdAt: string;
  updatedAt: string;
};

// Alias temporaire pour la migration (OrderItem était l'ancien nom)
export type OrderItem = OrderLine;

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

// Type pour les OrderLineItem en draft (sans ID car pas encore persistés)
export type DraftOrderLineItem = {
  id?: string; // ID optionnel pour les drafts
  categoryName: string;
  item: OrderLineItemSnapshot | Item; // Peut être un Item ou un snapshot
  supplementPrice?: number; // 💰 Prix du supplément en centimes
  note?: string; // Note optionnelle
};

// Type pour les lignes en draft (sans ID car pas encore persistées)
export type DraftOrderLine = {
  id?: string; // ID optionnel pour les drafts
  type: OrderLineType;
  quantity: number;
  totalPrice: number; // 💰 Prix total en centimes
  note?: string;
  status?: Status;
  unitPrice?: number; // 💰 Prix unitaire en centimes (optionnel pour les drafts)
  item?: OrderLineItemSnapshot | Item | null; // Peut être un Item ou un snapshot
  menu?: OrderLineMenuSnapshot | Menu | null; // Peut être un Menu ou un snapshot
  items?: DraftOrderLineItem[]; // Items peuvent aussi être des drafts
};

// Helper type guards
export const isOrderLineItem = (orderLine: OrderLine): orderLine is OrderLine & { type: OrderLineType.ITEM } => {
  return orderLine.type === OrderLineType.ITEM;
};

export const isOrderLineMenu = (orderLine: OrderLine): orderLine is OrderLine & { type: OrderLineType.MENU } => {
  return orderLine.type === OrderLineType.MENU;
};

export const isDraftOrderLine = (line: OrderLine | DraftOrderLine): line is DraftOrderLine => {
  return !line.id || line.id.startsWith('draft-');
};