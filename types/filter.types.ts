export type FilterOperator = '>' | '>=' | '<' | '<=' | '=' | '!=' | 'like' | 'not like' | 'in' | 'not in' | 'between' | 'not between' | 'isNull' | 'isNotNull';

export type FilterType = 'text' | 'number' | 'date' | 'boolean' | 'select';

export type FilterConfig<T> = {
  field: keyof T;
  type: FilterType;
  label: string;
  operator?: FilterOperator;
}

export type FilterValue = {
  field: string;
  value: string | number | boolean | Date | (string | number)[] | [number, number];
  operator: FilterOperator;
}

export interface QueryParams {
  page?: number;
  limit?: number;
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