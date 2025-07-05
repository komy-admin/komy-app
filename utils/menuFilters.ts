import { Item } from '~/types/item.types';
import { MenuFilterState } from '~/components/filters/MenuFilters';

/**
 * Filtre une liste d'articles de menu selon les critères spécifiés
 */
export const filterMenuItems = (items: Item[], filters: MenuFilterState): Item[] => {
  return items.filter(item => {
    const matchesName = !filters.name || (item.name?.toLowerCase().includes(filters.name.toLowerCase()) ?? false);
    
    // Logique améliorée pour permettre min seul, max seul, ou les deux
    const matchesPrice = (filters.minPrice === null || item.price >= filters.minPrice) && 
                        (filters.maxPrice === null || item.price <= filters.maxPrice);
    
    return matchesName && matchesPrice;
  });
};

/**
 * Crée un état de filtres vide
 */
export const createEmptyMenuFilters = (): MenuFilterState => ({
  name: '',
  minPrice: null,
  maxPrice: null
});