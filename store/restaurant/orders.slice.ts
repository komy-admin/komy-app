import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { Order } from '~/types/order.types';
import { OrderItem } from '~/types/order-item.types';
import { Status } from '~/types/status.enum';
import { getMostImportantStatus } from '~/lib/utils';

// Types pour le state des orders
export interface OrdersState {
  orders: Record<string, Order>;
  orderItems: Record<string, OrderItem>;
  loading: boolean;
  error: string | null;
}

// État initial
const initialState: OrdersState = {
  orders: {},
  orderItems: {},
  loading: false,
  error: null,
};

// Types pour les actions
interface SetOrdersPayload {
  orders: Order[];
  roomId: string;
}

interface UpdateOrderStatusPayload {
  orderId: string;
  status: Status;
  itemTypeId?: string;
  // updatedAt pas nécessaire - géré par le backend
}

interface OrderItemsStatusUpdatedPayload {
  orderItemIds: string[];
  status: Status;
  updatedAt?: string;
}

interface CreateOrderItemsBatchPayload {
  orderItems: OrderItem[];
}

// Slice pour les orders
const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    // Actions de chargement
    setLoadingOrders: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
      if (action.payload) state.error = null;
    },
    
    setErrorOrders: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    
    // Actions pour les données
    setOrders: (state, action: PayloadAction<SetOrdersPayload>) => {
      const { orders, roomId } = action.payload;
      
      // Filtrer les orders de la room courante et normaliser
      orders.forEach(order => {
        if (order.table?.roomId === roomId) {
          state.orders[order.id] = order;
          
          // Normaliser les orderItems (ancienne structure + rétrocompatibilité)
          order.orderItems?.forEach(orderItem => {
            state.orderItems[orderItem.id] = orderItem;
          });
          
          // Normaliser les individualItems (nouvelle structure)
          order.individualItems?.forEach(orderItem => {
            state.orderItems[orderItem.id] = orderItem;
          });
          
          // Normaliser les orderItems des menus (nouvelle structure)
          order.menus?.forEach(menu => {
            menu.orderItems?.forEach(orderItem => {
              state.orderItems[orderItem.id] = orderItem;
            });
          });
        }
      });
      
      state.loading = false;
      state.error = null;
    },
    
    // Actions WebSocket pour les orders
    createOrder: (state, action: PayloadAction<{ order: Order }>) => {
      const { order } = action.payload;
      state.orders[order.id] = order;
      
      // Ajouter les orderItems (ancienne structure + rétrocompatibilité)
      order.orderItems?.forEach(orderItem => {
        state.orderItems[orderItem.id] = orderItem;
      });
      
      // Ajouter les individualItems (nouvelle structure)
      order.individualItems?.forEach(orderItem => {
        state.orderItems[orderItem.id] = orderItem;
      });
      
      // Ajouter les orderItems des menus (nouvelle structure)
      order.menus?.forEach(menu => {
        menu.orderItems?.forEach(orderItem => {
          state.orderItems[orderItem.id] = orderItem;
        });
      });
    },

    updateOrder: (state, action: PayloadAction<{ order: Order }>) => {
      const { order } = action.payload;
      state.orders[order.id] = order;
      
      // Mettre à jour les orderItems (ancienne structure + rétrocompatibilité)
      order.orderItems?.forEach(orderItem => {
        state.orderItems[orderItem.id] = orderItem;
      });
      
      // Mettre à jour les individualItems (nouvelle structure)
      order.individualItems?.forEach(orderItem => {
        state.orderItems[orderItem.id] = orderItem;
      });
      
      // Mettre à jour les orderItems des menus (nouvelle structure)
      order.menus?.forEach(menu => {
        menu.orderItems?.forEach(orderItem => {
          state.orderItems[orderItem.id] = orderItem;
        });
      });
    },
    
    deleteOrder: (state, action: PayloadAction<{ orderId: string }>) => {
      const { orderId } = action.payload;
      const order = state.orders[orderId];
      
      if (order) {
        // Supprimer les orderItems associés (ancienne structure)
        order.orderItems?.forEach(orderItem => {
          delete state.orderItems[orderItem.id];
        });
        
        // Supprimer les individualItems (nouvelle structure)
        order.individualItems?.forEach(orderItem => {
          delete state.orderItems[orderItem.id];
        });
        
        // Supprimer les orderItems des menus (nouvelle structure)
        order.menus?.forEach(menu => {
          menu.orderItems?.forEach(orderItem => {
            delete state.orderItems[orderItem.id];
          });
        });
      }
      
      delete state.orders[orderId];
    },
    
    // Actions pour les orderItems
    updateOrderItems: (state, action: PayloadAction<{ orderId: string; orderItems: OrderItem[] }>) => {
      const { orderId, orderItems } = action.payload;
      
      if (state.orders[orderId]) {
        state.orders[orderId].orderItems = orderItems;
        
        // Mettre à jour les orderItems normalisés
        orderItems.forEach(orderItem => {
          state.orderItems[orderItem.id] = orderItem;
        });
        
        // Recalculer le statut de l'order
        const statuses = orderItems.map(item => item.status);
        state.orders[orderId].status = getMostImportantStatus(statuses);
      }
    },
    
    // Actions WebSocket pour les orderItems
    updateOrderItem: (state, action: PayloadAction<{ orderItem: OrderItem }>) => {
      const { orderItem } = action.payload;
      
      // Mettre à jour l'orderItem normalisé
      state.orderItems[orderItem.id] = orderItem;
      
      // Trouver l'order correspondant et mettre à jour ses items
      Object.values(state.orders).forEach(order => {
        const itemIndex = order.orderItems?.findIndex(item => item.id === orderItem.id);
        if (itemIndex !== undefined && itemIndex !== -1 && order.orderItems) {
          order.orderItems[itemIndex] = orderItem;
          
          // Recalculer le statut de l'order
          const statuses = order.orderItems.map(item => item.status);
          order.status = getMostImportantStatus(statuses);
        }
      });
    },

    // WebSocket: Création d'orderItems en lot
    createOrderItemsBatch: (state, action: PayloadAction<CreateOrderItemsBatchPayload>) => {
      const { orderItems } = action.payload;
      
      if (orderItems.length === 0) return;
      
      // Groupe les orderItems par orderId pour optimiser les mises à jour
      const orderItemsByOrderId = new Map<string, OrderItem[]>();
      
      orderItems.forEach(orderItem => {
        // Ajouter l'orderItem au store normalisé
        state.orderItems[orderItem.id] = orderItem;
        
        // Grouper par orderId
        const orderId = orderItem.orderId;
        if (!orderItemsByOrderId.has(orderId)) {
          orderItemsByOrderId.set(orderId, []);
        }
        orderItemsByOrderId.get(orderId)!.push(orderItem);
      });
      
      // Mettre à jour chaque order concerné
      orderItemsByOrderId.forEach((newItems, orderId) => {
        const order = state.orders[orderId];
        if (order) {
          // Ajouter les nouveaux items à l'order
          if (!order.orderItems) {
            order.orderItems = [];
          }
          order.orderItems.push(...newItems);
          
          // Recalculer le statut de l'order
          const statuses = order.orderItems.map(item => item.status);
          order.status = getMostImportantStatus(statuses);
        }
      });
    },
    
    deleteOrderItem: (state, action: PayloadAction<{ orderItemId: string }>) => {
      const { orderItemId } = action.payload;
      
      // Supprimer l'orderItem normalisé
      delete state.orderItems[orderItemId];
      
      // Trouver et supprimer l'orderItem de l'order correspondant
      Object.values(state.orders).forEach(order => {
        if (order.orderItems) {
          const itemIndex = order.orderItems.findIndex(item => item.id === orderItemId);
          if (itemIndex !== -1) {
            order.orderItems.splice(itemIndex, 1);
            
            // Recalculer le statut de l'order
            const statuses = order.orderItems.map(item => item.status);
            order.status = getMostImportantStatus(statuses);
          }
        }
      });
    },
    
    // WebSocket: Mise à jour du statut des order items
    orderItemsStatusUpdated: (state, action: PayloadAction<OrderItemsStatusUpdatedPayload>) => {
      const { orderItemIds, status, updatedAt } = action.payload;
      const currentTimestamp = updatedAt || new Date().toISOString();
      
      // Mettre à jour tous les orderItems concernés
      orderItemIds.forEach(orderItemId => {
        if (state.orderItems[orderItemId]) {
          state.orderItems[orderItemId].status = status;
          state.orderItems[orderItemId].updatedAt = currentTimestamp;
        }
      });
      
      // Mettre à jour les orders correspondants
      Object.values(state.orders).forEach(order => {
        let hasUpdatedItems = false;
        
        order.orderItems?.forEach(item => {
          if (orderItemIds.includes(item.id)) {
            item.status = status;
            item.updatedAt = currentTimestamp;
            hasUpdatedItems = true;
          }
        });
        
        // Recalculer le statut de l'order si des items ont été mis à jour
        if (hasUpdatedItems && order.orderItems) {
          const statuses = order.orderItems.map(item => item.status);
          order.status = getMostImportantStatus(statuses);
          // Note: updatedAt de l'Order est géré automatiquement par le backend
        }
      });
    },
    
    // API: Mise à jour du statut d'une order complète
    updateOrderStatus: (state, action: PayloadAction<UpdateOrderStatusPayload>) => {
      const { orderId, status, itemTypeId } = action.payload;
      const currentTimestamp = new Date().toISOString(); // Pour les OrderItems seulement (local, coté back la données est a jour)
      
      const order = state.orders[orderId];
      if (!order || !order.orderItems) return;
      
      // Si itemTypeId est spécifié, mettre à jour seulement les items de ce type
      if (itemTypeId) {
        order.orderItems.forEach(item => {
          if (item.item.itemType.id === itemTypeId) {
            item.status = status;
            item.updatedAt = currentTimestamp;
            // Mettre à jour aussi l'orderItem normalisé
            if (state.orderItems[item.id]) {
              state.orderItems[item.id].status = status;
              state.orderItems[item.id].updatedAt = currentTimestamp;
            }
          }
        });
        
        // Recalculer le statut global de l'order
        const statuses = order.orderItems.map(item => item.status);
        order.status = getMostImportantStatus(statuses);
        // Note: updatedAt de l'Order est géré automatiquement par le backend
      } else {
        // Mettre à jour tous les items et l'order
        order.orderItems.forEach(item => {
          item.status = status;
          item.updatedAt = currentTimestamp;
          // Mettre à jour aussi l'orderItem normalisé
          if (state.orderItems[item.id]) {
            state.orderItems[item.id].status = status;
            state.orderItems[item.id].updatedAt = currentTimestamp;
          }
        });
        order.status = status;
        // Note: updatedAt de l'Order est géré automatiquement par le backend
      }
    },
    
    // Action pour nettoyer l'état
    resetOrdersState: () => initialState,
  },
});

// Selectors de base
const selectOrdersState = (state: { orders: OrdersState }) => state.orders;

export const selectOrders = createSelector(
  [selectOrdersState],
  (ordersState) => ordersState ? Object.values(ordersState.orders) : []
);

export const selectOrdersByRoomId = (roomId: string) => createSelector(
  [selectOrdersState],
  (ordersState) => {
    if (!ordersState) return [];
    return Object.values(ordersState.orders).filter(
      order => order.table && order.table.roomId === roomId
    );
  }
);

export const selectOrderById = (orderId: string) => createSelector(
  [selectOrdersState],
  (ordersState) => ordersState?.orders[orderId] || null
);

export const selectOrderByTableId = (tableId: string) => createSelector(
  [selectOrdersState],
  (ordersState) => {
    if (!ordersState) return null;
    return Object.values(ordersState.orders).find(order => order.tableId === tableId) || null;
  }
);

export const selectAllOrderItems = createSelector(
  [selectOrdersState],
  (ordersState) => ordersState ? Object.values(ordersState.orderItems) : []
);

export const selectOrderItemById = (orderItemId: string) => createSelector(
  [selectOrdersState],
  (ordersState) => ordersState?.orderItems[orderItemId] || null
);

export const selectOrdersLoading = createSelector(
  [selectOrdersState],
  (ordersState) => ordersState?.loading || false
);

export const selectOrdersError = createSelector(
  [selectOrdersState],
  (ordersState) => ordersState?.error || null
);

// Nouveaux sélecteurs pour la structure avec menus
export const selectOrderIndividualItems = (orderId: string) => createSelector(
  [selectOrderById(orderId)],
  (order) => order?.individualItems || []
);

export const selectOrderMenus = (orderId: string) => createSelector(
  [selectOrderById(orderId)],
  (order) => order?.menus || []
);

export const selectOrderAllItems = (orderId: string) => createSelector(
  [selectOrderById(orderId)],
  (order) => {
    if (!order) return [];
    
    const allItems = [];
    
    // Ajouter les items individuels
    if (order.individualItems) {
      allItems.push(...order.individualItems);
    }
    
    // Ajouter les items des menus
    if (order.menus) {
      order.menus.forEach(menu => {
        if (menu.orderItems) {
          allItems.push(...menu.orderItems);
        }
      });
    }
    
    // Fallback sur l'ancienne structure si la nouvelle est vide
    if (allItems.length === 0 && order.orderItems) {
      allItems.push(...order.orderItems);
    }
    
    return allItems;
  }
);

export const selectOrderHasMenus = (orderId: string) => createSelector(
  [selectOrderById(orderId)],
  (order) => Boolean(order?.menus && order.menus.length > 0)
);

export const selectOrderHasIndividualItems = (orderId: string) => createSelector(
  [selectOrderById(orderId)],
  (order) => Boolean(order?.individualItems && order.individualItems.length > 0)
);

// Actions exportées
export const ordersActions = ordersSlice.actions;
export default ordersSlice.reducer;

// Types exportés
export type {
  SetOrdersPayload,
  UpdateOrderStatusPayload,
  OrderItemsStatusUpdatedPayload,
  CreateOrderItemsBatchPayload,
};