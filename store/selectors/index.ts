import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';
import { EntitiesState } from '../slices/entities.slice';
import { Table } from '~/types/table.types';
import { Order } from '~/types/order.types';
import { OrderLine } from '~/types/order-line.types';
import { Menu } from '~/types/menu.types';
import { getMostImportantStatus } from '~/lib/utils';

/**
 * Selectors optimisés avec mémorisation via createSelector
 * Remplace les 50+ selectors dispersés par une structure claire et performante
 */

// === BASE SELECTORS (pas de recalcul) ===

// Entities state
const selectEntitiesState = (state: RootState) => state.entities;

// Rooms
export const selectRoomsRecord = (state: RootState) => state.entities.rooms;
export const selectRooms = (state: RootState) => Object.values(state.entities.rooms);
export const selectRoomById = (roomId: string) => (state: RootState) => 
  state.entities.rooms[roomId] || null;

// Tables
export const selectTablesRecord = (state: RootState) => state.entities.tables;
export const selectTables = (state: RootState) => Object.values(state.entities.tables);
export const selectTableById = (tableId: string) => (state: RootState) => 
  state.entities.tables[tableId] || null;

// Orders
export const selectOrdersRecord = (state: RootState) => state.entities.orders;
export const selectOrders = (state: RootState) => Object.values(state.entities.orders);
export const selectOrderById = (orderId: string) => (state: RootState) => 
  state.entities.orders[orderId] || null;

// OrderLines
export const selectOrderLinesRecord = (state: RootState) => state.entities.orderLines;
export const selectOrderLines = (state: RootState) => Object.values(state.entities.orderLines);
export const selectOrderLineById = (lineId: string) => (state: RootState) => 
  state.entities.orderLines[lineId] || null;

// Menus
export const selectMenusRecord = (state: RootState) => state.entities.menus;
export const selectMenus = (state: RootState) => Object.values(state.entities.menus);
export const selectMenuById = (menuId: string) => (state: RootState) => 
  state.entities.menus[menuId] || null;

// Items
export const selectItemsRecord = (state: RootState) => state.entities.items;
export const selectItems = (state: RootState) => Object.values(state.entities.items);
export const selectItemById = (itemId: string) => (state: RootState) => 
  state.entities.items[itemId] || null;

// ItemTypes
export const selectItemTypesRecord = (state: RootState) => state.entities.itemTypes;
export const selectItemTypes = (state: RootState) => Object.values(state.entities.itemTypes);
export const selectItemTypeById = (typeId: string) => (state: RootState) => 
  state.entities.itemTypes[typeId] || null;

// Users
export const selectUsersRecord = (state: RootState) => state.entities.users;
export const selectUsers = (state: RootState) => Object.values(state.entities.users);
export const selectUserById = (userId: string) => (state: RootState) => 
  state.entities.users[userId] || null;

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

// === ALIASES pour compatibilité ===

// Ces aliases permettent une migration progressive
export const selectAllTables = selectTables;
export const selectAllRooms = selectRooms;
export const selectAllOrders = selectOrders;
export const selectAllMenus = selectMenus;
export const selectAllItems = selectItems;
export const selectAllItemTypes = selectItemTypes;
export const selectAllUsers = selectUsers;

// Sélecteurs de navigation (depuis session)
export const selectCurrentRoomId = (state: RootState) => state.session.currentRoomId;
export const selectSelectedTableId = (state: RootState) => state.session.selectedTableId;

// Sélecteurs de connexion (depuis session)
export const selectIsConnected = (state: RootState) => state.session.isWebSocketConnected;
export const selectLastSyncTime = (state: RootState) => state.session.lastSyncTime;