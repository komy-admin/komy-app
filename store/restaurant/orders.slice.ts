import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { Order } from '~/types/order.types';
import { OrderLine, OrderLineItem, OrderLineType } from '~/types/order-line.types';
import { Status } from '~/types/status.enum';
import { getMostImportantStatus } from '~/lib/utils';
import { RestaurantState } from '.';

// Types pour le state des orders
export interface OrdersState {
  orders: Record<string, Order>;
  // 🆕 Structure OrderLine unifiée
  orderLines: Record<string, OrderLine>;
  orderLineItems: Record<string, OrderLineItem>; // Items individuels des menus
  loading: boolean;
  error: string | null;
}

// État initial
const initialState: OrdersState = {
  orders: {},
  // 🆕 État OrderLine
  orderLines: {},
  orderLineItems: {},
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


// 🆕 Types pour les actions OrderLine
interface CreateOrderLinesBatchPayload {
  orderLines: OrderLine[];
}

interface UpdateOrderLinePayload {
  orderLine: OrderLine;
}

interface UpdateOrderLineItemPayload {
  orderLineItem: OrderLineItem;
}

interface OrderLinesStatusUpdatedPayload {
  orderLineIds: string[];
  status: Status;
  updatedAt?: string;
}

interface OrderLineItemsStatusUpdatedPayload {
  orderLineItemIds: string[];
  status: Status;
  updatedAt?: string;
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
          
          // Normaliser les OrderLines
          order.lines?.forEach(orderLine => {
            state.orderLines[orderLine.id] = orderLine;
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
      
      // Normaliser les OrderLines
      order.lines.forEach(orderLine => {
        state.orderLines[orderLine.id] = orderLine;
        
        // Normaliser les OrderLineItems des menus
        orderLine.items?.forEach(orderLineItem => {
          state.orderLineItems[orderLineItem.id] = orderLineItem;
        });
      });
    },

    updateOrder: (state, action: PayloadAction<{ order: Order }>) => {
      const { order } = action.payload;
      const existingOrder = state.orders[order.id];
      
      // Préserver les données table si elles ne sont pas fournies dans la mise à jour
      const updatedOrder = {
        ...order,
        table: order.table || existingOrder?.table
      };
      
      state.orders[order.id] = updatedOrder;
      
      // Mettre à jour les OrderLines
      order.lines.forEach(orderLine => {
        state.orderLines[orderLine.id] = orderLine;
        
        // Mettre à jour les OrderLineItems des menus
        orderLine.items?.forEach(orderLineItem => {
          state.orderLineItems[orderLineItem.id] = orderLineItem;
        });
      });
    },
    
    deleteOrder: (state, action: PayloadAction<{ orderId: string }>) => {
      const { orderId } = action.payload;
      const order = state.orders[orderId];
      
      if (order) {
        // Supprimer les OrderLines
        order.lines.forEach(orderLine => {
          delete state.orderLines[orderLine.id];
          
          // Supprimer les OrderLineItems des menus
          orderLine.items?.forEach(orderLineItem => {
            delete state.orderLineItems[orderLineItem.id];
          });
        });
      }
      
      delete state.orders[orderId];
    },
    
    // 🆕 Actions pour les OrderLines
    
    // WebSocket: Création d'OrderLines en lot
    createOrderLinesBatch: (state, action: PayloadAction<CreateOrderLinesBatchPayload>) => {
      const { orderLines } = action.payload;
      
      if (orderLines.length === 0) return;
      
      orderLines.forEach(orderLine => {
        // Ajouter l'OrderLine au store normalisé
        state.orderLines[orderLine.id] = orderLine;
        
        // Normaliser les OrderLineItems des menus
        orderLine.items?.forEach(orderLineItem => {
          state.orderLineItems[orderLineItem.id] = orderLineItem;
        });
      });
    },

    // WebSocket: Mise à jour d'une OrderLine
    updateOrderLine: (state, action: PayloadAction<UpdateOrderLinePayload>) => {
      const { orderLine } = action.payload;
      
      // Mettre à jour l'OrderLine normalisée
      state.orderLines[orderLine.id] = orderLine;
      
      // Mettre à jour les OrderLineItems des menus
      orderLine.items?.forEach(orderLineItem => {
        state.orderLineItems[orderLineItem.id] = orderLineItem;
      });
    },

    // WebSocket: Suppression d'une OrderLine
    deleteOrderLine: (state, action: PayloadAction<{ orderLineId: string }>) => {
      const { orderLineId } = action.payload;
      const orderLine = state.orderLines[orderLineId];
      
      if (orderLine) {
        // Supprimer les OrderLineItems associés
        orderLine.items?.forEach(orderLineItem => {
          delete state.orderLineItems[orderLineItem.id];
        });
        
        // Trouver l'Order qui contient cette OrderLine et la retirer de son array lines
        Object.values(state.orders).forEach(order => {
          if (order.lines) {
            const lineIndex = order.lines.findIndex(line => line.id === orderLineId);
            if (lineIndex !== -1) {
              order.lines.splice(lineIndex, 1);
            }
          }
        });
        
        // Supprimer l'OrderLine du store normalisé
        delete state.orderLines[orderLineId];
      }
    },

    // WebSocket: Mise à jour du statut des OrderLines (items individuels)
    orderLinesStatusUpdated: (state, action: PayloadAction<OrderLinesStatusUpdatedPayload>) => {
      const { orderLineIds, status, updatedAt } = action.payload;
      
      orderLineIds.forEach(orderLineId => {
        const orderLine = state.orderLines[orderLineId];
        if (orderLine && orderLine.status) {
          // Mettre à jour seulement si c'est un item individuel (type ITEM)
          orderLine.status = status;
        }
      });
    },

    // WebSocket: Mise à jour du statut des OrderLineItems (items dans les menus)
    orderLineItemsStatusUpdated: (state, action: PayloadAction<OrderLineItemsStatusUpdatedPayload>) => {
      const { orderLineItemIds, status, updatedAt } = action.payload;
      
      orderLineItemIds.forEach(orderLineItemId => {
        const orderLineItem = state.orderLineItems[orderLineItemId];
        if (orderLineItem) {
          orderLineItem.status = status;
        }
      });
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

export const selectOrdersLoading = createSelector(
  [selectOrdersState],
  (ordersState) => ordersState?.loading || false
);

export const selectOrdersError = createSelector(
  [selectOrdersState],
  (ordersState) => ordersState?.error || null
);

// 🆕 Sélecteurs pour OrderLines

export const selectAllOrderLines = createSelector(
  [selectOrdersState],
  (ordersState) => {
    const result = ordersState ? Object.values(ordersState.orderLines) : [];
    return result;
  }
);

// Sélecteur enrichi avec orderId pour les OrderLines
export const selectAllOrderLinesWithOrderId = createSelector(
  [
    (state: { restaurant: RestaurantState }) => selectOrders({ orders: state.restaurant.orders }),
    (state: { restaurant: RestaurantState }) => selectAllOrderLines({ orders: state.restaurant.orders })
  ],
  (orders, orderLines) => {
    
    const result = orderLines.map(orderLine => {
      // Trouver l'order qui contient cette OrderLine
      const order = orders.find(order => 
        order.lines && order.lines.some(line => line.id === orderLine.id)
      );
      
      const enriched = {
        ...orderLine,
        orderId: order?.id || ''
      };
      
      return enriched;
    });
    
    return result;
  }
);

export const selectOrderLineById = (orderLineId: string) => createSelector(
  [selectOrdersState],
  (ordersState) => ordersState?.orderLines[orderLineId] || null
);

export const selectAllOrderLineItems = createSelector(
  [selectOrdersState],
  (ordersState) => {
    const result = ordersState ? Object.values(ordersState.orderLineItems) : [];
    return result;
  }
);

// Sélecteur enrichi pour les OrderLineItems avec contexte (orderId, menuName, etc.)
export const selectAllOrderLineItemsWithContext = createSelector(
  [
    (state: { restaurant: RestaurantState }) => selectOrders({ orders: state.restaurant.orders }),
    (state: { restaurant: RestaurantState }) => selectAllOrderLines({ orders: state.restaurant.orders }),
    (state: { restaurant: RestaurantState }) => selectAllOrderLineItems({ orders: state.restaurant.orders })
  ],
  (orders, orderLines, orderLineItems) => {
    
    const result = orderLineItems.map(orderLineItem => {
      // Trouver l'OrderLine parente (le menu)
      const parentOrderLine = orderLines.find(line => 
        line.items && line.items.some(item => item.id === orderLineItem.id)
      );
      
      // Trouver l'order qui contient cette OrderLine
      const order = orders.find(order => 
        order.lines && order.lines.some(line => line.id === parentOrderLine?.id)
      );
      
      const enriched = {
        ...orderLineItem,
        orderId: order?.id || '',
        menuId: parentOrderLine?.menu?.id || '',
        menuName: parentOrderLine?.menu?.name || 'Menu',
        orderLineId: parentOrderLine?.id || ''
      };
      
      return enriched;
    });
    
    return result;
  }
);

// Sélecteur combiné pour la cuisine : OrderLines individuelles + OrderLineItems des menus
export const selectAllKitchenItems = createSelector(
  [
      (state: { restaurant: RestaurantState }) => selectOrders({ orders: state.restaurant.orders })
  ],
  (orders) => {
    
    const kitchenItems: Array<{
      id: string;
      orderId: string;
      status: Status;
      type: 'ITEM' | 'MENU_ITEM';
      itemName: string;
      itemType?: string;
      menuName?: string;
      menuId?: string;
      orderLineId?: string;
    }> = [];

    console.log('Orders:', orders)
    
    orders.forEach(order => {
      if (!order.lines) {
        return;
      }

      order.lines.forEach(line => {
        // Ajouter les OrderLines individuelles (type ITEM)
        if (line.type === OrderLineType.ITEM) {
          
          if (line.status) {
            const item = {
              id: line.id,
              orderId: order.id,
              status: line.status,
              type: 'ITEM' as const,
              itemName: line.item?.name || 'Article',
              itemType: line.item?.itemType?.name
            };
            kitchenItems.push(item);
          }
        }
        
        // Ajouter les OrderLineItems des menus (type MENU)
        if (line.type === OrderLineType.MENU && line.items) {

          line.items.forEach(orderLineItem => {
            const menuItem = {
              id: orderLineItem.id,
              orderId: order.id,
              status: orderLineItem.status,
              type: 'MENU_ITEM' as const,
              itemName: orderLineItem.item?.name || 'Article de menu',
              itemType: orderLineItem.item?.itemType?.name,
              menuName: line.menu?.name || 'Menu',
              menuId: line.menu?.id || '',
              orderLineId: line.id
            };
            kitchenItems.push(menuItem);
          });
        }
      });
    });

    console.log('Kitchen items:', kitchenItems)
    
    return kitchenItems;
  }
);

export const selectOrderLineItemById = (orderLineItemId: string) => createSelector(
  [selectOrdersState],
  (ordersState) => ordersState?.orderLineItems[orderLineItemId] || null
);

// Sélecteurs pour les OrderLines d'une commande spécifique
export const selectOrderLinesByOrderId = (orderId: string) => createSelector(
  [selectOrderById(orderId)],
  (order) => order?.lines || []
);

export const selectOrderHasLines = (orderId: string) => createSelector(
  [selectOrderById(orderId)],
  (order) => Boolean(order?.lines && order.lines.length > 0)
);

// Calcul du statut global d'une commande basé sur les OrderLines
export const selectOrderStatusFromLines = (orderId: string) => createSelector(
  [
    selectOrderLinesByOrderId(orderId),
    (state: { restaurant: RestaurantState }) => state.restaurant.orders
  ],
  (orderLines, ordersState) => {
    if (!orderLines.length) return null;
    
    const allStatuses: Status[] = [];
    
    orderLines.forEach(line => {
      if (line.type === 'ITEM' && line.status) {
        // Items individuels: status sur OrderLine
        allStatuses.push(line.status);
      } else if (line.type === 'MENU' && line.items) {
        // Menus: collecter les status de tous les OrderLineItems
        line.items.forEach(menuItem => {
          const orderLineItem = ordersState?.orderLineItems[menuItem.id];
          if (orderLineItem) {
            allStatuses.push(orderLineItem.status);
          }
        });
      }
    });
    
    return allStatuses.length > 0 ? getMostImportantStatus(allStatuses) : null;
  }
);

// Progression des menus dans une commande
export const selectOrderMenuProgress = (orderId: string) => createSelector(
  [
    selectOrderLinesByOrderId(orderId),
    (state: { restaurant: RestaurantState }) => state.restaurant.orders
  ],
  (orderLines, ordersState) => {
    const menuProgress: Record<string, { completed: number; total: number; percentage: number; hasErrors: boolean }> = {};
    
    orderLines.forEach(line => {
      if (line.type === 'MENU' && line.items) {
        const items = line.items.map(item => ordersState?.orderLineItems[item.id]).filter(Boolean);
        const completedCount = items.filter(item => 
          item && ['ready', 'served', 'terminated'].includes(item.status)
        ).length;
        
        menuProgress[line.id] = {
          completed: completedCount,
          total: items.length,
          percentage: Math.round((completedCount / items.length) * 100),
          hasErrors: items.some(item => item && item.status === 'error')
        };
      }
    });
    
    return menuProgress;
  }
);

// Actions exportées
export const ordersActions = ordersSlice.actions;
export default ordersSlice.reducer;

// Types exportés
export type {
  SetOrdersPayload,
  UpdateOrderStatusPayload,
  // 🆕 Types OrderLine
  CreateOrderLinesBatchPayload,
  UpdateOrderLinePayload,
  UpdateOrderLineItemPayload,
  OrderLinesStatusUpdatedPayload,
  OrderLineItemsStatusUpdatedPayload,
};