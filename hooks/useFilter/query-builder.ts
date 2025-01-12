import { QueryParams, FilterOperator } from '~/types/filter.types';

export class FilterQueryBuilder {
  static build(params: QueryParams): string {
    const searchParams = new URLSearchParams();

    // Gestion des filtres
    if (params.filters) {
      params.filters.forEach(filter => {
        this.appendFilter(searchParams, filter);
      });
    }

    // Pagination
    if (params.page) {
      searchParams.append('page', String(params.page));
    }
    if (params.limit) {
      searchParams.append('limit', String(params.limit));
    }

    return searchParams.toString();
  }

  private static appendFilter(searchParams: URLSearchParams, filter: {
    field: string;
    value: unknown;
    operator?: FilterOperator;
  }) {
    if (!filter.operator) {
      searchParams.append(filter.field, String(filter.value));
      return;
    }

    if (filter.operator === 'between' && Array.isArray(filter.value)) {
      searchParams.append(`${filter.field}[operator]`, filter.operator);
      searchParams.append(`${filter.field}[values]`, String(filter.value[0]));
      searchParams.append(`${filter.field}[values]`, String(filter.value[1]));
    } else if ((filter.operator === 'in' || filter.operator === 'not in') && Array.isArray(filter.value)) {
      searchParams.append(`${filter.field}[operator]`, filter.operator);
      filter.value.forEach(val => {
        searchParams.append(`${filter.field}[values]`, String(val));
      });
    } else {
      searchParams.append(`${filter.field}[operator]`, filter.operator);
      searchParams.append(`${filter.field}[value]`, String(filter.value));
    }
  }
}