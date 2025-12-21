# Requirements Document

## Introduction

This document defines the requirements for an enhanced Notification Center feature in Gama ERP. The system will provide real-time notifications with grouping, filtering, actions, and multi-channel delivery (in-app, email, desktop). It builds upon the existing notification infrastructure to create a comprehensive notification management experience.

## Glossary

- **Notification_Center**: The full-page view at `/notifications` where users can manage all their notifications
- **Notification_Bell**: The header component showing unread count and recent notifications dropdown
- **Notification**: A single notification record containing type, category, title, message, and metadata
- **Real_Time_Subscription**: Supabase channel subscription for instant notification delivery
- **Notification_Category**: Grouping classification for notifications (e.g., finance, operations, hr, system)
- **Notification_Priority**: Urgency level of a notification (low, normal, high, urgent)
- **Desktop_Notification**: Browser-based push notification shown outside the application
- **Notification_Preferences**: User-specific settings controlling notification delivery channels

## Requirements

### Requirement 1: Database Schema for Enhanced Notifications

**User Story:** As a system administrator, I want a robust notification storage schema, so that notifications can be efficiently stored, queried, and managed.

#### Acceptance Criteria

1. THE Database SHALL store notifications with fields: id, user_id, notification_type, category, title, message, action_url, action_label, entity_type, entity_id, priority, is_read, read_at, is_archived, archived_at, email_sent, email_sent_at, push_sent, push_sent_at, expires_at, created_at
2. THE Database SHALL have indexes on user_id, unread notifications, and created_at for query performance
3. THE Database SHALL provide a create_notification function that inserts notifications and triggers real-time events via pg_notify
4. WHEN a notification is created, THE create_notification function SHALL automatically determine the category from notification_types table
5. THE Database SHALL enforce referential integrity with user_profiles table via foreign key constraint

### Requirement 2: Notification Bell Component

**User Story:** As a user, I want to see a notification bell in the header with unread count, so that I can quickly know when I have new notifications.

#### Acceptance Criteria

1. THE Notification_Bell SHALL display an unread notification count badge when count is greater than zero
2. WHEN the user clicks the Notification_Bell, THE System SHALL display a dropdown with recent notifications
3. THE Notification_Bell dropdown SHALL group notifications into "New" and "Earlier" sections
4. THE Notification_Bell dropdown SHALL display notification icon, title, preview message, and relative timestamp for each notification
5. THE Notification_Bell dropdown SHALL provide a "Mark all read" action button
6. THE Notification_Bell dropdown SHALL provide a "View All Notifications" link to the full Notification_Center
7. WHEN a new notification arrives, THE Notification_Bell SHALL update the unread count in real-time without page refresh

### Requirement 3: Full Notification Center Page

**User Story:** As a user, I want a dedicated page to view and manage all my notifications, so that I can efficiently handle my notification history.

#### Acceptance Criteria

1. THE Notification_Center SHALL be accessible at route `/notifications`
2. THE Notification_Center SHALL display notifications grouped by date (Today, Yesterday, Earlier)
3. THE Notification_Center SHALL show notification icon, title, full message, timestamp, and available actions for each notification
4. THE Notification_Center SHALL visually distinguish unread notifications with a blue indicator dot
5. THE Notification_Center SHALL provide "Mark All Read", "Settings", and "Archive All" action buttons in the header
6. THE Notification_Center SHALL support pagination with "Load More" functionality
7. THE Notification_Center SHALL display the total count of notifications

### Requirement 4: Notification Filtering and Search

**User Story:** As a user, I want to filter and search my notifications, so that I can quickly find specific notifications.

#### Acceptance Criteria

1. THE Notification_Center SHALL provide a filter dropdown for notification status (All, Unread only)
2. THE Notification_Center SHALL provide a filter dropdown for notification category
3. THE Notification_Center SHALL provide a search input to search notification titles and messages
4. WHEN filters are applied, THE Notification_Center SHALL update the displayed notifications immediately
5. WHEN search text is entered, THE Notification_Center SHALL filter notifications containing the search term in title or message

### Requirement 5: Notification Actions

**User Story:** As a user, I want to perform actions on notifications, so that I can manage my notification state and respond to actionable items.

#### Acceptance Criteria

1. WHEN a user clicks "Mark Read" on a notification, THE System SHALL mark that notification as read and update read_at timestamp
2. WHEN a user clicks "Mark all read", THE System SHALL mark all unread notifications for that user as read
3. WHEN a user clicks "Archive" on a notification, THE System SHALL archive that notification and update archived_at timestamp
4. WHEN a notification has an action_url, THE Notification SHALL display an action button that navigates to that URL
5. WHEN a notification has quick actions (e.g., Approve/Reject for leave requests), THE Notification SHALL display those action buttons
6. WHEN a quick action is performed, THE System SHALL execute the action and update the notification state

### Requirement 6: Real-Time Notification Updates

**User Story:** As a user, I want to receive notifications in real-time, so that I am immediately aware of important events.

#### Acceptance Criteria

1. WHEN a new notification is created for a user, THE System SHALL deliver it to the user's browser via Supabase real-time subscription
2. WHEN a new notification arrives, THE Notification_Bell SHALL increment the unread count immediately
3. WHEN a new notification arrives, THE Notification_Center (if open) SHALL prepend the new notification to the list
4. IF the user has sound notifications enabled, THEN THE System SHALL play a notification sound when a new notification arrives
5. IF the user has desktop notifications enabled AND browser permission is granted, THEN THE System SHALL show a desktop notification

### Requirement 7: Notification Preferences Integration

**User Story:** As a user, I want my notification preferences to be respected, so that I only receive notifications through my preferred channels.

#### Acceptance Criteria

1. WHEN creating a notification, THE System SHALL check the user's notification preferences for that notification type
2. IF in-app notifications are disabled for a type, THEN THE System SHALL NOT create an in-app notification
3. IF email notifications are enabled for a type, THEN THE System SHALL queue an email notification
4. THE System SHALL respect per-notification-type channel preferences (in-app, email, desktop)
5. WHEN user preferences are updated, THE System SHALL apply them to all future notifications immediately

### Requirement 8: Notification Priority Handling

**User Story:** As a user, I want high-priority notifications to be visually distinct, so that I can identify urgent items quickly.

#### Acceptance Criteria

1. THE System SHALL support four priority levels: low, normal, high, urgent
2. WHEN displaying a high or urgent priority notification, THE System SHALL apply distinct visual styling (e.g., colored border, icon)
3. THE Notification_Center SHALL allow filtering by priority level
4. WHEN sorting notifications, THE System SHALL consider priority as a secondary sort factor after timestamp
