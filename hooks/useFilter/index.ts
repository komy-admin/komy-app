import { useState, useCallback, useEffect } from 'react';
import { FilterQueryBuilder } from './query-builder';
import type { UseFilterProps, FilterState, FilterOperator, FilterValue, QueryParams } from './types';
import { debounce } from 'lodash';

export function useFilter<T>({
  service,
  config,
  defaultParams = { page: 1, perPage: 10 }
}: UseFilterProps<T>) {
  const [state, setState] = useState<FilterState<T>>({
    data: { data: [], meta: {} },
    loading: false,
    error: null,
    queryParams: {
      ...defaultParams,
      filters: []
    }
  });

  useEffect(() => {
    loadData({
      ...defaultParams,
      filters: []
    });
  }, []);

  const loadData = useCallback(async (params: QueryParams) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const queryString = FilterQueryBuilder.build(params);
      const response = await service.getAll(queryString);
      setState(prev => ({
        ...prev,
        data: response,
        loading: false
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err : new Error('Une erreur est survenue'),
        loading: false
      }));
    }
  }, [service]);

  const debouncedLoadData = useCallback(
    debounce((params: QueryParams) => loadData(params), 300),
    [loadData]
  );

  const updateFilter = useCallback((field: string, value: unknown, operator?: FilterOperator) => {
    // Validation du filtre
    const filterConfig = config.find(c => c.field === field);
    if (!filterConfig) {
      console.warn(`Filter configuration not found for field: ${field}`);
      return;
    }
  
    setState(prev => {
      if (value === '' || value === null || value === undefined || 
          (Array.isArray(value) && value.length === 0)) {
        // Suppression du filtre
        const newParams = {
          ...prev.queryParams,
          page: 1,
          filters: prev.queryParams.filters.filter(f => f.field !== field)
        };
        debouncedLoadData(newParams);
        return { ...prev, queryParams: newParams };
      }
  
      // Création/mise à jour du filtre
      const newFilter: FilterValue = {
        field,
        value: value as FilterValue['value'],
        operator
      };
  
      const newParams = {
        ...prev.queryParams,
        page: 1,
        filters: [
          ...prev.queryParams.filters.filter(f => f.field !== field),
          newFilter
        ]
      };
      
      debouncedLoadData(newParams);
      return { ...prev, queryParams: newParams };
    });
  }, [config, debouncedLoadData]);

  const clearFilters = useCallback(() => {
    setState(prev => {
      const newParams = {
        ...prev.queryParams,
        page: 1,
        filters: []
      };
      loadData(newParams);
      return { ...prev, queryParams: newParams };
    });
  }, [loadData]);

  const changePage = useCallback((page: number) => {
    setState(prev => {
      const newParams = { ...prev.queryParams, page };
      loadData(newParams);
      return { ...prev, queryParams: newParams };
    });
  }, [loadData]);

  return {
    ...state,
    updateFilter,
    clearFilters,
    changePage
  };
}