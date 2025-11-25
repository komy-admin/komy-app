import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';
import { EntitiesState } from '../slices/entities.slice';
import { Table } from '~/types/table.types';
import { Order } from '~/types/order.types';
import { OrderLine } from '~/types/order-line.types';
import { Menu, MenuCategoryItem } from '~/types/menu.types';
import { getMostImportantStatus } from '~/lib/utils';

/**
 * Selectors optimisés avec mémorisation via createSelector
 * Remplace les 50+ selectors dispersés par une structure claire et performante
 */

// === BASE SELECTORS (pas de recalcul) ===

// Entities state
const selectEntitiesState = (state: RootState) => state.entities;

// Rooms - Records (pas de transformation)
export const selectRoomsRecord = (state: RootState) => state.entities.rooms;
export const selectRoomById = (roomId: string) => (state: RootState) =>
  state.entities.rooms[roomId] || null;

// Rooms - Array (mémorisé)
export const selectRooms = createSelector(
  [selectRoomsRecord],
  (rooms) => Object.values(rooms)
);

// Tables - Records (pas de transformation)
export const selectTablesRecord = (state: RootState) => state.entities.tables;
export const selectTableById = (tableId: string) => (state: RootState) =>
  state.entities.tables[tableId] || null;

// Tables - Array (mémorisé)
export const selectTables = createSelector(
  [selectTablesRecord],
  (tables) => Object.values(tables)
);

// Orders - Records (pas de transformation)
export const selectOrdersRecord = (state: RootState) => state.entities.orders;
export const selectOrderById = (orderId: string) => (state: RootState) =>
  state.entities.orders[orderId] || null;

// Orders - Array (mémorisé)
export const selectOrders = createSelector(
  [selectOrdersRecord],
  (orders) => Object.values(orders)
);

// OrderLines - Records (pas de transformation)
export const selectOrderLinesRecord = (state: RootState) => state.entities.orderLines;
export const selectOrderLineById = (lineId: string) => (state: RootState) =>
  state.entities.orderLines[lineId] || null;

// OrderLines - Array (mémorisé)
export const selectOrderLines = createSelector(
  [selectOrderLinesRecord],
  (orderLines) => Object.values(orderLines)
);

// Menus - Records (pas de transformation)
export const selectMenusRecord = (state: RootState) => state.entities.menus;
export const selectMenuById = (menuId: string) => (state: RootState) =>
  state.entities.menus[menuId] || null;

// Menus - Array (mémorisé)
export const selectMenus = createSelector(
  [selectMenusRecord],
  (menus) => Object.values(menus)
);

// Items - Records (pas de transformation)
export const selectItemsRecord = (state: RootState) => state.entities.items;
export const selectItemById = (itemId: string) => (state: RootState) =>
  state.entities.items[itemId] || null;

// Items - Array (mémorisé)
export const selectItems = createSelector(
  [selectItemsRecord],
  (items) => Object.values(items)
);

// ItemTypes - Records (pas de transformation)
export const selectItemTypesRecord = (state: RootState) => state.entities.itemTypes;
export const selectItemTypeById = (typeId: string) => (state: RootState) =>
  state.entities.itemTypes[typeId] || null;

// ItemTypes - Array (mémorisé et trié par priorité)
export const selectItemTypes = createSelector(
  [selectItemTypesRecord],
  (itemTypes) => Object.values(itemTypes).sort((a, b) => {
    // Tri par priorityOrder croissant (plus petit en premier)
    if (a.priorityOrder !== b.priorityOrder) {
      return (a.priorityOrder || 0) - (b.priorityOrder || 0);
    }
    // Si même priorité, trier par nom
    return a.name.localeCompare(b.name);
  })
);

// Tags - Records (pas de transformation)
export const selectTagsRecord = (state: RootState) => state.entities.tags;
export const selectTagById = (tagId: string) => (state: RootState) =>
  state.entities.tags[tagId] || null;

// Tags - Array (mémorisé)
export const selectTags = createSelector(
  [selectTagsRecord],
  (tags) => Object.values(tags)
);

// Users - Records (pas de transformation)
export const selectUsersRecord = (state: RootState) => state.entities.users;
export const selectUserById = (userId: string) => (state: RootState) =>
  state.entities.users[userId] || null;

// Users - Array (mémorisé)
export const selectUsers = createSelector(
  [selectUsersRecord],
  (users) => Object.values(users)
);

// OrderLineItems - Records (pas de transformation)
export const selectOrderLineItemsRecord = (state: RootState) => state.entities.orderLineItems;
export const selectOrderLineItemById = (orderLineItemId: string) => (state: RootState) =>
  state.entities.orderLineItems[orderLineItemId] || null;

// OrderLineItems - Array (mémorisé)
export const selectOrderLineItems = createSelector(
  [selectOrderLineItemsRecord],
  (orderLineItems) => Object.values(orderLineItems)
);

// Init state
export const selectIsInitialized = (state: RootState) => state.entities.isInitialized;
export const selectInitError = (state: RootState) => state.entities.initError;

// === COMPOSITE SELECTORS (mémorisés avec createSelector) ===

/**
 * Tables enrichies avec leurs commandes actuelles
 */
export const selectTablesWithOrders = createSelector(
  [selectTables, selectOrders],
  (tables, orders) => {
    // Créer un index des commandes par tableId pour O(1) lookup
    const ordersByTableId = new Map<string, Order>();
    orders.forEach(order => {
      if (order.tableId) {
        ordersByTableId.set(order.tableId, order);
      }
    });

    // Enrichir les tables avec leurs commandes
    return tables.map(table => ({
      ...table,
      currentOrder: ordersByTableId.get(table.id) || null,
      status: ordersByTableId.get(table.id)?.status || null,
    }));
  }
);

/**
 * Tables de la salle courante
 */
export const selectCurrentRoomTables = createSelector(
  [selectTables, (state: RootState) => state.session.currentRoomId],
  (tables, currentRoomId) => {
    if (!currentRoomId) return [];
    return tables.filter(table => table.roomId === currentRoomId);
  }
);

/**
 * Tables enrichies de la salle courante
 */
export const selectCurrentRoomTablesWithOrders = createSelector(
  [selectCurrentRoomTables, selectOrders],
  (tables, orders) => {
    const ordersByTableId = new Map<string, Order>();
    orders.forEach(order => {
      if (order.tableId) {
        ordersByTableId.set(order.tableId, order);
      }
    });

    return tables.map(table => ({
      ...table,
      currentOrder: ordersByTableId.get(table.id) || null,
      status: ordersByTableId.get(table.id)?.status || null,
    }));
  }
);

/**
 * Commandes de la salle courante
 */
export const selectCurrentRoomOrders = createSelector(
  [selectOrders, (state: RootState) => state.session.currentRoomId],
  (orders, currentRoomId) => {
    if (!currentRoomId) return [];
    return orders.filter(order => order.table?.roomId === currentRoomId);
  }
);

/**
 * Commande de la table sélectionnée
 */
export const selectSelectedTableOrder = createSelector(
  [selectOrders, (state: RootState) => state.session.selectedTableId],
  (orders, selectedTableId) => {
    if (!selectedTableId) return null;
    return orders.find(order => order.tableId === selectedTableId) || null;
  }
);

/**
 * Salle courante
 */
export const selectCurrentRoom = createSelector(
  [selectRoomsRecord, (state: RootState) => state.session.currentRoomId],
  (rooms, currentRoomId) => {
    if (!currentRoomId) return null;
    return rooms[currentRoomId] || null;
  }
);

/**
 * Table sélectionnée
 */
export const selectSelectedTable = createSelector(
  [selectTablesRecord, (state: RootState) => state.session.selectedTableId],
  (tables, selectedTableId) => {
    if (!selectedTableId) return null;
    return tables[selectedTableId] || null;
  }
);

/**
 * Menus actifs
 */
export const selectActiveMenus = createSelector(
  [selectMenus],
  (menus) => menus.filter(menu => menu.isActive)
);

/**
 * OrderLines par orderId
 */
export const selectOrderLinesByOrderId = (orderId: string) => createSelector(
  [selectOrderLines],
  (orderLines) => orderLines.filter(line => line.orderId === orderId)
);

/**
 * Items par type
 */
export const selectItemsByType = (typeId: string) => createSelector(
  [selectItems],
  (items) => items.filter(item => item.itemTypeId === typeId)
);

/**
 * Utilisateurs par profil
 */
export const selectUsersByProfile = (profile: string) => createSelector(
  [selectUsers],
  (users) => users.filter(user => user.profil === profile)
);

/**
 * Commandes par statut
 */
export const selectOrdersByStatus = (status: string) => createSelector(
  [selectOrders],
  (orders) => orders.filter(order => order.status === status)
);

/**
 * Tables par statut
 */
export const selectTablesByStatus = (status: string) => createSelector(
  [selectTablesWithOrders],
  (tables) => tables.filter(table => table.status === status)
);

/**
 * Commandes avec leurs lignes (pour la cuisine)
 */
export const selectOrdersWithLines = createSelector(
  [selectOrders, selectOrderLines],
  (orders, orderLines) => {
    // Créer un index des lignes par orderId
    const linesByOrderId = new Map<string, OrderLine[]>();
    orderLines.forEach(line => {
      if (!linesByOrderId.has(line.orderId)) {
        linesByOrderId.set(line.orderId, []);
      }
      linesByOrderId.get(line.orderId)!.push(line);
    });

    // Enrichir les commandes avec leurs lignes
    return orders.map(order => ({
      ...order,
      lines: linesByOrderId.get(order.id) || [],
    }));
  }
);

/**
 * Tous les MenuCategoryItems indexés par categoryId
 * Utilisé pour éviter de recalculer dans les hooks
 */
export const selectAllMenuCategoryItems = createSelector(
  [selectMenus],
  (menus) => {
    const items: Record<string, MenuCategoryItem[]> = {};
    menus.forEach(menu => {
      menu.categories?.forEach(category => {
        if (category.items) {
          items[category.id] = category.items;
        }
      });
    });
    return items;
  }
);

// === ALIASES pour compatibilité ===

// Ces aliases permettent une migration progressive
export const selectAllTables = selectTables;
export const selectAllRooms = selectRooms;
export const selectAllOrders = selectOrders;
export const selectAllMenus = selectMenus;
export const selectAllItems = selectItems;
export const selectAllItemTypes = selectItemTypes;
export const selectAllTags = selectTags;
export const selectAllUsers = selectUsers;

// Sélecteurs de navigation (depuis session)
export const selectCurrentRoomId = (state: RootState) => state.session.currentRoomId;
export const selectSelectedTableId = (state: RootState) => state.session.selectedTableId;

// Sélecteurs de connexion (depuis session)
export const selectIsConnected = (state: RootState) => state.session.isWebSocketConnected;
export const selectLastSyncTime = (state: RootState) => state.session.lastSyncTime;