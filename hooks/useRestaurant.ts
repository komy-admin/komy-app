import { useSelector } from 'react-redux';
import { 
  selectIsLoading,
  selectLoadingState,
  selectErrors,
  selectIsConnected,
  selectLastSyncTime,
} from '~/store/restaurant';
import { useRestaurantSocket } from './useRestaurantSocket';
import { useRooms } from './useRooms';
import { useTables } from './useTables';
import { useOrders } from './useOrders';
import { useMenu } from './useMenu';
import { useUsers } from './useUsers';
import { useRestaurantInit } from './useRestaurantInit';
import { useMenus } from './useMenus';

/**
 * Hook principal simplifié qui combine tous les hooks spécialisés
 * Plus lisible et organisé que l'ancien useRestaurant de 500+ lignes
 */
export const useRestaurant = () => {
  // Initialiser la connexion WebSocket
  const { isConnected: socketConnected } = useRestaurantSocket();

  // État global
  const isLoading = useSelector(selectIsLoading);
  const loadingState = useSelector(selectLoadingState);
  const errors = useSelector(selectErrors);
  const isConnected = useSelector(selectIsConnected);
  const lastSyncTime = useSelector(selectLastSyncTime);

  // Hooks spécialisés
  const roomsHook = useRooms();
  const tablesHook = useTables();
  const ordersHook = useOrders();
  const menuHook = useMenu();
  const menusHook = useMenus();
  const usersHook = useUsers();

  return {
    // === DONNÉES ===
    // Salles
    rooms: roomsHook.rooms,
    currentRoom: roomsHook.currentRoom,
    currentRoomId: roomsHook.currentRoomId,
    
    // Tables
    tables: tablesHook.tables,
    enrichedTables: tablesHook.enrichedTables,
    selectedTable: tablesHook.selectedTable,
    selectedTableOrder: tablesHook.getSelectedTableOrder(),
    
    // Commandes
    orders: ordersHook.orders,
    currentRoomOrders: ordersHook.currentRoomOrders,
    
    // Menu
    menus: menusHook.allMenus,
    items: menuHook.items,
    itemTypes: menuHook.itemTypes,
    
    // Utilisateurs
    users: usersHook.users,
    
    // === ÉTAT GLOBAL ===
    isLoading,
    loadingState,
    errors,
    isConnected,
    socketConnected,
    lastSyncTime,
    
    // === ACTIONS DE NAVIGATION ===
    setCurrentRoom: roomsHook.setCurrentRoom,
    setSelectedTable: tablesHook.setSelectedTable,
    
    // === ACTIONS CRUD SALLES ===
    loadRooms: roomsHook.loadRooms,
    createRoom: roomsHook.createRoom,
    updateRoom: roomsHook.updateRoom,
    deleteRoom: roomsHook.deleteRoom,
    
    // === ACTIONS CRUD TABLES ===
    createTable: tablesHook.createTable,
    updateTable: tablesHook.updateTable,
    deleteTable: tablesHook.deleteTable,
    
    // === ACTIONS CRUD COMMANDES ===
    loadOrdersForRoom: ordersHook.loadOrdersForRoom,
    loadAllOrders: ordersHook.loadAllOrders,
    createOrder: ordersHook.createOrder,
    deleteOrder: ordersHook.deleteOrder,
    updateOrderStatus: ordersHook.updateOrderStatus,
    
    // === ACTIONS CRUD MENU ===
    createMenuItem: menuHook.createMenuItem,
    updateMenuItem: menuHook.updateMenuItem,
    deleteMenuItem: menuHook.deleteMenuItem,
    loadItemTypes: menuHook.loadItemTypes,
    
    // === ACTIONS CRUD UTILISATEURS ===
    loadUsers: usersHook.loadUsers,
    createUser: usersHook.createUser,
    updateUser: usersHook.updateUser,
    deleteUser: usersHook.deleteUser,
    getOrGenerateQrToken: usersHook.getOrGenerateQrToken,
    regenerateQrToken: usersHook.regenerateQrToken,
    
    // === UTILITAIRES ===
    getTableById: tablesHook.getTableById,
    getOrderById: ordersHook.getOrderById,
    getOrderByTableId: ordersHook.getOrderByTableId,
    getItemById: menuHook.getItemById,
    getRoomById: roomsHook.getRoomById,
    getUserById: usersHook.getUserById,
    getUsersByProfile: usersHook.getUsersByProfile,
    searchUsers: usersHook.searchUsers,
  };
};

// Export des hooks spécialisés pour un usage direct
export { useRooms } from './useRooms';
export { useTables } from './useTables';
export { useOrders } from './useOrders';
export { useMenu } from './useMenu';
export { useUsers } from './useUsers';
export { useRestaurantInit } from './useRestaurantInit';