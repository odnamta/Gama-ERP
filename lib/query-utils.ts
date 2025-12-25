/**
 * Query Optimization Utilities
 * Standardized query builder for consistent, optimized database queries
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */

import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Filter operator types
 */
export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'is';

/**
 * Single filter definition
 */
export interface QueryFilter {
  field: string;
  operator: FilterOperator;
  value: unknown;
}

/**
 * Sort direction
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Sort definition
 */
export interface QuerySort {
  field: string;
  order: SortOrder;
}

/**
 * Query options interface
 * Requirement 7.1-7.6: Support filtering, search, pagination, sorting
 */
export interface QueryOptions {
  /** Filters for exact match, array inclusion, null checks (Requirement 7.1) */
  filters?: QueryFilter[];
  /** Text search across specified fields using ilike (Requirement 7.2) */
  search?: {
    term: string;
    fields: string[];
  };
  /** Pagination with page number and limit (Requirement 7.3, 7.5) */
  pagination?: {
    page: number;
    limit: number;
  };
  /** Sorting by field in ascending or descending order (Requirement 7.4) */
  sort?: QuerySort;
  /** Fields to select (defaults to '*') */
  select?: string;
}

/**
 * Query result with data and pagination info
 */
export interface QueryResult<T> {
  data: T[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Check if a filter value is empty or null
 * Requirement 7.6: Skip filters with empty or null values
 */
export function isEmptyFilterValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

/**
 * Filter out empty filters from the list
 * Requirement 7.6: Skip filters with empty or null values
 */
export function filterEmptyFilters(filters: QueryFilter[]): QueryFilter[] {
  return filters.filter(f => !isEmptyFilterValue(f.value));
}

/**
 * Build an optimized query with filters, search, pagination, and sorting
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 * 
 * @param supabase - Supabase client instance
 * @param table - Table name to query
 * @param options - Query options
 * @returns Query result with data and pagination info
 */
export async function buildOptimizedQuery<T>(
  supabase: SupabaseClient,
  table: string,
  options: QueryOptions = {}
): Promise<QueryResult<T>> {
  const {
    filters = [],
    search,
    pagination = { page: 1, limit: 20 },
    sort,
    select = '*',
  } = options;

  // Start building the query
  let query = supabase.from(table).select(select, { count: 'exact' });

  // Apply filters (Requirement 7.1)
  // Skip empty/null filters (Requirement 7.6)
  const validFilters = filterEmptyFilters(filters);
  
  for (const filter of validFilters) {
    switch (filter.operator) {
      case 'eq':
        query = query.eq(filter.field, filter.value);
        break;
      case 'neq':
        query = query.neq(filter.field, filter.value);
        break;
      case 'gt':
        query = query.gt(filter.field, filter.value);
        break;
      case 'gte':
        query = query.gte(filter.field, filter.value);
        break;
      case 'lt':
        query = query.lt(filter.field, filter.value);
        break;
      case 'lte':
        query = query.lte(filter.field, filter.value);
        break;
      case 'in':
        if (Array.isArray(filter.value)) {
          query = query.in(filter.field, filter.value);
        }
        break;
      case 'is':
        query = query.is(filter.field, filter.value as null);
        break;
    }
  }

  // Apply search (Requirement 7.2)
  if (search && search.term && search.term.trim() !== '' && search.fields.length > 0) {
    const searchTerm = `%${search.term.trim()}%`;
    const orConditions = search.fields
      .map(field => `${field}.ilike.${searchTerm}`)
      .join(',');
    query = query.or(orConditions);
  }

  // Apply sorting (Requirement 7.4)
  if (sort && sort.field) {
    query = query.order(sort.field, { ascending: sort.order === 'asc' });
  }

  // Apply pagination (Requirement 7.3)
  const page = Math.max(1, pagination.page);
  const limit = Math.max(1, Math.min(100, pagination.limit)); // Cap at 100
  const offset = (page - 1) * limit;
  
  query = query.range(offset, offset + limit - 1);

  // Execute query
  const { data, error, count } = await query;

  if (error) {
    console.error('Query error:', error);
    throw error;
  }

  // Calculate total pages (Requirement 7.5)
  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  return {
    data: (data || []) as T[],
    totalCount,
    page,
    limit,
    totalPages,
  };
}

/**
 * Create a filter for exact match
 */
export function eq(field: string, value: unknown): QueryFilter {
  return { field, operator: 'eq', value };
}

/**
 * Create a filter for not equal
 */
export function neq(field: string, value: unknown): QueryFilter {
  return { field, operator: 'neq', value };
}

/**
 * Create a filter for greater than
 */
export function gt(field: string, value: unknown): QueryFilter {
  return { field, operator: 'gt', value };
}

/**
 * Create a filter for greater than or equal
 */
export function gte(field: string, value: unknown): QueryFilter {
  return { field, operator: 'gte', value };
}

/**
 * Create a filter for less than
 */
export function lt(field: string, value: unknown): QueryFilter {
  return { field, operator: 'lt', value };
}

/**
 * Create a filter for less than or equal
 */
export function lte(field: string, value: unknown): QueryFilter {
  return { field, operator: 'lte', value };
}

/**
 * Create a filter for array inclusion
 */
export function inArray(field: string, values: unknown[]): QueryFilter {
  return { field, operator: 'in', value: values };
}

/**
 * Create a filter for null check
 */
export function isNull(field: string): QueryFilter {
  return { field, operator: 'is', value: null };
}

/**
 * Helper to create pagination options
 */
export function paginate(page: number, limit: number = 20): { page: number; limit: number } {
  return { page: Math.max(1, page), limit: Math.max(1, Math.min(100, limit)) };
}

/**
 * Helper to create sort options
 */
export function sortBy(field: string, order: SortOrder = 'asc'): QuerySort {
  return { field, order };
}

/**
 * Helper to create search options
 */
export function searchIn(term: string, fields: string[]): { term: string; fields: string[] } {
  return { term, fields };
}
