'use client';

/**
 * Last Viewed Updater Component
 * Task 4.3: Create last viewed updater component
 * Requirements: 6.1, 6.3
 * 
 * Client component that updates localStorage with current timestamp on mount
 */

import { useEffect } from 'react';
import { CHANGELOG_LAST_VIEWED_KEY } from '@/lib/changelog-utils';

/**
 * Updates the user's last viewed timestamp when the changelog page is visited
 * - Requirement 6.1: Track each user's last changelog view timestamp in localStorage
 * - Requirement 6.3: Update the last viewed timestamp to current time when visiting /changelog
 */
export function LastViewedUpdater() {
  useEffect(() => {
    try {
      const now = new Date().toISOString();
      localStorage.setItem(CHANGELOG_LAST_VIEWED_KEY, now);
    } catch {
      // localStorage might not be available (SSR, private browsing, etc.)
      // Silently fail - notification dot feature will be disabled
    }
  }, []);

  // This component doesn't render anything
  return null;
}
