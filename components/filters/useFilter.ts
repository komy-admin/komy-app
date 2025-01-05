import { useState, useCallback } from 'react';
import { FilterConfig, QueryParams, PaginatedResponse, FilterOperator } from '~/types/filter.types';
import { axiosInstance } from '~/api/axios.config';

interface UseFilterProps<T> {
  model: string;
  config: FilterConfig<T>[];
  defaultParams?: Partial<QueryParams>;
}

export function useFilter<T>({
  config,
  model,
  defaultParams = { page: 1, limit: 10 }
}: UseFilterProps<T>) {

  const fetchData = async (queryString: string): Promise<PaginatedResponse<T>> => {
    const params = new URLSearchParams(queryString);
    const response = await getData(params, model);
    const { data, meta } = response;
    return { data: data as T[], meta };
  };

  const [data, setData] = useState<PaginatedResponse<T>>({
    data: [],
    meta: {},
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [queryParams, setQueryParams] = useState<QueryParams>({
    ...defaultParams,
    filters: []
  });

  const loadData = useCallback(async (params: QueryParams) => {
    setLoading(true);
    setError(null);
    try {
      const queryString = buildQueryString(params);
      const response = await fetchData(queryString);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Une erreur est survenue'));
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  const updateFilter = useCallback((field: string, value: string | number | boolean | Date) => {
    const filterConfig = config.find(c => c.field === field);
    if (!filterConfig) return;
    const operator: FilterOperator = filterConfig.operator as FilterOperator || 
      (filterConfig.type === 'text' ? 'like' : '=') as FilterOperator;
    setQueryParams(prev => {
      const newParams = {
        ...prev,
        page: 1,
        filters: [
          ...prev.filters?.filter(f => f.field !== field) || [],
          { field, value, operator }
        ]
      };
      loadData(newParams);
      return newParams;
    });
  }, [config, loadData]);

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
    data,
    loading,
    error,
    updateFilter,
    clearFilters,
    changePage,
    queryParams
  };
}

async function getData (params: any, model: string): Promise<{ data: any[], meta: {} }> {
  try {
    const response = await axiosInstance.get<{ data: any[], meta: {} }>(`/${model}?${params}`)
    const { data, meta } = response.data;
    return { data, meta };
  } catch (err) {
    console.error('Error in get Data:', err);
    return { data: [], meta: {} };
  }
};

function buildQueryString(params: QueryParams): string {
  const searchParams = new URLSearchParams();

  params.filters?.forEach(filter => {
    searchParams.append(`${filter.field}[operator]`, filter.operator);
    searchParams.append(`${filter.field}[value]`, String(filter.value));
  });

  if (params.page) {
    searchParams.append('page', String(params.page));
  }

  // if (params.sort) {
  //   searchParams.append('sort', params.sort.field);
  //   searchParams.append('direction', params.sort.direction);
  // }

  return `?${searchParams.toString()}`;
}

// function buildQueryString(params: QueryParams): string {
//   const searchParams = new URLSearchParams();

//   params.filters?.forEach(filter => {
//     searchParams.append(`${filter.field}_operator`, filter.operator);
//     if (Array.isArray(filter.value)) {
//       filter.value.forEach(val => {
//         searchParams.append(`${filter.field}_values`, String(val));
//       });
//     } else {
//       searchParams.append(`${filter.field}_value`, String(filter.value));
//     }
//   });

//   if (params.page) {
//     searchParams.append('page', String(params.page));
//   }

//   if (params.sort) {
//     searchParams.append('sort', params.sort.field);
//     searchParams.append('direction', params.sort.direction);
//   }

//   return `?${searchParams.toString()}`;
// }
