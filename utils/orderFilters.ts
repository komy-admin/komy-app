import { Order } from '~/types/order.types';
import { OrderFilterState } from '~/components/filters/OrderFilters';
import { calculateOrderStatusFromLines } from '~/lib/utils';
import { Status } from '~/types/status.enum';
import { OrderLineType } from '~/types/order-line.types';

/**
 * Filtre les commandes selon les critères définis
 */
export function filterOrders(orders: Order[], filters: OrderFilterState): Order[] {
  if (!orders.length) return orders;
  
  let filteredOrders = orders;

  // Filtre par recherche de nom de table
  if (filters.searchQuery.trim()) {
    const query = filters.searchQuery.toLowerCase().trim();
    filteredOrders = filteredOrders.filter(order => 
      order.table?.name?.toLowerCase().includes(query)
    );
  }

  // Filtre par statuts sélectionnés (basé sur OrderLines uniquement)
  if (filters.selectedStatuses.length > 0) {
    filteredOrders = filteredOrders.filter(order => {
      if (!order.lines) return false;
      
      const priorityStatus = calculateOrderStatusFromLines(order.lines);
      return filters.selectedStatuses.includes(priorityStatus);
    });
  }

  // Tri par date de création
  filteredOrders = [...filteredOrders].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    
    return filters.sortBy === 'created_asc' ? dateA - dateB : dateB - dateA;
  });

  return filteredOrders;
}

/**
 * Compte le nombre de filtres actifs
 */
export function getActiveFiltersCount(filters: OrderFilterState): number {
  let count = 0;
  
  if (filters.searchQuery.trim()) count++;
  if (filters.selectedStatuses.length > 0) count++;
  if (filters.sortBy !== 'created_desc') count++;
  
  return count;
}

// 🆕 Fonctions de filtrage spécifiques aux OrderLines

/**
 * Obtenir le statut d'une commande (basé sur OrderLines uniquement)
 */
export function getOrderStatus(order: Order): Status {
  if (!order.lines) return Status.DRAFT;
  return calculateOrderStatusFromLines(order.lines);
}

/**
 * Filtre les commandes ayant des OrderLines de type spécifique
 */
export function filterOrdersByLineType(orders: Order[], lineType: OrderLineType): Order[] {
  return orders.filter(order => {
    if (!order.lines) return false;
    return order.lines.some(line => line.type === lineType);
  });
}

/**
 * Filtre les commandes ayant des menus
 */
export function filterOrdersWithMenus(orders: Order[]): Order[] {
  return orders.filter(order => {
    if (!order.lines) return false;
    return order.lines.some(line => line.type === OrderLineType.MENU);
  });
}

/**
 * Filtre les commandes ayant des items individuels
 */
export function filterOrdersWithIndividualItems(orders: Order[]): Order[] {
  return orders.filter(order => {
    if (!order.lines) return false;
    return order.lines.some(line => line.type === OrderLineType.ITEM);
  });
}

/**
 * Compter le nombre total d'items dans une commande
 */
export function getOrderItemsCount(order: Order): number {
  if (!order.lines) return 0;
  
  return order.lines.reduce((count, line) => {
    if (line.type === OrderLineType.ITEM) {
      return count + line.quantity;
    } else if (line.type === OrderLineType.MENU) {
      return count + line.quantity; // Un menu = une unité
    }
    return count;
  }, 0);
}

/**
 * Obtenir le prix total d'une commande
 */
export function getOrderTotalPrice(order: Order): number {
  if (!order.lines) return 0;
  return order.lines.reduce((total, line) => total + line.totalPrice, 0);
}

/**
 * Filtrer les commandes par gamme de prix
 */
export function filterOrdersByPriceRange(orders: Order[], minPrice: number, maxPrice: number): Order[] {
  return orders.filter(order => {
    const totalPrice = getOrderTotalPrice(order);
    return totalPrice >= minPrice && totalPrice <= maxPrice;
  });
}

/**
 * Grouper les commandes par type de contenu (menus vs items individuels)
 */
export function groupOrdersByContentType(orders: Order[]): {
  menusOnly: Order[];
  itemsOnly: Order[];
  mixed: Order[];
} {
  const result = {
    menusOnly: [] as Order[],
    itemsOnly: [] as Order[],
    mixed: [] as Order[]
  };
  
  orders.forEach(order => {
    if (!order.lines) return;
    
    const hasMenus = order.lines.some(line => line.type === OrderLineType.MENU);
    const hasItems = order.lines.some(line => line.type === OrderLineType.ITEM);
    
    if (hasMenus && hasItems) {
      result.mixed.push(order);
    } else if (hasMenus) {
      result.menusOnly.push(order);
    } else if (hasItems) {
      result.itemsOnly.push(order);
    }
  });
  
  return result;
}