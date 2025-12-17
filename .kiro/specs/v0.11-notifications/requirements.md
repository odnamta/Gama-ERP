# Requirements Document

## Introduction

This document specifies the requirements for the Notifications System (v0.11) in Gama ERP. The system provides in-app notifications for important business events such as approval requests, budget alerts, invoice status changes, and system announcements. Phase 1 focuses on in-app notifications with a bell icon UI; Phase 2 (future) will add email notifications via n8n integration.

## Glossary

- **Notification_System**: The subsystem responsible for creating, storing, and displaying notifications
- **Notification_Bell**: The UI component in the header showing unread notification count
- **Notification_Dropdown**: The popup panel showing recent notifications when bell is clicked
- **Notification_Page**: The full page view for managing all notifications
- **Notification_Type**: Category of notification (approval, budget_alert, status_change, overdue, system, info)
- **Notification_Priority**: Urgency level (low, normal, high, urgent)
- **Entity_Reference**: Link to related business object (PJO, JO, Invoice, User)
- **Notification_Preferences**: User settings for which notifications to receive

## Requirements

### Requirement 1

**User Story:** As a user, I want to see a notification bell in the header, so that I can quickly know when I have new notifications.

#### Acceptance Criteria

1. WHEN the header renders THEN the Notification_System SHALL display a bell icon next to the user avatar
2. WHEN unread notifications exist THEN the Notification_Bell SHALL display a badge with the unread count
3. WHEN unread count exceeds 99 THEN the Notification_Bell SHALL display "99+" as the badge text
4. WHEN no unread notifications exist THEN the Notification_Bell SHALL display without a badge
5. WHEN a new notification arrives THEN the Notification_Bell SHALL update the count without page refresh

### Requirement 2

**User Story:** As a user, I want to click the notification bell to see recent notifications, so that I can quickly review what needs my attention.

#### Acceptance Criteria

1. WHEN a user clicks the Notification_Bell THEN the Notification_System SHALL display a dropdown panel
2. WHEN the Notification_Dropdown opens THEN the Notification_System SHALL show the 10 most recent notifications
3. WHEN displaying notifications THEN the Notification_Dropdown SHALL show notification icon, title, relative time, and preview text
4. WHEN displaying unread notifications THEN the Notification_Dropdown SHALL visually distinguish them with a highlight or indicator
5. WHEN the user clicks a notification THEN the Notification_System SHALL mark it as read and navigate to the action_url
6. WHEN the user clicks "Mark all read" THEN the Notification_System SHALL mark all notifications as read
7. WHEN the user clicks "View All" THEN the Notification_System SHALL navigate to the Notification_Page

### Requirement 3

**User Story:** As a user, I want a dedicated notifications page, so that I can view and manage all my notifications.

#### Acceptance Criteria

1. WHEN a user navigates to /notifications THEN the Notification_System SHALL display the Notification_Page
2. WHEN displaying the Notification_Page THEN the Notification_System SHALL show all notifications with pagination (25 per page)
3. WHEN displaying notifications THEN the Notification_Page SHALL show icon, title, message, timestamp, and status (read/unread)
4. WHEN the user filters by type THEN the Notification_Page SHALL show only notifications of the selected type
5. WHEN the user filters by status THEN the Notification_Page SHALL show only read or unread notifications as selected
6. WHEN the user clicks "Mark selected as read" THEN the Notification_System SHALL mark all selected notifications as read
7. WHEN the user clicks "Delete old notifications" THEN the Notification_System SHALL delete read notifications older than 30 days

### Requirement 4

**User Story:** As a manager or owner, I want to receive notifications when a PJO requires approval, so that I can review it promptly.

#### Acceptance Criteria

1. WHEN a PJO status changes to 'pending_approval' THEN the Notification_System SHALL create notifications for users with can_approve_pjo permission
2. WHEN creating approval notifications THEN the Notification_System SHALL set type to 'approval' and priority to 'high'
3. WHEN creating approval notifications THEN the Notification_System SHALL include PJO number, customer name, and total amount in the message
4. WHEN creating approval notifications THEN the Notification_System SHALL set action_url to the PJO detail page
5. WHEN a PJO is approved or rejected THEN the Notification_System SHALL notify the PJO creator with the decision

### Requirement 5

**User Story:** As a manager or finance user, I want to receive notifications when costs exceed budget, so that I can take corrective action.

#### Acceptance Criteria

1. WHEN a cost item actual_amount exceeds estimated_amount by more than 10% THEN the Notification_System SHALL create budget alert notifications
2. WHEN creating budget alerts THEN the Notification_System SHALL notify users with roles owner, manager, or finance
3. WHEN creating budget alerts THEN the Notification_System SHALL set type to 'budget_alert' and priority to 'high'
4. WHEN creating budget alerts THEN the Notification_System SHALL include PJO number, cost category, and variance percentage in the message
5. WHEN variance exceeds 25% THEN the Notification_System SHALL set priority to 'urgent'

### Requirement 6

**User Story:** As a finance user, I want to receive notifications about invoice status changes, so that I can track payment collection.

#### Acceptance Criteria

1. WHEN an invoice status changes to 'sent' THEN the Notification_System SHALL notify the invoice creator
2. WHEN an invoice status changes to 'paid' THEN the Notification_System SHALL notify users with role finance or manager
3. WHEN an invoice becomes overdue THEN the Notification_System SHALL notify users with role finance, manager, or owner
4. WHEN creating overdue notifications THEN the Notification_System SHALL set type to 'overdue' and priority to 'high'
5. WHEN creating overdue notifications THEN the Notification_System SHALL include invoice number, customer name, amount, and days overdue

### Requirement 7

**User Story:** As an ops user, I want to receive notifications about JO assignments and status changes, so that I can manage my work.

#### Acceptance Criteria

1. WHEN a JO is created from a PJO THEN the Notification_System SHALL notify users with role ops
2. WHEN a JO status changes to 'completed' THEN the Notification_System SHALL notify users with role admin and finance
3. WHEN a JO is submitted to finance THEN the Notification_System SHALL notify users with role finance
4. WHEN creating JO notifications THEN the Notification_System SHALL include JO number, customer name, and relevant status in the message
5. WHEN creating JO notifications THEN the Notification_System SHALL set action_url to the JO detail page

### Requirement 8

**User Story:** As an owner or admin, I want to receive notifications about user activity, so that I can monitor system access.

#### Acceptance Criteria

1. WHEN a new user logs in for the first time THEN the Notification_System SHALL notify users with role owner or admin
2. WHEN a user is deactivated THEN the Notification_System SHALL notify users with role owner
3. WHEN a user role is changed THEN the Notification_System SHALL notify the affected user and users with role owner
4. WHEN creating user notifications THEN the Notification_System SHALL set type to 'system'
5. WHEN creating user notifications THEN the Notification_System SHALL include user name and relevant action in the message

### Requirement 9

**User Story:** As a user, I want notifications to be automatically cleaned up, so that old notifications don't clutter my view.

#### Acceptance Criteria

1. WHEN a notification has expires_at set and the date has passed THEN the Notification_System SHALL automatically delete the notification
2. WHEN a read notification is older than 30 days THEN the Notification_System SHALL mark it for cleanup
3. WHEN an unread notification is older than 90 days THEN the Notification_System SHALL mark it for cleanup
4. WHEN cleanup runs THEN the Notification_System SHALL delete marked notifications in batches to avoid performance impact
5. WHEN displaying notifications THEN the Notification_System SHALL exclude expired notifications

### Requirement 10

**User Story:** As a user, I want to configure my notification preferences, so that I only receive notifications relevant to me.

#### Acceptance Criteria

1. WHEN a user navigates to notification settings THEN the Notification_System SHALL display preference options by notification type
2. WHEN displaying preferences THEN the Notification_System SHALL show toggles for: approvals, budget_alerts, status_changes, overdue, system
3. WHEN a user disables a notification type THEN the Notification_System SHALL not create notifications of that type for the user
4. WHEN a user enables a notification type THEN the Notification_System SHALL resume creating notifications of that type
5. WHEN saving preferences THEN the Notification_System SHALL persist the settings immediately

### Requirement 11

**User Story:** As a user, I want notifications to display appropriate visual indicators, so that I can quickly identify priority and type.

#### Acceptance Criteria

1. WHEN displaying an 'approval' notification THEN the Notification_System SHALL show a blue approval icon
2. WHEN displaying a 'budget_alert' notification THEN the Notification_System SHALL show an orange warning icon
3. WHEN displaying an 'overdue' notification THEN the Notification_System SHALL show a red alert icon
4. WHEN displaying a 'system' notification THEN the Notification_System SHALL show a gray info icon
5. WHEN displaying an 'urgent' priority notification THEN the Notification_System SHALL add a pulsing indicator
6. WHEN displaying notification time THEN the Notification_System SHALL show relative time (e.g., "2 min ago", "Yesterday")

### Requirement 12

**User Story:** As a developer, I want a notification service API, so that I can create notifications from various parts of the application.

#### Acceptance Criteria

1. WHEN creating a notification THEN the Notification_System SHALL accept title, message, type, priority, entity_type, entity_id, and action_url
2. WHEN creating notifications for multiple users THEN the Notification_System SHALL accept an array of user_ids or a role filter
3. WHEN fetching notifications THEN the Notification_System SHALL support filtering by is_read, type, and date range
4. WHEN marking notifications as read THEN the Notification_System SHALL update is_read and set read_at timestamp
5. WHEN deleting notifications THEN the Notification_System SHALL perform soft delete by setting a deleted_at timestamp

