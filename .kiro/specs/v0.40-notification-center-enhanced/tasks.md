# Implementation Plan: Enhanced Notification Center

## Overview

This implementation plan covers the enhanced notification center feature for Gama ERP. The plan builds upon existing notification infrastructure, adding real-time updates, grouping, filtering, archiving, and multi-channel delivery support. Implementation uses TypeScript with Next.js App Router, Supabase for database and real-time, and fast-check for property-based testing.

## Tasks

- [x] 1. Database schema updates and migrations
  - [x] 1.1 Apply migration to add new columns to notifications table
    - Add category, action_label, is_archived, archived_at, email_sent, email_sent_at, push_sent, push_sent_at columns
    - Create indexes for archived and category filtering
    - _Requirements: 1.1, 1.2_
  - [x] 1.2 Update existing notifications with default category values
    - Map existing notification types to categories
    - _Requirements: 1.4_

- [x] 2. Enhanced types and utility functions
  - [x] 2.1 Create notification center types
    - Define EnhancedNotification, NotificationGroup, NotificationCenterFilters, QuickAction interfaces
    - _Requirements: 1.1, 8.1_
  - [x] 2.2 Implement notification grouping utilities
    - groupNotificationsByReadStatus() for New/Earlier sections
    - groupNotificationsByDate() for Today/Yesterday/Earlier
    - _Requirements: 2.3, 3.2_
  - [x] 2.3 Write property tests for grouping utilities
    - **Property 3: Notification Grouping**
    - **Validates: Requirements 2.3, 3.2**
  - [x] 2.4 Implement notification filtering utilities
    - filterNotifications() for status, category, priority filters
    - searchNotifications() for title/message search
    - _Requirements: 4.4, 4.5_
  - [x] 2.5 Write property tests for filtering utilities
    - **Property 6: Filter Application**
    - **Property 7: Search Filtering**
    - **Validates: Requirements 4.4, 4.5**
  - [x] 2.6 Implement notification sorting utility
    - sortNotifications() with timestamp primary, priority secondary
    - _Requirements: 8.4_
  - [x] 2.7 Write property test for sorting utility
    - **Property 14: Priority-Aware Sorting**
    - **Validates: Requirements 8.4**

- [x] 3. Checkpoint - Ensure all utility tests pass
  - All 35 tests pass (15 property tests + 11 notification-utils + 9 notification-service)

- [x] 4. Server actions for notification center
  - [x] 4.1 Implement archive notification action
    - archiveNotification() sets is_archived=true, archived_at
    - _Requirements: 5.3_
  - [x] 4.2 Write property test for archive action
    - **Property 10: Archive State Update** (covered in property tests)
    - **Validates: Requirements 5.3**
  - [x] 4.3 Implement archive all notifications action
    - archiveAllNotifications() for bulk archive
    - _Requirements: 5.3_
  - [x] 4.4 Implement get notifications with filters action
    - getNotificationsWithFilters() with pagination support
    - _Requirements: 4.4, 4.5, 3.6_
  - [x] 4.5 Implement quick action execution
    - executeQuickAction() for approve/reject type actions
    - _Requirements: 5.5, 5.6_

- [x] 5. Enhanced notifications hook
  - [x] 5.1 Create useNotificationsEnhanced hook
    - Extend existing useNotifications with filtering, grouping, pagination
    - Add real-time subscription for new notifications
    - _Requirements: 6.1, 6.2, 6.3_
  - [x] 5.2 Add sound and desktop notification support
    - Play sound on new notification if enabled
    - Show desktop notification if enabled and permitted
    - _Requirements: 6.4, 6.5_
  - [x] 5.3 Integrate with user preferences
    - Check preferences before showing sound/desktop notifications
    - _Requirements: 7.1, 7.4, 7.5_
  - [x] 5.4 Write property test for preference enforcement
    - **Property 12: Preference Enforcement** (covered in property tests)
    - **Validates: Requirements 7.1, 7.2, 7.3**

- [x] 6. Checkpoint - Ensure hook and actions work correctly
  - All tests pass, TypeScript compiles without errors

- [x] 7. Enhanced notification bell component
  - [x] 7.1 Create NotificationBellEnhanced component
    - Display unread count badge (visible when count > 0)
    - _Requirements: 2.1_ (using existing NotificationBell)
  - [x] 7.2 Write property test for badge visibility
    - **Property 2: Badge Visibility Based on Count**
    - **Validates: Requirements 2.1**
  - [x] 7.3 Create enhanced notification dropdown
    - Group notifications into New/Earlier sections
    - Show icon, title, preview, timestamp for each
    - Include Mark all read button and View All link
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6_
  - [x] 7.4 Write property test for notification item rendering
    - **Property 4: Notification Item Rendering** (covered in property tests)
    - **Validates: Requirements 2.4, 3.3**

- [x] 8. Enhanced notification item component
  - [x] 8.1 Create NotificationItemEnhanced component
    - Blue dot indicator for unread notifications
    - Priority-based styling (colored border for high/urgent)
    - Action button when action_url present
    - Archive and Mark read buttons
    - _Requirements: 3.3, 3.4, 5.4, 8.2_
  - [x] 8.2 Write property tests for notification item
    - **Property 5: Unread Indicator Visibility**
    - **Property 11: Action Button Conditional Rendering**
    - **Property 13: Priority Visual Styling**
    - **Validates: Requirements 3.4, 5.4, 8.2**

- [x] 9. Notification center page
  - [x] 9.1 Create notification center page at /notifications
    - Header with title, Mark All Read, Settings, Archive All buttons
    - _Requirements: 3.1, 3.5_
  - [x] 9.2 Implement filter bar
    - Status dropdown (All, Unread)
    - Category dropdown
    - Priority dropdown
    - Search input
    - _Requirements: 4.1, 4.2, 4.3, 8.3_
  - [x] 9.3 Implement notification list with date grouping
    - Group by Today, Yesterday, Earlier
    - Show total count
    - Load More pagination
    - _Requirements: 3.2, 3.6, 3.7_
  - [x] 9.4 Implement empty state
    - Show friendly message when no notifications
    - _Requirements: 3.1_

- [x] 10. Mark as read functionality
  - [x] 10.1 Implement mark single notification as read
    - Update is_read=true, read_at timestamp
    - Optimistic update with rollback on error
    - _Requirements: 5.1_
  - [x] 10.2 Write property test for mark as read
    - **Property 8: Mark as Read State Update** (covered in property tests)
    - **Validates: Requirements 5.1**
  - [x] 10.3 Implement mark all as read
    - Bulk update all unread notifications
    - _Requirements: 5.2_
  - [x] 10.4 Write property test for mark all as read
    - **Property 9: Mark All as Read Bulk Update** (covered in property tests)
    - **Validates: Requirements 5.2**

- [x] 11. Real-time updates integration
  - [x] 11.1 Set up Supabase real-time subscription in hook
    - Subscribe to INSERT events on notifications table
    - Filter by user_id
    - _Requirements: 6.1_
  - [x] 11.2 Handle real-time notification arrival
    - Prepend to notification list
    - Increment unread count
    - Trigger sound/desktop notification based on preferences
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 2.7_

- [x] 12. Update existing notification service
  - [x] 12.1 Update createNotification to set category
    - Map notification type to category
    - _Requirements: 1.4_
  - [x] 12.2 Write property test for category lookup
    - **Property 1: Category Lookup from Type**
    - **Validates: Requirements 1.4**

- [x] 13. Final checkpoint - Full integration testing
  - All 35 tests pass
  - TypeScript compiles without errors
  - Real-time updates configured in hook
  - Filter combinations work via property tests

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation builds on existing notification infrastructure in `lib/notifications/` and `components/notifications/`
