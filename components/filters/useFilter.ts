// import { useState, useCallback } from 'react';
// import { FilterConfig, QueryParams, PaginatedResponse, FilterOperator } from '~/types/filter.types';
// import { axiosInstance } from '~/api/axios.config';

// interface UseFilterProps<T> {
//   model: string;
//   config: FilterConfig<T>[];
//   defaultParams?: Partial<QueryParams>;
// }

// export function useFilter<T>({
//   config,
//   model,
//   defaultParams = { page: 1, limit: 10 }
// }: UseFilterProps<T>) {
//   const [data, setData] = useState<PaginatedResponse<T>>({
//     data: [],
//     meta: {},
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<Error | null>(null);
//   const [queryParams, setQueryParams] = useState<QueryParams>({
//     ...defaultParams,
//     filters: []
//   });

//   const fetchData = async (queryString: string): Promise<PaginatedResponse<T>> => {
//     const params = new URLSearchParams(queryString);
//     const response = await getData(params, model);
//     return response;
//   };

//   const loadData = useCallback(async (params: QueryParams) => {
//     setLoading(true);
//     setError(null);
//     try {
//       const queryString = buildQueryString(params);
//       const response = await fetchData(queryString);
//       setData(response);
//     } catch (err) {
//       setError(err instanceof Error ? err : new Error('Une erreur est survenue'));
//     } finally {
//       setLoading(false);
//     }
//   }, [model]);

//   const updateFilter = useCallback((field: string, value: any, operator?: string) => {
//     // const filterConfig = config.find(c => c.field === field);
//     // if (!filterConfig) return;

//     // Skip empty values
//     if (value === '' || value === null || value === undefined || 
//         (Array.isArray(value) && value.length === 0)) {
//       setQueryParams(prev => {
//         const newParams = {
//           ...prev,
//           page: 1,
//           filters: prev.filters?.filter(f => f.field !== field) || []
//         };
//         loadData(newParams);
//         return newParams;
//       });
//       return;
//     }
//     // const filterOperator: FilterOperator = operator as FilterOperator || filterConfig.operator || 
//     // (filterConfig.type === 'text' ? 'like' : '=');
//     const filterOperator: FilterOperator = operator as FilterOperator;
//     setQueryParams(prev => {
//       const newParams = {
//         ...prev,
//         page: 1,
//         filters: [
//           ...prev.filters?.filter(f => f.field !== field) || [],
//           { field, value, operator: filterOperator }
//         ]
//       };
//       loadData(newParams);
//       return newParams;
//     });
//   }, [config, loadData]);

//   const clearFilters = useCallback(() => {
//     const newParams = {
//       ...queryParams,
//       page: 1,
//       filters: []
//     };
//     setQueryParams(newParams);
//     loadData(newParams);
//   }, [queryParams, loadData]);

//   const changePage = useCallback((page: number) => {
//     const newParams = { ...queryParams, page };
//     setQueryParams(newParams);
//     loadData(newParams);
//   }, [queryParams, loadData]);

//   return {
//     data,
//     loading,
//     error,
//     updateFilter,
//     clearFilters,
//     changePage,
//     queryParams
//   };
// }

// async function getData(params: URLSearchParams, model: string): Promise<PaginatedResponse<any>> {
//   try {
//     const response = await axiosInstance.get(`/${model}?${params}`);
//     return response.data;
//   } catch (err) {
//     console.error('Error in getData:', err);
//     return { data: [], meta: {} };
//   }
// }

// function buildQueryString(params: QueryParams): string {
//   const searchParams = new URLSearchParams();

//   params.filters?.forEach(filter => {
//     if (filter.operator) {
//       if (filter.operator === 'between') {
//         if (Array.isArray(filter.value)) {
//           searchParams.append(`${filter.field}[operator]`, filter.operator);
//           searchParams.append(`${filter.field}[values]`, String(filter.value[0]));
//           searchParams.append(`${filter.field}[values]`, String(filter.value[1]));
//         }
//       } else if (filter.operator === 'in' || filter.operator === 'not in') {
//         if (Array.isArray(filter.value)) {
//           searchParams.append(`${filter.field}[operator]`, filter.operator);
//           filter.value.forEach((val, index) => {
//             searchParams.append(`${filter.field}[values]`, String(val));
//           });
//         }
//         else {
//           const objectFilter = filter.operator === 'in' ? '=' : '!=';
//           searchParams.append(`${filter.field}[operator]`, objectFilter);
//           const filterValue = typeof filter.value === 'object' && 'value' in filter.value ? filter.value.value : filter.value;
//           searchParams.append(`${filter.field}[value]`, String(filterValue)); 
//         }
//       } else {
//         searchParams.append(`${filter.field}[operator]`, filter.operator);
//         searchParams.append(`${filter.field}[value]`, String(filter.value));
//       }
//     }
//     else searchParams.append(`${filter.field}`, String(filter.value));
//   });

//   if (params.page) {
//     searchParams.append('page', String(params.page));
//   }

//   if (params.limit) {
//     searchParams.append('limit', String(params.limit));
//   }

//   return searchParams.toString();
// }

// // function buildQueryString(params: QueryParams): string {
// //   const searchParams = new URLSearchParams();

// //   params.filters?.forEach(filter => {
// //     searchParams.append(`${filter.field}_operator`, filter.operator);
// //     if (Array.isArray(filter.value)) {
// //       filter.value.forEach(val => {
// //         searchParams.append(`${filter.field}_values`, String(val));
// //       });
// //     } else {
// //       searchParams.append(`${filter.field}_value`, String(filter.value));
// //     }
// //   });

// //   if (params.page) {
// //     searchParams.append('page', String(params.page));
// //   }

// //   if (params.sort) {
// //     searchParams.append('sort', params.sort.field);
// //     searchParams.append('direction', params.sort.direction);
// //   }

// //   return `?${searchParams.toString()}`;
// // }
