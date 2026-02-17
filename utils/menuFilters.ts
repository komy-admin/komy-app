import { Item } from '~/types/item.types';
import { Menu } from '~/types/menu.types';
import { MenuFilterState } from '~/components/filters/MenuFilters';
import { eurosToCents } from '~/lib/utils';

/**
 * Filtre par nom, prix (centimes) et statut — logique commune items & menus
 */
const matchesFilters = (
  name: string | undefined,
  priceCents: number,
  isActive: boolean,
  filters: MenuFilterState
): boolean => {
  const matchesName = !filters.name || (name?.toLowerCase().includes(filters.name.toLowerCase()) ?? false);

  const minPriceCents = filters.minPrice !== null ? eurosToCents(filters.minPrice) : null;
  const maxPriceCents = filters.maxPrice !== null ? eurosToCents(filters.maxPrice) : null;
  const matchesPrice = (minPriceCents === null || priceCents >= minPriceCents) &&
                      (maxPriceCents === null || priceCents <= maxPriceCents);

  const matchesStatus = filters.status === null ||
                       (filters.status === 'active' && isActive) ||
                       (filters.status === 'inactive' && !isActive);

  return matchesName && matchesPrice && matchesStatus;
};

/**
 * Filtre une liste d'articles selon les critères spécifiés
 */
export const filterMenuItems = (items: Item[], filters: MenuFilterState): Item[] => {
  return items.filter(item => matchesFilters(item.name, item.price, item.isActive, filters));
};

/**
 * Filtre une liste de menus selon les critères spécifiés
 */
export const filterMenus = (menus: Menu[], filters: MenuFilterState): Menu[] => {
  return menus.filter(menu => matchesFilters(menu.name, Number(menu.basePrice), menu.isActive, filters));
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