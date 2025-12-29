import { Item } from '~/types/item.types';
import { MenuFilterState } from '~/components/filters/MenuFilters';
import { eurosToCents } from '~/lib/utils';

/**
 * Filtre une liste d'articles de menu selon les critères spécifiés
 */
export const filterMenuItems = (items: Item[], filters: MenuFilterState): Item[] => {
  return items.filter(item => {
    const matchesName = !filters.name || (item.name?.toLowerCase().includes(filters.name.toLowerCase()) ?? false);

    // Convertir les prix du filtre (en euros) en centimes pour comparaison avec item.price (en centimes)
    const minPriceCents = filters.minPrice !== null ? eurosToCents(filters.minPrice) : null;
    const maxPriceCents = filters.maxPrice !== null ? eurosToCents(filters.maxPrice) : null;

    const matchesPrice = (minPriceCents === null || item.price >= minPriceCents) &&
                        (maxPriceCents === null || item.price <= maxPriceCents);
    
    // Filtrage par statut
    const matchesStatus = filters.status === null ||
                         (filters.status === 'active' && item.isActive) ||
                         (filters.status === 'inactive' && !item.isActive);
    
    return matchesName && matchesPrice && matchesStatus;
  });
};

/**
 * Crée un état de filtres vide
 */
export const createEmptyMenuFilters = (): MenuFilterState => ({
  name: '',
  minPrice: null,
  maxPrice: null,
  status: null
});