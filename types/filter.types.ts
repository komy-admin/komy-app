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
  options?: { label: string, value: string }[];
}

export type FilterValue = {
  field: string;
  value: string | number | boolean | Date | (string | number)[] | [number, number];
  operator?: FilterOperator;
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