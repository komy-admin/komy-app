import { combineReducers } from '@reduxjs/toolkit';
import roomsReducer, { 
  roomsActions,
  type RoomsState,
} from './rooms.slice';
import tablesReducer, { 
  tablesActions,
  type TablesState,
  selectAllTables,
  selectTablesByRoomId,
  selectSelectedTableId,
  selectSelectedTable,
  selectTableById,
  selectTablesLoading,
  selectTablesError,
} from './tables.slice';
import ordersReducer, { 
  ordersActions,
  type OrdersState,
  selectOrders,
  selectOrdersByRoomId,
  selectOrderById,
  selectOrderByTableId,
  selectOrdersLoading,
  selectOrdersError,
} from './orders.slice';
import menuReducer, { 
  menuActions,
  type MenuState,
  selectAllItems,
  selectAllItemTypes,
  selectItemsByType,
  selectItemById,
  selectItemTypeById,
  selectMenuLoading,
  selectMenuError,
} from './menu.slice';
import menusReducer, { 
  menusActions,
  type MenusState,
  selectAllMenus,
  selectActiveMenus,
  selectMenuById,
  selectMenuCategoryItems,
  selectAvailableMenuCategoryItems,
  selectMenusLoading,
  selectMenusError,
} from './menus.slice';
import usersReducer, { 
  usersActions,
  type UsersState,
  selectUsers,
  selectUserById as selectUserByIdFromUsers,
  selectUsersLoading,
  selectUsersError,
  selectUsersByProfile,
} from './users.slice';
import uiReducer, { 
  uiActions,
  type UiState,
  selectAllUsers,
  selectUserById,
  selectIsConnected,
  selectLastSyncTime,
  selectLoadingState,
  selectIsLoading,
  selectErrors,
  selectHasErrors,
  selectErrorByDomain,
  selectLoadingByDomain,
} from './ui.slice';
import menuOrderGroupsReducer, {
  menuOrderGroupsActions,
  type MenuOrderGroupsState,
  selectAllMenuOrderGroups,
  selectMenuOrderGroupsLoading,
  selectMenuOrderGroupsError,
  setMenuOrderGroups,
  addMenuOrderGroup,
  deleteMenuOrderGroup,
} from './menu-order-groups.slice';
import { createSelector } from '@reduxjs/toolkit';
import { Order } from '@/types/order.types';
import { Table } from '@/types/table.types';
import { MenuOrderGroup } from '~/types/menu-order-group.types';

// État combiné du restaurant
export interface RestaurantState {
  rooms: RoomsState;
  tables: TablesState;
  orders: OrdersState;
  menu: MenuState;
  menus: MenusState;
  users: UsersState;
  ui: UiState;
  menuOrderGroups: MenuOrderGroupsState;
}

// Reducer combiné
export const restaurantReducer = combineReducers({
  rooms: roomsReducer,
  tables: tablesReducer,
  orders: ordersReducer,
  menu: menuReducer,
  menus: menusReducer,
  users: usersReducer,
  ui: uiReducer,
  menuOrderGroups: menuOrderGroupsReducer,
});

// Actions combinées
export const restaurantActions = {
  // Actions des rooms
  ...Object.fromEntries(
    Object.entries(roomsActions).map(([key, action]) => [`rooms_${key}`, action])
  ),
  
  // Actions des tables
  ...Object.fromEntries(
    Object.entries(tablesActions).map(([key, action]) => [`tables_${key}`, action])
  ),
  
  // Actions des orders
  ...Object.fromEntries(
    Object.entries(ordersActions).map(([key, action]) => [`orders_${key}`, action])
  ),
  
  // Actions du menu
  ...Object.fromEntries(
    Object.entries(menuActions).map(([key, action]) => [`menu_${key}`, action])
  ),
  
  // Actions des menus
  ...Object.fromEntries(
    Object.entries(menusActions).map(([key, action]) => [`menus_${key}`, action])
  ),
  
  // Actions des users
  ...Object.fromEntries(
    Object.entries(usersActions).map(([key, action]) => [`users_${key}`, action])
  ),
  
  // Actions de l'UI
  ...Object.fromEntries(
    Object.entries(uiActions).map(([key, action]) => [`ui_${key}`, action])
  ),
  
  // Actions des menu order groups
  ...Object.fromEntries(
    Object.entries(menuOrderGroupsActions).map(([key, action]) => [`menuOrderGroups_${key}`, action])
  ),
  
  // Actions simplifiées pour compatibilité
  setRooms: roomsActions.setRooms,
  setCurrentRoom: roomsActions.setCurrentRoom,
  createRoom: roomsActions.createRoom,
  updateRoom: roomsActions.updateRoom,
  deleteRoom: roomsActions.deleteRoom,
  
  setTables: tablesActions.setTables,
  setSelectedTable: tablesActions.setSelectedTable,
  createTable: tablesActions.createTable,
  updateTable: tablesActions.updateTable,
  deleteTable: tablesActions.deleteTable,
  
  setOrders: ordersActions.setOrders,
  createOrder: ordersActions.createOrder,
  updateOrder: ordersActions.updateOrder,
  deleteOrder: ordersActions.deleteOrder,

  createOrderLinesBatch: ordersActions.createOrderLinesBatch,
  updateOrderLine: ordersActions.updateOrderLine,
  deleteOrderLine: ordersActions.deleteOrderLine,
  orderLinesStatusUpdated: ordersActions.orderLinesStatusUpdated,
  orderLineItemsStatusUpdated: ordersActions.orderLineItemsStatusUpdated,
  
  setItems: menuActions.setItems,
  setItemTypes: menuActions.setItemTypes,
  createItemType: menuActions.createItemType,
  updateItemType: menuActions.updateItemType,
  deleteItemType: menuActions.deleteItemType,
  createMenuItem: menuActions.createMenuItem,
  updateMenuItem: menuActions.updateMenuItem,
  deleteMenuItem: menuActions.deleteMenuItem,
  
  setMenus: menusActions.setMenus,
  setMenuCategoryItems: menusActions.setMenuCategoryItems,
  createMenu: menusActions.createMenu,
  updateMenu: menusActions.updateMenu,
  deleteMenu: menusActions.deleteMenu,
  createMenuCategory: menusActions.createMenuCategory,
  updateMenuCategory: menusActions.updateMenuCategory,
  deleteMenuCategory: menusActions.deleteMenuCategory,
  createMenuCategoryItem: menusActions.createMenuCategoryItem,
  updateMenuCategoryItem: menusActions.updateMenuCategoryItem,
  deleteMenuCategoryItem: menusActions.deleteMenuCategoryItem,
  
  setMenuOrderGroups: setMenuOrderGroups,
  addMenuOrderGroup: addMenuOrderGroup,
  deleteMenuOrderGroup: deleteMenuOrderGroup,
  
  setUsers: usersActions.setUsers,
  createUser: usersActions.createUser,
  updateUser: usersActions.updateUser,
  deleteUser: usersActions.deleteUser,
  setConnected: uiActions.setConnected,
  updateLastSyncTime: uiActions.updateLastSyncTime,
  
  // Actions de loading et erreurs
  setLoadingRooms: roomsActions.setLoadingRooms,
  setLoadingTables: tablesActions.setLoadingTables,
  setLoadingOrders: ordersActions.setLoadingOrders,
  setLoadingMenu: menuActions.setLoadingMenu,
  setLoadingMenus: menusActions.setLoadingMenus,
  setLoadingUsers: usersActions.setLoadingUsers,
  
  setErrorRooms: roomsActions.setErrorRooms,
  setErrorTables: tablesActions.setErrorTables,
  setErrorOrders: ordersActions.setErrorOrders,
  setErrorMenu: menuActions.setErrorMenu,
  setErrorMenus: menusActions.setErrorMenus,
  setErrorUsers: usersActions.setErrorUsers,
  setErrorItemTypes: menuActions.setErrorMenu,
  
  // Action de reset global
  resetRestaurantState: () => (dispatch: any) => {
    dispatch(roomsActions.resetRoomsState());
    dispatch(tablesActions.resetTablesState());
    dispatch(ordersActions.resetOrdersState());
    dispatch(menuActions.resetMenuState());
    dispatch(menusActions.resetMenusState());
    dispatch(usersActions.resetUsersState());
    dispatch(uiActions.resetUiState());
  },
};

// Selectors combinés avec logique métier

// Selectors enrichis - OPTIMISÉ avec référence stable
export const selectEnrichedTables = createSelector(
  [
    (state: { restaurant: RestaurantState }) => selectAllTables({ tables: state.restaurant.tables }),
    (state: { restaurant: RestaurantState }) => selectOrders({ orders: state.restaurant.orders }),
  ],
  (tables, orders) => {
    // Index des orders par tableId pour éviter find() O(n) -> O(1)
    const ordersByTableId = new Map<string, Order>();
    orders.forEach(order => {
      if (order.tableId) {
        ordersByTableId.set(order.tableId, order);
      }
    });

    return tables.map((table: Table) => {
      const currentOrder = ordersByTableId.get(table.id);
      return {
        ...table,
        currentOrder,
        status: currentOrder?.status,
      };
    });
  }
);

export const selectCurrentRoomTables = createSelector(
  [
    (state: { restaurant: RestaurantState }) => state.restaurant.rooms.currentRoomId,
    (state: { restaurant: RestaurantState }) => selectAllTables({ tables: state.restaurant.tables }),
    (state: { restaurant: RestaurantState }) => selectOrders({ orders: state.restaurant.orders }),
  ],
  (currentRoomId, tables, orders) => {
    if (!currentRoomId) return [];
    
    // Index des orders par tableId - performance O(1)
    const ordersByTableId = new Map<string, Order>();
    orders.forEach(order => {
      if (order.tableId) {
        ordersByTableId.set(order.tableId, order);
      }
    });

    return tables
      .filter((table: Table) => table.roomId === currentRoomId)
      .map((table: Table) => {
        const currentOrder = ordersByTableId.get(table.id);
        return {
          ...table,
          currentOrder,
          status: currentOrder?.status,
        };
      });
  }
);

export const selectCurrentRoomOrders = createSelector(
  [
    (state: { restaurant: RestaurantState }) => state.restaurant.rooms.currentRoomId,
    (state: { restaurant: RestaurantState }) => selectOrders({ orders: state.restaurant.orders }),
  ],
  (currentRoomId, orders) => {
    if (!currentRoomId) return [];
    return orders.filter((order: Order) => order.table?.roomId === currentRoomId);
  }
);

export const selectSelectedTableOrder = createSelector(
  [
    (state: { restaurant: RestaurantState }) => selectSelectedTableId({ tables: state.restaurant.tables }),
    (state: { restaurant: RestaurantState }) => selectOrders({ orders: state.restaurant.orders }),
  ],
  (selectedTableId, orders) => {
    if (!selectedTableId) return null;
    return orders.find((order: Order) => order.tableId === selectedTableId) || null;
  }
);

// Selectors adaptés pour la structure du state restaurant
export const selectAllRooms = createSelector(
  [(state: { restaurant: RestaurantState }) => state.restaurant.rooms.rooms],
  (rooms) => Object.values(rooms)
);

export const selectCurrentRoom = (state: { restaurant: RestaurantState }) => {
  const { currentRoomId, rooms } = state.restaurant.rooms;
  return currentRoomId ? rooms[currentRoomId] || null : null;
};

export const selectCurrentRoomId = (state: { restaurant: RestaurantState }) => 
  state.restaurant.rooms.currentRoomId;

export const selectRoomById = (roomId: string) => (state: { restaurant: RestaurantState }) => 
  state.restaurant.rooms.rooms[roomId] || null;

// OPTIMISÉ : Sélecteurs memoizés pour MenuOrderGroups avec index pré-calculé
export const selectOptimizedMenuOrderGroupsByOrderId = createSelector(
  [(state: { restaurant: RestaurantState }) => state.restaurant.menuOrderGroups.menuOrderGroups],
  (menuOrderGroups) => {
    // Créer un index Map une seule fois quand menuOrderGroups change
    const groupsByOrderId = new Map<string, MenuOrderGroup[]>();
    menuOrderGroups.forEach((group: MenuOrderGroup) => {
      if (!groupsByOrderId.has(group.orderId)) {
        groupsByOrderId.set(group.orderId, []);
      }
      groupsByOrderId.get(group.orderId)!.push(group);
    });
    
    // Retourner une fonction de lookup O(1)
    return (orderId: string) => groupsByOrderId.get(orderId) || [];
  }
);

export const selectOptimizedMenuOrderGroupById = createSelector(
  [(state: { restaurant: RestaurantState }) => state.restaurant.menuOrderGroups.menuOrderGroups],
  (menuOrderGroups) => {
    // Index par ID pour lookup O(1)
    const groupsById = new Map<string, MenuOrderGroup>();
    menuOrderGroups.forEach((group: MenuOrderGroup) => {
      groupsById.set(group.id, group);
    });
    
    return (groupId: string) => groupsById.get(groupId) || null;
  }
);

export const selectRoomsLoading = (state: { restaurant: RestaurantState }) => 
  state.restaurant.rooms.loading;

export const selectRoomsError = (state: { restaurant: RestaurantState }) => 
  state.restaurant.rooms.error;

// Export de tous les selectors
export {
  
  // Tables
  selectAllTables,
  selectTablesByRoomId,
  selectSelectedTableId,
  selectSelectedTable,
  selectTableById,
  selectTablesLoading,
  selectTablesError,
  
  // Orders
  selectOrders,
  selectOrdersByRoomId,
  selectOrderById,
  selectOrderByTableId,
  selectOrdersLoading,
  selectOrdersError,
  
  // Menu
  selectAllItems,
  selectAllItemTypes,
  selectItemsByType,
  selectItemById,
  selectItemTypeById,
  selectMenuLoading,
  selectMenuError,
  
  // Menus
  selectAllMenus,
  selectActiveMenus,
  selectMenuById,
  selectMenuCategoryItems,
  selectAvailableMenuCategoryItems,
  selectMenusLoading,
  selectMenusError,
  
  // Users
  selectUsers,
  selectUserByIdFromUsers,
  selectUsersLoading,
  selectUsersError,
  selectUsersByProfile,
  
  // UI
  selectAllUsers,
  selectUserById,
  selectIsConnected,
  selectLastSyncTime,
  selectLoadingState,
  selectIsLoading,
  selectErrors,
  selectHasErrors,
  selectErrorByDomain,
  selectLoadingByDomain,
  
  // MenuOrderGroups
  selectAllMenuOrderGroups,
  selectMenuOrderGroupsLoading,
  selectMenuOrderGroupsError,
};

// Export des types
export type {
  RoomsState,
  TablesState,
  OrdersState,
  MenuState,
  MenusState,
  UsersState,
  UiState,
  MenuOrderGroupsState,
};