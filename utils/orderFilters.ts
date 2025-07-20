import { Order } from '~/types/order.types';
import { OrderFilterState } from '~/components/filters/OrderFilters';
import { getMostImportantStatus } from '~/lib/utils';
import { Status } from '~/types/status.enum';

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

  // Filtre par statuts sélectionnés (basé sur le status prioritaire des orderItems)
  if (filters.selectedStatuses.length > 0) {
    filteredOrders = filteredOrders.filter(order => {
      const orderItemStatuses = order.orderItems?.map(item => item.status) || [];
      const priorityStatus = getMostImportantStatus(orderItemStatuses);
      return priorityStatus ? filters.selectedStatuses.includes(priorityStatus) : false;
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