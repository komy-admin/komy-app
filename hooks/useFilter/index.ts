import { useState, useCallback, useEffect, useRef } from 'react';
import { FilterQueryBuilder } from './query-builder';
import type { UseFilterProps, FilterOperator, FilterValue, QueryParams } from './types';
import { debounce } from 'lodash';

export function useFilter<T>({
  service,
  config,
  defaultParams = { page: 1, perPage: 100 },
  onDataChange,
  onError,
  loadOnMount = true
}: UseFilterProps<T>) {
  const [queryParams, setQueryParams] = useState<QueryParams>({
    ...defaultParams,
    filters: defaultParams.filters || []
  });
  const [loading, setLoading] = useState(loadOnMount);
  const [error, setError] = useState<Error | null>(null);
  
  // Utiliser useRef pour éviter les dépendances circulaires
  const onDataChangeRef = useRef(onDataChange);
  const onErrorRef = useRef(onError);
  
  // Mettre à jour les refs quand les callbacks changent
  useEffect(() => {
    onDataChangeRef.current = onDataChange;
  }, [onDataChange]);
  
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const loadData = useCallback(async (params: QueryParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const queryString = FilterQueryBuilder.build(params);
      const response = await service.getAll(queryString);
      
      if (response && typeof response === 'object') {
        onDataChangeRef.current(response);
      }
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Une erreur est survenue');
      setError(error);
      
      if (onErrorRef.current) {
        onErrorRef.current(error);
      }
    } finally {
      setLoading(false);
    }
  }, [service]);

  // Debounce avec une référence stable
  const debouncedLoadDataRef = useRef(
    debounce((params: QueryParams) => {
      loadData(params);
    }, 300)
  );

  // Mettre à jour la fonction debounced quand loadData change
  useEffect(() => {
    debouncedLoadDataRef.current = debounce((params: QueryParams) => {
      loadData(params);
    }, 300);
  }, [loadData]);

  // Chargement initial
  useEffect(() => {
    if (loadOnMount) {
      const initialParams = {
        ...defaultParams,
        filters: defaultParams.filters || []
      };
      loadData(initialParams);
    }
  }, []);

  const updateFilter = useCallback((field: string, value: unknown, operator?: FilterOperator) => {
    const filterConfig = config.find(c => c.field === field);
    if (!filterConfig) {
      console.warn(`Filter configuration not found for field: ${field}`);
      return;
    }
 
    setQueryParams(currentParams => {
      if (value === '' || value === null || value === undefined || 
          (Array.isArray(value) && value.length === 0)) {
        const newParams = {
          ...currentParams,
          page: 1,
          filters: currentParams.filters.filter(f => f.field !== field)
        };
        debouncedLoadDataRef.current(newParams);
        return newParams;
      }
 
      const newFilter: FilterValue = {
        field,
        value: value as FilterValue['value'],
        operator
      };
 
      const newParams = {
        ...currentParams,
        page: 1,
        filters: [
          ...currentParams.filters.filter(f => f.field !== field),
          newFilter
        ]
      };
      
      debouncedLoadDataRef.current(newParams);
      return newParams;
    });
  }, [config]);

  const clearFilters = useCallback(() => {
    setQueryParams(currentParams => {
      const newParams = {
        ...currentParams,
        page: 1,
        filters: []
      };
      loadData(newParams);
      return newParams;
    });
  }, [loadData]);

  const changePage = useCallback((page: number) => {
    setQueryParams(currentParams => {
      const newParams = { ...currentParams, page };
      loadData(newParams);
      return newParams;
    });
  }, [loadData]);

  return {
    loading,
    error,
    queryParams,
    updateFilter,
    clearFilters,
    changePage
  };
}