'use client';

/**
 * Changelog Notification Hook
 * Task 5.2: Create changelog notification hook
 * Requirements: 6.1, 6.2
 * 
 * Client-side hook that:
 * 1. Reads last viewed timestamp from localStorage
 * 2. Fetches latest entry's published_at from API
 * 3. Compares to determine if notification dot should show
 */

import { useState, useEffect, useCallback } from 'react';
import { CHANGELOG_LAST_VIEWED_KEY } from '@/lib/changelog-utils';

interface UseChangelogNotificationResult {
  hasNewUpdates: boolean;
  isLoading: boolean;
  markAsViewed: () => void;
}

/**
 * Hook to check if there are new changelog entries since user's last visit
 * - Requirement 6.1: Track each user's last changelog view timestamp in localStorage
 * - Requirement 6.2: Show notification dot when there are newer entries
 */
export function useChangelogNotification(): UseChangelogNotificationResult {
  const [hasNewUpdates, setHasNewUpdates] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkForUpdates = useCallback(async () => {
    try {
      // Get last viewed timestamp from localStorage
      const lastViewed = localStorage.getItem(CHANGELOG_LAST_VIEWED_KEY);
      
      // Fetch latest entry timestamp from API
      const response = await fetch('/api/changelog/latest');
      if (!response.ok) {
        setHasNewUpdates(false);
        return;
      }
      
      const data = await response.json();
      const latestPublishedAt = data.published_at;
      
      if (!latestPublishedAt) {
        setHasNewUpdates(false);
        return;
      }
      
      // If user has never viewed, show notification
      if (!lastViewed) {
        setHasNewUpdates(true);
        return;
      }
      
      // Compare timestamps
      const lastViewedDate = new Date(lastViewed);
      const latestDate = new Date(latestPublishedAt);
      
      setHasNewUpdates(latestDate > lastViewedDate);
    } catch {
      // On error, don't show notification dot
      setHasNewUpdates(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkForUpdates();
  }, [checkForUpdates]);

  const markAsViewed = useCallback(() => {
    try {
      const now = new Date().toISOString();
      localStorage.setItem(CHANGELOG_LAST_VIEWED_KEY, now);
      setHasNewUpdates(false);
    } catch {
      // localStorage might not be available
    }
  }, []);

  return {
    hasNewUpdates,
    isLoading,
    markAsViewed,
  };
}
