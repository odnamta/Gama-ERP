/**
 * Changelog Types
 * Task 2.1: Create changelog types
 * Requirements: 1.1, 3.2
 */

/**
 * Valid changelog entry categories
 */
export type ChangelogCategory = 'feature' | 'improvement' | 'bugfix' | 'security';

/**
 * Changelog entry as stored in the database
 */
export interface ChangelogEntry {
  id: string;
  version: string | null;
  title: string;
  description: string | null;
  category: ChangelogCategory;
  is_major: boolean;
  published_at: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Input for creating or updating a changelog entry
 */
export interface ChangelogEntryInput {
  version?: string;
  title: string;
  description?: string;
  category: ChangelogCategory;
  is_major?: boolean;
  published_at?: string;
}

/**
 * Changelog entries grouped by month/year for display
 */
export interface GroupedChangelogEntries {
  monthYear: string; // e.g., "January 2026"
  entries: ChangelogEntry[];
}

/**
 * Valid category values for validation
 */
export const VALID_CATEGORIES: ChangelogCategory[] = ['feature', 'improvement', 'bugfix', 'security'];

/**
 * Check if a string is a valid changelog category
 */
export function isValidCategory(value: string): value is ChangelogCategory {
  return VALID_CATEGORIES.includes(value as ChangelogCategory);
}
