import { useState, useCallback, useEffect } from 'react';
import { FilterQueryBuilder } from './query-builder';
import type { UseFilterProps, FilterState, FilterOperator, FilterValue, QueryParams } from './types';
import { debounce } from 'lodash';

export function useFilter<T>({
  service,
  config,
  defaultParams = { page: 1, perPage: 10 },
  onDataChange
}: UseFilterProps<T>) {
  const [queryParams, setQueryParams] = useState<QueryParams>({
    ...defaultParams,
    filters: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadData({
      ...defaultParams,
      filters: []
    });
  }, []);

  const loadData = useCallback(async (params: QueryParams) => {
    setLoading(true);
    try {
      const queryString = FilterQueryBuilder.build(params);
      const response = await service.getAll(queryString);
      onDataChange(response);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Une erreur est survenue'));
      setLoading(false);
    }
  }, [service, onDataChange]);

  const debouncedLoadData = useCallback(
    debounce((params: QueryParams) => loadData(params), 300),
    [loadData]
  );

  const updateFilter = useCallback((field: string, value: unknown, operator?: FilterOperator) => {
    const filterConfig = config.find(c => c.field === field);
    if (!filterConfig) {
      console.warn(`Filter configuration not found for field: ${field}`);
      return;
    }
 
    if (value === '' || value === null || value === undefined || 
        (Array.isArray(value) && value.length === 0)) {
      const newParams = {
        ...queryParams,
        page: 1,
        filters: queryParams.filters.filter(f => f.field !== field)
      };
      setQueryParams(newParams);
      debouncedLoadData(newParams);
      return;
    }
 
    const newFilter: FilterValue = {
      field,
      value: value as FilterValue['value'],
      operator
    };
 
    const newParams = {
      ...queryParams,
      page: 1,
      filters: [
        ...queryParams.filters.filter(f => f.field !== field),
        newFilter
      ]
    };
    
    setQueryParams(newParams);
    debouncedLoadData(newParams);
  }, [config, queryParams, debouncedLoadData]);

  const clearFilters = useCallback(() => {
    const newParams = {
      ...queryParams,
      page: 1,
      filters: []
    };
    setQueryParams(newParams);
    loadData(newParams);
  }, [queryParams, loadData]);

  const changePage = useCallback((page: number) => {
    const newParams = { ...queryParams, page };
    setQueryParams(newParams);
    loadData(newParams);
  }, [queryParams, loadData]);

  return {
    loading,
    error,
    queryParams,
    updateFilter,
    clearFilters,
    changePage
  };
 
}