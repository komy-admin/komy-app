import { BaseApiService } from '~/api/base.api';

export interface FilterValue {
  field: string;
  value: string | number | boolean | (string | number)[] | Date | [number, number];
  operator?: FilterOperator;
}

export interface FilterState<T> {
  data: PaginatedResponse<T>;
  loading: boolean;
  error: Error | null;
  queryParams: {
    page?: number;
    perPage?: number;
    filters: FilterValue[];
  };
}

export interface UseFilterProps<T> {
  service: BaseApiService<T>;
  config: FilterConfig<T>[];
  defaultParams?: Partial<QueryParams>;
}

export type FilterOperator = '>' | '>=' | '<' | '<=' | '=' | '!=' | 'like' | 'not like' | 'in' | 'not in' | 'between' | 'not between' | 'isNull' | 'isNotNull';

export type FilterType = 'text' | 'number' | 'date' | 'boolean' | 'select';

type NestedPaths<T> = T extends object ? {
  [K in keyof T]: K extends string
      ? T[K] extends object
          ? K | `${K}.${NestedPaths<T[K]>}`
          : K
      : never;
}[keyof T] : never;

export type FilterConfig<T> = {
  field: NestedPaths<T>;
  type: FilterType;
  label: string;
  operator?: FilterOperator;
  defaultValue?: string | number | boolean | (string | number)[] | Date | [number, number];
  options?: { label: string, value: string }[];
  show: boolean
}

export interface QueryParams {
  page?: number;
  perPage?: number;
  filters?: FilterValue[];
  // sort?: {
  //   field: string;
  //   direction: 'asc' | 'desc';
  // };
}

export interface PaginatedResponse<T> {
  data: T[],
  meta: {},
}