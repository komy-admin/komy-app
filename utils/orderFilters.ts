import { Order } from '~/types/order.types';
import { OrderFilterState } from '~/components/filters/OrderFilters';
import { getOrderLinesGlobalStatus } from '~/lib/utils';

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

      const priorityStatus = getOrderLinesGlobalStatus(order.lines);
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
