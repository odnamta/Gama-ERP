/**
 * Changelog Utilities
 * Task 2.2: Create changelog utilities
 * Requirements: 3.2, 4.1, 4.2, 4.3, 4.4, 6.2
 */

import type { ChangelogEntry, ChangelogCategory, GroupedChangelogEntries } from '@/types/changelog';

/**
 * localStorage key for tracking user's last changelog view
 */
export const CHANGELOG_LAST_VIEWED_KEY = 'gama_changelog_last_viewed';

/**
 * Group changelog entries by month and year
 * Requirement 3.2: Group entries by month and year with clear section headers
 */
export function groupEntriesByMonth(entries: ChangelogEntry[]): GroupedChangelogEntries[] {
  if (!entries || entries.length === 0) {
    return [];
  }

  const groups: Map<string, ChangelogEntry[]> = new Map();

  for (const entry of entries) {
    const date = new Date(entry.published_at);
    const monthYear = date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    const existing = groups.get(monthYear) || [];
    existing.push(entry);
    groups.set(monthYear, existing);
  }

  // Convert to array and maintain order (entries should already be sorted by published_at DESC)
  const result: GroupedChangelogEntries[] = [];
  for (const [monthYear, groupEntries] of groups) {
    result.push({ monthYear, entries: groupEntries });
  }

  return result;
}

/**
 * Get the Tailwind CSS classes for a category badge
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */
export function getCategoryBadgeColor(category: ChangelogCategory): string {
  switch (category) {
    case 'feature':
      // Requirement 4.1: feature = blue
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'bugfix':
      // Requirement 4.2: bugfix = red
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'improvement':
      // Requirement 4.3: improvement = green
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'security':
      // Requirement 4.4: security = yellow
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
}

/**
 * Format a published date for display
 */
export function formatPublishedDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Check if there are new entries since the user's last view
 * Requirement 6.2: Notification dot logic
 */
export function hasNewEntries(entries: ChangelogEntry[], lastViewed: string | null): boolean {
  if (!entries || entries.length === 0) {
    return false;
  }

  if (!lastViewed) {
    // User has never viewed changelog, show notification
    return true;
  }

  const lastViewedDate = new Date(lastViewed);
  
  // Check if any entry has published_at greater than lastViewed
  return entries.some(entry => {
    const entryDate = new Date(entry.published_at);
    return entryDate > lastViewedDate;
  });
}

/**
 * Get the latest entry's published_at timestamp
 */
export function getLatestEntryTimestamp(entries: ChangelogEntry[]): string | null {
  if (!entries || entries.length === 0) {
    return null;
  }
  
  // Entries should be sorted by published_at DESC, so first entry is latest
  return entries[0].published_at;
}

/**
 * Capitalize the first letter of a category for display
 */
export function formatCategoryLabel(category: ChangelogCategory): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}
