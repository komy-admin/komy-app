import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Room } from '~/types/room.types';
import { Table } from '~/types/table.types';
import { Order } from '~/types/order.types';
import { OrderLine, OrderLineItem } from '~/types/order-line.types';
import { Menu, MenuCategory, MenuCategoryItem } from '~/types/menu.types';
import { Item } from '~/types/item.types';
import { ItemType } from '~/types/item-type.types';
import { User } from '~/types/user.types';
import { Status } from '~/types/status.enum';
import { Tag } from '~/types/tag.types';

/**
 * État unifié pour toutes les entités métier
 * Remplace les 8 slices séparés par une structure normalisée
 */
export interface EntitiesState {
  // Entités normalisées (Record pour lookup O(1))
  rooms: Record<string, Room>;
  tables: Record<string, Table>;
  orders: Record<string, Order>;
  orderLines: Record<string, OrderLine>;
  orderLineItems: Record<string, OrderLineItem>;
  menus: Record<string, Menu>;
  items: Record<string, Item>;
  itemTypes: Record<string, ItemType>;
  users: Record<string, User>;
  tags: Record<string, Tag>;

  // État global
  isInitialized: boolean;
  initError: string | null;
}

// État initial
const initialState: EntitiesState = {
  rooms: {},
  tables: {},
  orders: {},
  orderLines: {},
  orderLineItems: {},
  menus: {},
  items: {},
  itemTypes: {},
  users: {},
  tags: {},
  isInitialized: false,
  initError: null,
};

// Helper pour normaliser un tableau en Record
const normalizeArray = <T extends { id: string }>(array: T[]): Record<string, T> => {
  return array.reduce((acc, item) => ({ ...acc, [item.id]: item }), {});
};

/**
 * Slice unifié pour toutes les entités
 * Actions génériques pour CRUD + actions spécifiques si nécessaire
 */
const entitiesSlice = createSlice({
  name: 'entities',
  initialState,
  reducers: {
    // === INITIALISATION ===
    setInitialData: (state, action: PayloadAction<{
      rooms?: Room[];
      tables?: Table[];
      orders?: Order[];
      menus?: Menu[];
      items?: Item[];
      itemTypes?: ItemType[];
      users?: User[];
    }>) => {
      const { rooms, tables, orders, menus, items, itemTypes, users } = action.payload;
      
      if (rooms) state.rooms = normalizeArray(rooms);
      if (tables) state.tables = normalizeArray(tables);
      if (orders) {
        state.orders = normalizeArray(orders);
        // Normaliser aussi les OrderLines depuis les orders
        orders.forEach(order => {
          if (order.lines) {
            order.lines.forEach(line => {
              state.orderLines[line.id] = line;
              // Normaliser les items si présents
              if (line.items) {
                line.items.forEach(item => {
                  state.orderLineItems[item.id] = item;
                });
              }
            });
          }
        });
      }
      if (menus) state.menus = normalizeArray(menus);
      if (items) state.items = normalizeArray(items);
      if (itemTypes) state.itemTypes = normalizeArray(itemTypes);
      if (users) state.users = normalizeArray(users);
      
      state.isInitialized = true;
      state.initError = null;
    },

    setInitError: (state, action: PayloadAction<string>) => {
      state.initError = action.payload;
      state.isInitialized = false;
    },

    resetEntities: () => initialState,

    // === ROOMS ===
    setRooms: (state, action: PayloadAction<{ rooms: Room[] }>) => {
      state.rooms = normalizeArray(action.payload.rooms);
    },
    createRoom: (state, action: PayloadAction<{ room: Room }>) => {
      const { room } = action.payload;
      state.rooms[room.id] = room;
    },
    updateRoom: (state, action: PayloadAction<{ room: Partial<Room> & { id: string } }>) => {
      const { room } = action.payload;
      if (state.rooms[room.id]) {
        state.rooms[room.id] = { ...state.rooms[room.id], ...room };
      }
    },
    deleteRoom: (state, action: PayloadAction<{ roomId: string }>) => {
      delete state.rooms[action.payload.roomId];
    },

    // === TABLES ===
    setTables: (state, action: PayloadAction<{ tables: Table[] }>) => {
      state.tables = normalizeArray(action.payload.tables);
    },
    createTable: (state, action: PayloadAction<{ table: Table }>) => {
      const { table } = action.payload;
      state.tables[table.id] = table;
    },
    updateTable: (state, action: PayloadAction<{ table: Partial<Table> & { id: string } }>) => {
      const { table } = action.payload;
      if (state.tables[table.id]) {
        state.tables[table.id] = { ...state.tables[table.id], ...table };
      }
    },
    deleteTable: (state, action: PayloadAction<{ tableId: string }>) => {
      delete state.tables[action.payload.tableId];
    },

    // === ORDERS ===
    setOrders: (state, action: PayloadAction<{ orders: Order[]; roomId?: string }>) => {
      const { orders, roomId } = action.payload;
      
      if (roomId) {
        // Filtrer par room si spécifié
        orders.forEach(order => {
          if (order.table?.roomId === roomId) {
            state.orders[order.id] = order;
            // Normaliser les OrderLines
            order.lines?.forEach(line => {
              state.orderLines[line.id] = line;
            });
          }
        });
      } else {
        // Sinon tout remplacer
        state.orders = normalizeArray(orders);
        orders.forEach(order => {
          order.lines?.forEach(line => {
            state.orderLines[line.id] = line;
          });
        });
      }
    },
    setAllOrders: (state, action: PayloadAction<{ orders: Order[] }>) => {
      state.orders = normalizeArray(action.payload.orders);
      // Normaliser les OrderLines
      action.payload.orders.forEach(order => {
        order.lines?.forEach(line => {
          state.orderLines[line.id] = line;
        });
      });
    },
    createOrder: (state, action: PayloadAction<{ order: Order }>) => {
      const { order } = action.payload;
      state.orders[order.id] = order;
      // Normaliser les OrderLines si présentes
      order.lines?.forEach(line => {
        state.orderLines[line.id] = line;
      });
    },
    updateOrder: (state, action: PayloadAction<{ order: Partial<Order> & { id: string } }>) => {
      const { order } = action.payload;
      if (state.orders[order.id]) {
        state.orders[order.id] = { ...state.orders[order.id], ...order };
        // Mettre à jour les OrderLines si présentes
        if (order.lines) {
          order.lines.forEach(line => {
            state.orderLines[line.id] = line;
          });
        }
      }
    },
    deleteOrder: (state, action: PayloadAction<{ orderId: string }>) => {
      const orderId = action.payload.orderId;
      // Supprimer aussi les OrderLines associées
      const order = state.orders[orderId];
      if (order?.lines) {
        order.lines.forEach(line => {
          delete state.orderLines[line.id];
        });
      }
      delete state.orders[orderId];
    },

    // === ORDER LINES ===
    createOrderLine: (state, action: PayloadAction<{ orderLine: OrderLine }>) => {
      const { orderLine } = action.payload;
      state.orderLines[orderLine.id] = orderLine;
    },
    createOrderLinesBatch: (state, action: PayloadAction<{ orderLines: OrderLine[] }>) => {
      action.payload.orderLines.forEach(line => {
        state.orderLines[line.id] = line;
      });
    },
    updateOrderLine: (state, action: PayloadAction<{ orderLine: Partial<OrderLine> & { id: string } }>) => {
      const { orderLine } = action.payload;
      if (state.orderLines[orderLine.id]) {
        state.orderLines[orderLine.id] = { ...state.orderLines[orderLine.id], ...orderLine };
      }
    },
    deleteOrderLine: (state, action: PayloadAction<{ orderLineId: string }>) => {
      const orderLineId = action.payload.orderLineId;
      
      // Récupérer l'OrderLine pour avoir l'orderId
      const orderLine = state.orderLines[orderLineId];
      if (orderLine && orderLine.orderId) {
        // Mise à jour ciblée de l'order concerné uniquement
        const order = state.orders[orderLine.orderId];
        if (order && order.lines) {
          order.lines = order.lines.filter(line => line.id !== orderLineId);
        }
      }
      
      // Supprimer l'OrderLine du store
      delete state.orderLines[orderLineId];
    },
    deleteOrderLinesBatch: (state, action: PayloadAction<{ orderLineIds: string[] }>) => {
      const { orderLineIds } = action.payload;
      
      orderLineIds.forEach(id => {
        delete state.orderLines[id];
      });
      
      Object.values(state.orders).forEach(order => {
        if (order.lines) {
          order.lines = order.lines.filter(line => !orderLineIds.includes(line.id));
        }
      });
    },
    orderLinesStatusUpdated: (state, action: PayloadAction<{ 
      orderLineIds: string[]; 
      status: Status;
      updatedAt?: string;
    }>) => {
      const { orderLineIds, status, updatedAt } = action.payload;
      orderLineIds.forEach(id => {
        if (state.orderLines[id]) {
          state.orderLines[id].status = status;
          if (updatedAt) {
            state.orderLines[id].updatedAt = updatedAt;
          }
        }
      });
    },

    // === ORDER LINE ITEMS ===
    updateOrderLineItem: (state, action: PayloadAction<{ orderLineItem: Partial<OrderLineItem> & { id: string } }>) => {
      const { orderLineItem } = action.payload;
      if (state.orderLineItems[orderLineItem.id]) {
        state.orderLineItems[orderLineItem.id] = { 
          ...state.orderLineItems[orderLineItem.id], 
          ...orderLineItem 
        };
      }
    },
    orderLineItemsStatusUpdated: (state, action: PayloadAction<{ 
      orderLineItemIds: string[]; 
      status: Status;
      updatedAt?: string;
    }>) => {
      const { orderLineItemIds, status, updatedAt } = action.payload;
      orderLineItemIds.forEach(id => {
        if (state.orderLineItems[id]) {
          state.orderLineItems[id].status = status;
          if (updatedAt) {
            state.orderLineItems[id].updatedAt = updatedAt;
          }
        }
      });
    },

    // === MENUS ===
    setMenus: (state, action: PayloadAction<{ menus: Menu[] }>) => {
      state.menus = normalizeArray(action.payload.menus);
    },
    createMenu: (state, action: PayloadAction<{ menu: Menu }>) => {
      const { menu } = action.payload;
      // Stocker le menu complet avec toutes ses relations preloadées
      state.menus[menu.id] = menu;
    },
    updateMenu: (state, action: PayloadAction<{ menu: Partial<Menu> & { id: string } }>) => {
      const { menu } = action.payload;
      if (state.menus[menu.id]) {
        state.menus[menu.id] = { ...state.menus[menu.id], ...menu };
      }
    },
    deleteMenu: (state, action: PayloadAction<{ menuId: string }>) => {
      delete state.menus[action.payload.menuId];
    },

    // === MENU CATEGORIES ===
    createMenuCategory: (state, action: PayloadAction<{ menuCategory: MenuCategory }>) => {
      const { menuCategory } = action.payload;
      const menu = state.menus[menuCategory.menuId];
      if (menu) {
        if (!menu.categories) menu.categories = [];
        menu.categories.push(menuCategory);
      }
    },
    updateMenuCategory: (state, action: PayloadAction<{ menuCategory: Partial<MenuCategory> & { id: string; menuId: string } }>) => {
      const { menuCategory } = action.payload;
      const menu = state.menus[menuCategory.menuId];
      if (menu?.categories) {
        const index = menu.categories.findIndex(c => c.id === menuCategory.id);
        if (index !== -1) {
          menu.categories[index] = { ...menu.categories[index], ...menuCategory };
        }
      }
    },
    deleteMenuCategory: (state, action: PayloadAction<{ menuCategoryId: string; menuId?: string }>) => {
      const { menuCategoryId, menuId } = action.payload;
      if (menuId) {
        const menu = state.menus[menuId];
        if (menu?.categories) {
          menu.categories = menu.categories.filter(c => c.id !== menuCategoryId);
        }
      } else {
        // Chercher dans tous les menus
        Object.values(state.menus).forEach(menu => {
          if (menu.categories) {
            menu.categories = menu.categories.filter(c => c.id !== menuCategoryId);
          }
        });
      }
    },

    // === MENU CATEGORY ITEMS ===
    createMenuCategoryItem: (state, action: PayloadAction<{ menuCategoryItem: MenuCategoryItem }>) => {
      const { menuCategoryItem } = action.payload;

      // Trouver le menu contenant cette catégorie
      Object.values(state.menus).forEach(menu => {
        const category = menu.categories?.find(c => c.id === menuCategoryItem.menuCategoryId);
        if (category) {
          // Initialiser le tableau items s'il n'existe pas
          if (!category.items) {
            category.items = [];
          }
          // Ajouter le nouvel item
          category.items.push(menuCategoryItem);
        }
      });

    },
    updateMenuCategoryItem: (state, action: PayloadAction<{ menuCategoryItem: MenuCategoryItem }>) => {
      const { menuCategoryItem } = action.payload;

      // Trouver et mettre à jour l'item dans la catégorie appropriée
      Object.values(state.menus).forEach(menu => {
        menu.categories?.forEach(category => {
          if (category.items) {
            const index = category.items.findIndex(item => item.id === menuCategoryItem.id);
            if (index !== -1) {
              category.items[index] = menuCategoryItem;
            }
          }
        });
      });
    },
    deleteMenuCategoryItem: (state, action: PayloadAction<{ menuCategoryItemId: string }>) => {
      const { menuCategoryItemId } = action.payload;

      // Trouver et supprimer l'item de la catégorie appropriée
      Object.values(state.menus).forEach(menu => {
        menu.categories?.forEach(category => {
          if (category.items) {
            category.items = category.items.filter(item => item.id !== menuCategoryItemId);
          }
        });
      });
    },
    setMenuCategoryItems: (state, action: PayloadAction<{ menuCategoryId: string; items: MenuCategoryItem[] }>) => {
      const { menuCategoryId, items } = action.payload;

      // Trouver la catégorie et définir ses items
      Object.values(state.menus).forEach(menu => {
        const category = menu.categories?.find(c => c.id === menuCategoryId);
        if (category) {
          category.items = items;
        }
      });
    },

    // === ITEMS ===
    setItems: (state, action: PayloadAction<{ items: Item[] }>) => {
      state.items = normalizeArray(action.payload.items);
    },
    createMenuItem: (state, action: PayloadAction<{ item: Item }>) => {
      const { item } = action.payload;
      state.items[item.id] = item;
    },
    updateMenuItem: (state, action: PayloadAction<{ item: Partial<Item> & { id: string } }>) => {
      const { item } = action.payload;
      if (state.items[item.id]) {
        state.items[item.id] = { ...state.items[item.id], ...item };
      }
    },
    deleteMenuItem: (state, action: PayloadAction<{ itemId: string }>) => {
      delete state.items[action.payload.itemId];
    },

    // === ITEM TYPES ===
    setItemTypes: (state, action: PayloadAction<{ itemTypes: ItemType[] }>) => {
      state.itemTypes = normalizeArray(action.payload.itemTypes);
    },
    createItemType: (state, action: PayloadAction<{ itemType: ItemType }>) => {
      const { itemType } = action.payload;
      state.itemTypes[itemType.id] = itemType;
    },
    updateItemType: (state, action: PayloadAction<{ itemType: Partial<ItemType> & { id: string } }>) => {
      const { itemType } = action.payload;
      if (state.itemTypes[itemType.id]) {
        state.itemTypes[itemType.id] = { ...state.itemTypes[itemType.id], ...itemType };
      }
    },
    deleteItemType: (state, action: PayloadAction<{ itemTypeId: string }>) => {
      delete state.itemTypes[action.payload.itemTypeId];
    },

    // === TAGS ===
    setTags: (state, action: PayloadAction<{ tags: Tag[] }>) => {
      state.tags = normalizeArray(action.payload.tags);
    },
    createTag: (state, action: PayloadAction<{ tag: Tag }>) => {
      const { tag } = action.payload;
      state.tags[tag.id] = tag;
    },
    updateTag: (state, action: PayloadAction<{ tag: Partial<Tag> & { id: string } }>) => {
      const { tag } = action.payload;
      if (state.tags[tag.id]) {
        state.tags[tag.id] = { ...state.tags[tag.id], ...tag };
      }
    },
    deleteTag: (state, action: PayloadAction<{ tagId: string }>) => {
      delete state.tags[action.payload.tagId];
    },

    // === USERS ===
    setUsers: (state, action: PayloadAction<{ users: User[] }>) => {
      state.users = normalizeArray(action.payload.users);
    },
    createUser: (state, action: PayloadAction<{ user: User }>) => {
      const { user } = action.payload;
      state.users[user.id] = user;
    },
    updateUser: (state, action: PayloadAction<{ user: Partial<User> & { id: string } }>) => {
      const { user } = action.payload;
      if (state.users[user.id]) {
        state.users[user.id] = { ...state.users[user.id], ...user };
      }
    },
    deleteUser: (state, action: PayloadAction<{ userId: string }>) => {
      delete state.users[action.payload.userId];
    },
  },
});

// Export des actions
export const entitiesActions = entitiesSlice.actions;

// Export du reducer
export default entitiesSlice.reducer;

// === SÉLECTEURS ===
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';

// Sélecteurs de base
export const selectEntities = (state: RootState) => state.entities;

// Rooms
export const selectAllRooms = createSelector(
  selectEntities,
  (entities) => Object.values(entities.rooms)
);

export const selectRoomById = (roomId: string) => createSelector(
  selectEntities,
  (entities) => entities.rooms[roomId]
);

// Tables
export const selectAllTables = createSelector(
  selectEntities,
  (entities) => Object.values(entities.tables)
);

export const selectTablesByRoomId = (roomId: string) => createSelector(
  selectEntities,
  (entities) => Object.values(entities.tables).filter(table => table.roomId === roomId)
);

export const selectTableById = (tableId: string) => createSelector(
  selectEntities,
  (entities) => entities.tables[tableId]
);

// Orders
export const selectAllOrders = createSelector(
  selectEntities,
  (entities) => Object.values(entities.orders)
);

export const selectOrdersByRoomId = (roomId: string) => createSelector(
  selectEntities,
  (entities) => Object.values(entities.orders).filter(order => order.table?.roomId === roomId)
);

export const selectOrderById = (orderId: string) => createSelector(
  selectEntities,
  (entities) => entities.orders[orderId]
);

// Order Lines
export const selectOrderLinesByOrderId = (orderId: string) => createSelector(
  selectEntities,
  (entities) => Object.values(entities.orderLines).filter(line => line.orderId === orderId)
);

// Menus
export const selectAllMenus = createSelector(
  selectEntities,
  (entities) => Object.values(entities.menus)
);

export const selectMenuById = (menuId: string) => createSelector(
  selectEntities,
  (entities) => entities.menus[menuId]
);

// Items
export const selectAllItems = createSelector(
  selectEntities,
  (entities) => Object.values(entities.items)
);

export const selectItemById = (itemId: string) => createSelector(
  selectEntities,
  (entities) => entities.items[itemId]
);

export const selectItemsByType = (itemTypeId: string) => createSelector(
  selectEntities,
  (entities) => Object.values(entities.items).filter(item => item.itemTypeId === itemTypeId)
);

// Item Types
export const selectAllItemTypes = createSelector(
  selectEntities,
  (entities) => Object.values(entities.itemTypes)
);

export const selectItemTypeById = (itemTypeId: string) => createSelector(
  selectEntities,
  (entities) => entities.itemTypes[itemTypeId]
);

// Users
export const selectAllUsers = createSelector(
  selectEntities,
  (entities) => Object.values(entities.users)
);

export const selectUserById = (userId: string) => createSelector(
  selectEntities,
  (entities) => entities.users[userId]
);

// État global
export const selectIsInitialized = createSelector(
  selectEntities,
  (entities) => entities.isInitialized
);

export const selectInitError = createSelector(
  selectEntities,
  (entities) => entities.initError
);

// === KITCHEN SELECTORS ===

// Interface pour les items de cuisine
interface KitchenItem {
  id: string;
  type: 'ITEM' | 'MENU_ITEM';
  orderId: string;
  itemName: string;
  itemType?: string;
  itemTypeType?: string;
  menuName?: string;
  menuId?: string;
  status: Status;
  orderLineId: string;
  note?: string; // ✅ Note ajoutée
  tags?: any[]; // ✅ Tags ajoutés (type simplifié pour éviter import circulaire)
}

// Selector pour les items de cuisine - combine OrderLines et OrderLineItems pour les besoins de la cuisine
export const selectAllKitchenItems = createSelector(
  selectEntities,
  (entities): KitchenItem[] => {
    const kitchenItems: KitchenItem[] = [];
    const processedIds = new Set<string>(); // Set pour O(1) lookup performance

    // Traiter les OrderLines
    Object.values(entities.orderLines).forEach(orderLine => {
      if (orderLine.type === 'ITEM' && orderLine.item && orderLine.orderId) {
        kitchenItems.push({
          id: orderLine.id,
          type: 'ITEM',
          orderId: orderLine.orderId,
          itemName: orderLine.item.name,
          itemType: orderLine.item.itemType?.name,
          itemTypeType: orderLine.item.itemType?.type,
          status: orderLine.status || Status.PENDING,
          orderLineId: orderLine.id,
          note: orderLine.note, // ✅ Note de l'OrderLine
          tags: orderLine.tags  // ✅ Tags de l'OrderLine
        });
        processedIds.add(orderLine.id);
      }

      if (orderLine.type === 'MENU' && orderLine.menu && orderLine.orderId) {
        if (orderLine.items && orderLine.items.length > 0) {
          orderLine.items.forEach(menuItem => {
            if (menuItem.item) {
              // Cast temporaire pour accéder aux propriétés tags/note qui peuvent exister
              const menuItemWithMeta = menuItem as any;
              kitchenItems.push({
                id: menuItem.id,
                type: 'MENU_ITEM',
                orderId: orderLine.orderId,
                itemName: menuItem.item.name,
                itemType: menuItem.item.itemType?.name,
                itemTypeType: menuItem.item.itemType?.type,
                menuName: orderLine.menu?.name,
                menuId: orderLine.menu?.id,
                status: menuItem.status || orderLine.status || Status.PENDING,
                orderLineId: orderLine.id,
                note: menuItemWithMeta.note, // ✅ Note de l'item de menu
                tags: menuItemWithMeta.tags  // ✅ Tags de l'item de menu
              });
              processedIds.add(menuItem.id);
            }
          });
        }
      }
    });

    // Traiter aussi les OrderLineItems orphelins (au cas où)
    Object.values(entities.orderLineItems).forEach(orderLineItem => {
      if (orderLineItem.item && !processedIds.has(orderLineItem.id)) {
        // Trouver l'OrderLine parent pour obtenir l'orderId
        const parentOrderLine = Object.values(entities.orderLines)
          .find(ol => ol.items?.some(item => item.id === orderLineItem.id));

        if (parentOrderLine) {
          const orderLineItemWithMeta = orderLineItem as any;
          kitchenItems.push({
            id: orderLineItem.id,
            type: 'MENU_ITEM',
            orderId: parentOrderLine.orderId,
            itemName: orderLineItem.item.name,
            itemType: orderLineItem.item.itemType?.name,
            itemTypeType: orderLineItem.item.itemType?.type,
            menuName: parentOrderLine.menu?.name,
            menuId: parentOrderLine.menu?.id,
            status: orderLineItem.status || Status.PENDING,
            orderLineId: parentOrderLine.id,
            note: orderLineItemWithMeta.note, // ✅ Note
            tags: orderLineItemWithMeta.tags  // ✅ Tags
          });
        }
      }
    });

    return kitchenItems;
  }
);

// Selector pour les OrderItems - principalement pour le barman
export const selectAllOrderItems = createSelector(
  selectEntities,
  (entities) => {
    const orderItems: any[] = [];
    
    // Traiter les OrderLineItems pour le barman
    Object.values(entities.orderLineItems).forEach(orderLineItem => {
      if (orderLineItem.item) {
        // Trouver l'OrderLine parent pour obtenir l'orderId
        const parentOrderLine = Object.values(entities.orderLines)
          .find(ol => ol.items?.some(item => item.id === orderLineItem.id));
        
        if (parentOrderLine) {
          orderItems.push({
            id: orderLineItem.id,
            orderId: parentOrderLine.orderId,
            item: orderLineItem.item,
            status: orderLineItem.status,
            updatedAt: orderLineItem.updatedAt
          });
        }
      }
    });
    
    return orderItems;
  }
);