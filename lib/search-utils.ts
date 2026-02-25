/**
 * Global Search Utility Functions
 * v0.24: Global Search Feature
 */

import { createClient } from '@/lib/supabase/client';

// Entity types supported by global search
export type EntityType = 'customer' | 'project' | 'pjo' | 'jo' | 'invoice' | 'vendor' | 'quotation';

// Search result interface matching database function return type
export interface SearchResult {
  entity_type: EntityType;
  entity_id: string;
  primary_text: string;
  secondary_text: string | null;
  url: string;
  relevance: number;
}

// Entity display labels
export const ENTITY_LABELS: Record<EntityType, string> = {
  customer: 'Customers',
  project: 'Projects',
  pjo: 'PJOs',
  jo: 'Job Orders',
  invoice: 'Invoices',
  vendor: 'Vendors',
  quotation: 'Quotations',
};

// Entity display order for grouping
export const ENTITY_ORDER: EntityType[] = [
  'customer',
  'project',
  'quotation',
  'pjo',
  'jo',
  'invoice',
  'vendor',
];

/**
 * Perform global search using Supabase RPC
 * @param query - Search query string
 * @param maxResults - Maximum number of results (default 20)
 * @returns Promise<SearchResult[]>
 */
export async function performSearch(
  query: string,
  maxResults: number = 20
): Promise<SearchResult[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase.rpc('global_search', {
    search_query: query,
    max_results: maxResults,
  });

  if (error) {
    throw error;
  }

  return (data || []) as SearchResult[];
}

/**
 * Group search results by entity type
 * @param results - Array of search results
 * @returns Record of entity type to results array
 */
export function groupResultsByEntityType(
  results: SearchResult[]
): Record<EntityType, SearchResult[]> {
  const grouped: Record<EntityType, SearchResult[]> = {
    customer: [],
    project: [],
    pjo: [],
    jo: [],
    invoice: [],
    vendor: [],
    quotation: [],
  };

  for (const result of results) {
    if (grouped[result.entity_type]) {
      grouped[result.entity_type].push(result);
    }
  }

  return grouped;
}

/**
 * Get ordered grouped results (only non-empty groups)
 * @param results - Array of search results
 * @returns Array of [entityType, results] tuples in display order
 */
export function getOrderedGroupedResults(
  results: SearchResult[]
): [EntityType, SearchResult[]][] {
  const grouped = groupResultsByEntityType(results);
  
  return ENTITY_ORDER
    .filter(type => grouped[type].length > 0)
    .map(type => [type, grouped[type]]);
}

/**
 * Sort results by relevance (descending) then by created_at (descending)
 * Note: This is primarily for client-side verification as the database already sorts
 * @param results - Array of search results
 * @returns Sorted array of search results
 */
export function sortResultsByRelevance(results: SearchResult[]): SearchResult[] {
  return [...results].sort((a, b) => {
    // Sort by relevance descending
    if (b.relevance !== a.relevance) {
      return b.relevance - a.relevance;
    }
    // If relevance is equal, maintain original order (already sorted by created_at from DB)
    return 0;
  });
}

/**
 * Calculate relevance score for a search result (client-side implementation)
 * Used for testing and verification
 * @param primaryText - Primary text to match against
 * @param secondaryText - Secondary text to match against
 * @param query - Search query
 * @returns Relevance score (1.0, 0.8, 0.5, or 0.3)
 */
export function calculateRelevance(
  primaryText: string,
  secondaryText: string | null,
  query: string
): number {
  const lowerQuery = query.toLowerCase();
  const lowerPrimary = primaryText.toLowerCase();
  const lowerSecondary = (secondaryText || '').toLowerCase();

  // Prefix match on primary text
  if (lowerPrimary.startsWith(lowerQuery)) {
    return 1.0;
  }
  
  // Contains match on primary text
  if (lowerPrimary.includes(lowerQuery)) {
    return 0.8;
  }
  
  // Contains match on secondary text
  if (lowerSecondary.includes(lowerQuery)) {
    return 0.5;
  }
  
  // Default (shouldn't happen if result was returned)
  return 0.3;
}

/**
 * Check if a query should trigger a search (minimum 2 characters)
 * @param query - Search query string
 * @returns boolean
 */
export function shouldSearch(query: string): boolean {
  return query.trim().length >= 2;
}
