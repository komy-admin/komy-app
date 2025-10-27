/**
 * Configuration générique des événements WebSocket
 * Mappe les événements WebSocket (format: model_action) aux actions Redux
 */

export const WEBSOCKET_EVENT_MAP = {
  // Orders
  order: {
    created: 'createOrder',
    updated: 'updateOrder',
    deleted: 'deleteOrder',
  },
  
  // OrderLines
  orderline: {
    created: 'createOrderLine',
    batch_created: 'createOrderLinesBatch',
    updated: 'updateOrderLine',
    batch_updated: 'orderLinesStatusUpdated',
    deleted: 'deleteOrderLine',
    batch_deleted: 'deleteOrderLinesBatch',
  },
  
  // OrderLineItems
  orderlineitem: {
    updated: 'updateOrderLineItem',
    batch_updated: 'orderLineItemsStatusUpdated',
  },
  
  // Tables
  table: {
    created: 'createTable',
    updated: 'updateTable',
    deleted: 'deleteTable',
  },
  
  // Rooms
  room: {
    created: 'createRoom',
    updated: 'updateRoom',
    deleted: 'deleteRoom',
  },
  
  // Items
  item: {
    created: 'createMenuItem',
    updated: 'updateMenuItem',
    deleted: 'deleteMenuItem',
  },
  
  // ItemTypes
  itemtype: {
    created: 'createItemType',
    updated: 'updateItemType',
    deleted: 'deleteItemType',
  },
  
  // Menus
  menu: {
    created: 'createMenu',
    updated: 'updateMenu',
    deleted: 'deleteMenu',
  },
  
  // Menu Categories
  menucategory: {
    created: 'createMenuCategory',
    updated: 'updateMenuCategory',
    deleted: 'deleteMenuCategory',
  },
  
  // Menu Category Items
  menucategoryitem: {
    created: 'createMenuCategoryItem',
    updated: 'updateMenuCategoryItem',
    deleted: 'deleteMenuCategoryItem',
  },
  
  // Users
  user: {
    created: 'createUser',
    updated: 'updateUser',
    deleted: 'deleteUser',
  },

  // Account Config
  accountconfig: {
    updated: 'updateAccountConfig',
  },

  // Tags
  tag: {
    created: 'createTag',
    updated: 'updateTag',
    deleted: 'deleteTag',
  },
} as const;

// Types pour les événements WebSocket
export interface WebSocketEvent {
  model: string;
  action: 'created' | 'updated' | 'deleted' | 'batch_created' | 'batch_updated' | 'batch_deleted';
  data?: any;
  dataId?: string;
  accountId?: string;
  timestamp: string;
  reason?: string; // Pour les suppressions automatiques
}

// Type pour les événements d'invalidation
export interface InvalidateEvent {
  action: 'invalidate';
  resources: string[];
  accountId: string;
  timestamp: Date;
}

// Noms de ressources supportés par le système d'invalidation
export type ResourceName =
  | 'items'
  | 'itemTypes'
  | 'menus'
  | 'menuCategories'
  | 'menuCategoryItems'
  | 'orders'
  | 'orderLines'
  | 'orderLineItems'
  | 'rooms'
  | 'tables'
  | 'tags'
  | 'users'
  | 'statuses'
  | 'accounts'
  | 'accountConfig';

// Type pour les clés des modèles
export type WebSocketModel = keyof typeof WEBSOCKET_EVENT_MAP;

// Type pour les actions par modèle
export type WebSocketActions<T extends WebSocketModel> = keyof typeof WEBSOCKET_EVENT_MAP[T];

// Helper pour formater le nom de l'événement
export const getEventName = (model: string, action: string): string => {
  return `${model}_${action}`;
};

// Helper pour parser un nom d'événement
export const parseEventName = (eventName: string): { model: string; action: string } | null => {
  const parts = eventName.split('_');
  if (parts.length < 2) return null;
  
  const action = parts[parts.length - 1];
  const model = parts.slice(0, -1).join('_');
  
  return { model, action };
};

// Helper pour formater le payload selon le type d'événement
export const formatEventPayload = (model: string, action: string, data: any): any => {
  // Cas spéciaux pour les suppressions
  if (action === 'deleted') {
    // Format: { tableId: "123" } pour une suppression
    const modelIdKey = `${model}Id`;
    return { [modelIdKey]: data.id || data };
  }
  
  // Cas spéciaux pour les batch
  if (action.includes('batch')) {
    // Les données batch sont déjà formatées côté serveur
    return data;
  }
  
  // Format standard pour create/update
  // Cas spécial pour orderLine (camelCase)
  const key = model === 'orderline' ? 'orderLine' : 
              model === 'orderlineitem' ? 'orderLineItem' :
              model === 'menucategory' ? 'menuCategory' :
              model === 'menucategoryitem' ? 'menuCategoryItem' :
              model === 'itemtype' ? 'itemType' :
              model === 'accountconfig' ? 'accountConfig' :
              model;
              
  return { [key]: data };
};

// Helper pour vérifier si un événement est supporté
export const isEventSupported = (eventName: string): boolean => {
  const parsed = parseEventName(eventName);
  if (!parsed) return false;
  
  const { model, action } = parsed;
  return model in WEBSOCKET_EVENT_MAP && 
         action in (WEBSOCKET_EVENT_MAP as any)[model];
};

// Helper pour obtenir l'action Redux depuis un événement
export const getReduxAction = (model: string, action: string): string | null => {
  const modelConfig = (WEBSOCKET_EVENT_MAP as any)[model];
  if (!modelConfig) return null;
  
  return modelConfig[action] || null;
};