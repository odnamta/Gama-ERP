'use client';

/**
 * Changelog Notification Dot Component
 * Task 5.4: Update sidebar to show notification dot
 * Requirements: 6.2, 6.4
 * 
 * Displays a small colored indicator when there are new changelog entries
 */

import { useChangelogNotification } from '@/hooks/use-changelog-notification';

interface ChangelogNotificationDotProps {
  className?: string;
}

/**
 * Small notification dot that appears when there are unread changelog entries
 * - Requirement 6.2: Display notification dot when there are newer entries
 * - Requirement 6.4: Small colored indicator visible next to menu item text
 */
export function ChangelogNotificationDot({ className = '' }: ChangelogNotificationDotProps) {
  const { hasNewUpdates, isLoading } = useChangelogNotification();

  // Don't show anything while loading or if no new updates
  if (isLoading || !hasNewUpdates) {
    return null;
  }

  return (
    <span 
      className={`inline-block h-2 w-2 rounded-full bg-primary animate-pulse ${className}`}
      aria-label="New updates available"
    />
  );
}
