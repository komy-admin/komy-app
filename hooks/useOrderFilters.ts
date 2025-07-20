import { useMemo, useState, useCallback, useEffect } from 'react';
import { Order } from '~/types/order.types';
import { OrderFilterState, createEmptyOrderFilters } from '~/components/filters/OrderFilters';
import { filterOrders } from '~/utils/orderFilters';
import { storageService } from '~/lib/storageService';

const FILTERS_STORAGE_KEY = '@service_filters';

/**
 * Fonction utilitaire pour nettoyer les filtres sauvegardés (appelée lors du logout)
 */
export const clearSavedFilters = async () => {
  try {
    await storageService.removeItem(FILTERS_STORAGE_KEY);
  } catch (error) {
    console.error('Erreur lors du nettoyage des filtres sauvegardés:', error);
  }
};

/**
 * Hook personnalisé pour gérer le filtrage et la recherche des commandes
 */
export const useOrderFilters = (orders: Order[]) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filters, setFilters] = useState<OrderFilterState>(createEmptyOrderFilters());
  const [isLoaded, setIsLoaded] = useState(false);

  // Charger les filtres depuis le stockage au montage
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const savedFilters = await storageService.getItem(FILTERS_STORAGE_KEY);
        if (savedFilters) {
          const parsedFilters = JSON.parse(savedFilters) as OrderFilterState;
          // Restaurer les filtres mais pas la recherche par table
          setFilters({
            ...parsedFilters,
            searchQuery: '' // Toujours vider la recherche au retour
          });
          setSearchQuery(''); // Input de recherche vide
        }
      } catch (error) {
        console.error('Erreur lors du chargement des filtres:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadFilters();
  }, []);

  // Sauvegarder les filtres dans le stockage de manière asynchrone (debounced)
  useEffect(() => {
    if (!isLoaded) return; // Ne pas sauvegarder avant le chargement initial

    const timeoutId = setTimeout(() => {
      storageService.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters)).catch(error => {
        console.error('Erreur lors de la sauvegarde des filtres:', error);
      });
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeoutId);
  }, [filters, isLoaded]);

  // Filtrage mémorisé pour les performances
  const filteredOrders = useMemo(() => {
    return filterOrders(orders, filters);
  }, [orders, filters]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    setFilters(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const handleFiltersChange = useCallback((newFilters: OrderFilterState) => {
    setFilters(newFilters);
    setSearchQuery(newFilters.searchQuery);
  }, []);

  const handleClearFilters = useCallback(() => {
    const emptyFilters = createEmptyOrderFilters();
    setSearchQuery('');
    setFilters(emptyFilters);
    
    // Supprimer les filtres sauvegardés de manière asynchrone
    storageService.removeItem(FILTERS_STORAGE_KEY).catch(error => {
      console.error('Erreur lors de la suppression des filtres sauvegardés:', error);
    });
  }, []);

  return {
    searchQuery,
    filters,
    filteredOrders,
    handleSearchChange,
    handleFiltersChange,
    handleClearFilters,
    isLoaded,
  };
};