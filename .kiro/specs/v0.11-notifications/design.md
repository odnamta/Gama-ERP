# Design Document: Notifications System (v0.11)

## Overview

The Notifications System provides in-app notifications for important business events in Gama ERP. It consists of a database layer for storing notifications, a service layer for creating and managing notifications, and UI components for displaying notifications to users.

The system follows an event-driven architecture where business events (PJO approval requests, budget alerts, invoice status changes) trigger notification creation. Notifications are routed to appropriate users based on their roles and preferences.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              UI Layer                                    │
├─────────────────┬─────────────────────┬─────────────────────────────────┤
│ NotificationBell│ NotificationDropdown│ NotificationPage                │
│ (Header)        │ (Popover)           │ (/notifications)                │
└────────┬────────┴──────────┬──────────┴────────────────┬────────────────┘
         │                   │                           │
         └───────────────────┼───────────────────────────┘
                             │
┌────────────────────────────┴────────────────────────────────────────────┐
│                         Service Layer                                    │
├─────────────────────────────────────────────────────────────────────────┤
│ NotificationService                                                      │
│ - createNotification(params)                                            │
│ - createBulkNotifications(params, userIds | roleFilter)                 │
│ - getNotifications(userId, filters)                                     │
│ - markAsRead(notificationId)                                            │
│ - markAllAsRead(userId)                                                 │
│ - deleteNotification(notificationId)                                    │
│ - cleanupOldNotifications()                                             │
└────────────────────────────────────────────────────────────────────────┬┘
                                                                          │
┌─────────────────────────────────────────────────────────────────────────┴┐
│                         Data Layer (Supabase)                            │
├──────────────────────────────────────────────────────────────────────────┤
│ notifications table                                                      │
│ notification_preferences table                                           │
│ RLS policies for user-scoped access                                      │
└──────────────────────────────────────────────────────────────────────────┘
```

### Event Triggers

Notifications are created by these application events:

| Event | Trigger Location | Recipients |
|-------|-----------------|------------|
| PJO submitted for approval | PJO status update action | Users with can_approve_pjo |
| PJO approved/rejected | PJO approval action | PJO creator |
| Cost item exceeds budget | Cost item update action | Owner, Manager, Finance |
| Invoice sent | Invoice status update | Invoice creator |
| Invoice paid | Invoice status update | Finance, Manager |
| Invoice overdue | Scheduled job (future) | Finance, Manager, Owner |
| JO created | PJO conversion action | Ops users |
| JO completed | JO status update | Admin, Finance |
| JO submitted to finance | JO status update | Finance users |
| New user first login | Auth callback | Owner, Admin |
| User deactivated | User management action | Owner |
| User role changed | User management action | Affected user, Owner |

## Components and Interfaces

### UI Components

#### NotificationBell
Location: `components/notifications/notification-bell.tsx`

```typescript
interface NotificationBellProps {
  className?: string
}

// Displays bell icon with unread count badge
// Uses useNotifications hook for real-time count
```

#### NotificationDropdown
Location: `components/notifications/notification-dropdown.tsx`

```typescript
interface NotificationDropdownProps {
  notifications: Notification[]
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onViewAll: () => void
}

// Popover content showing recent notifications
// Max 10 items, sorted by created_at desc
```

#### NotificationItem
Location: `components/notifications/notification-item.tsx`

```typescript
interface NotificationItemProps {
  notification: Notification
  variant: 'dropdown' | 'page'
  onMarkAsRead?: (id: string) => void
  onDelete?: (id: string) => void
}

// Single notification display with icon, title, message, time
// Different layouts for dropdown vs full page
```

#### NotificationPage
Location: `app/(main)/notifications/page.tsx`

```typescript
// Full page notification management
// Filters: type, status (read/unread)
// Pagination: 25 per page
// Bulk actions: mark selected as read, delete old
```

### Service Layer

#### NotificationService
Location: `lib/notifications/notification-service.ts`

```typescript
interface CreateNotificationParams {
  userId: string
  title: string
  message: string
  type: NotificationType
  priority?: NotificationPriority
  entityType?: EntityType
  entityId?: string
  actionUrl?: string
  expiresAt?: Date
  metadata?: Record<string, unknown>
}

interface CreateBulkNotificationParams {
  title: string
  message: string
  type: NotificationType
  priority?: NotificationPriority
  entityType?: EntityType
  entityId?: string
  actionUrl?: string
  expiresAt?: Date
  metadata?: Record<string, unknown>
}

interface NotificationFilters {
  isRead?: boolean
  type?: NotificationType
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

// Service functions
async function createNotification(params: CreateNotificationParams): Promise<Notification>
async function createBulkNotifications(
  params: CreateBulkNotificationParams,
  recipients: { userIds?: string[], roles?: UserRole[] }
): Promise<Notification[]>
async function getNotifications(userId: string, filters?: NotificationFilters): Promise<Notification[]>
async function getUnreadCount(userId: string): Promise<number>
async function markAsRead(notificationId: string): Promise<void>
async function markAllAsRead(userId: string): Promise<void>
async function deleteNotification(notificationId: string): Promise<void>
async function cleanupOldNotifications(): Promise<number>
```

#### NotificationTriggers
Location: `lib/notifications/notification-triggers.ts`

```typescript
// Helper functions to create notifications for specific events
async function notifyPjoApprovalRequired(pjo: ProformaJobOrder): Promise<void>
async function notifyPjoDecision(pjo: ProformaJobOrder, decision: 'approved' | 'rejected'): Promise<void>
async function notifyBudgetExceeded(costItem: PjoCostItem, pjo: ProformaJobOrder): Promise<void>
async function notifyInvoiceStatusChange(invoice: Invoice, newStatus: InvoiceStatus): Promise<void>
async function notifyJoCreated(jo: JobOrder): Promise<void>
async function notifyJoStatusChange(jo: JobOrder, newStatus: JoStatus): Promise<void>
async function notifyUserActivity(user: UserProfile, action: 'first_login' | 'deactivated' | 'role_changed'): Promise<void>
```

### Hooks

#### useNotifications
Location: `hooks/use-notifications.ts`

```typescript
interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  error: Error | null
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  refresh: () => Promise<void>
}

function useNotifications(options?: { limit?: number, unreadOnly?: boolean }): UseNotificationsReturn
```

## Data Models

### Database Schema

```sql
-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Content
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(30) NOT NULL CHECK (type IN ('approval', 'budget_alert', 'status_change', 'overdue', 'system', 'info')),
  priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Related entity
  entity_type VARCHAR(30) CHECK (entity_type IN ('pjo', 'jo', 'invoice', 'user', 'cost_item')),
  entity_id UUID,
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  -- Metadata
  action_url VARCHAR(500),
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_cleanup ON notifications(created_at, is_read) WHERE deleted_at IS NULL;

-- Notification preferences table
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Preferences by type (true = enabled)
  approval_enabled BOOLEAN DEFAULT TRUE,
  budget_alert_enabled BOOLEAN DEFAULT TRUE,
  status_change_enabled BOOLEAN DEFAULT TRUE,
  overdue_enabled BOOLEAN DEFAULT TRUE,
  system_enabled BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id IN (
    SELECT id FROM user_profiles WHERE user_id = auth.uid()
  ));

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id IN (
    SELECT id FROM user_profiles WHERE user_id = auth.uid()
  ));

-- Service role can insert notifications
CREATE POLICY "Service can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Users can manage their own preferences
CREATE POLICY "Users can manage own preferences" ON notification_preferences
  FOR ALL USING (user_id IN (
    SELECT id FROM user_profiles WHERE user_id = auth.uid()
  ));
```

### TypeScript Types

```typescript
// types/notifications.ts

export type NotificationType = 'approval' | 'budget_alert' | 'status_change' | 'overdue' | 'system' | 'info'
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'
export type EntityType = 'pjo' | 'jo' | 'invoice' | 'user' | 'cost_item'

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: NotificationType
  priority: NotificationPriority
  entity_type: EntityType | null
  entity_id: string | null
  is_read: boolean
  read_at: string | null
  action_url: string | null
  metadata: Record<string, unknown>
  created_at: string
  expires_at: string | null
  deleted_at: string | null
}

export interface NotificationPreferences {
  id: string
  user_id: string
  approval_enabled: boolean
  budget_alert_enabled: boolean
  status_change_enabled: boolean
  overdue_enabled: boolean
  system_enabled: boolean
  created_at: string
  updated_at: string
}

export interface NotificationWithMeta extends Notification {
  relativeTime: string
  icon: string
  iconColor: string
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Badge count accuracy
*For any* user with N unread notifications where N > 0, the notification badge SHALL display N (or "99+" if N > 99), and for N = 0, no badge SHALL be displayed.
**Validates: Requirements 1.2, 1.3, 1.4**

### Property 2: Dropdown limit and ordering
*For any* set of notifications for a user, the dropdown SHALL display at most 10 notifications, ordered by created_at descending.
**Validates: Requirements 2.2**

### Property 3: Notification content completeness
*For any* notification displayed in dropdown or page, the rendered output SHALL contain the notification's icon, title, relative time, and message preview.
**Validates: Requirements 2.3, 3.3**

### Property 4: Mark as read state transition
*For any* notification marked as read, the is_read field SHALL be true and read_at SHALL be set to a non-null timestamp.
**Validates: Requirements 2.5, 2.6, 12.4**

### Property 5: Pagination constraint
*For any* page of notifications on the Notification_Page, the page SHALL contain at most 25 notifications.
**Validates: Requirements 3.2**

### Property 6: Filter correctness
*For any* filter applied (by type or status), all returned notifications SHALL match the filter criteria.
**Validates: Requirements 3.4, 3.5**

### Property 7: PJO approval notification routing
*For any* PJO that transitions to 'pending_approval' status, notifications SHALL be created for all users where can_approve_pjo = true, with type = 'approval', priority = 'high', and message containing PJO number, customer name, and total amount.
**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

### Property 8: PJO decision notification
*For any* PJO that is approved or rejected, a notification SHALL be created for the PJO creator with the decision outcome.
**Validates: Requirements 4.5**

### Property 9: Budget alert threshold and priority
*For any* cost item where (actual_amount - estimated_amount) / estimated_amount > 0.10, a budget alert notification SHALL be created with type = 'budget_alert'. If variance > 0.25, priority SHALL be 'urgent', otherwise 'high'.
**Validates: Requirements 5.1, 5.3, 5.5**

### Property 10: Budget alert recipient routing
*For any* budget alert notification, recipients SHALL include all users with role in ['owner', 'manager', 'finance'].
**Validates: Requirements 5.2**

### Property 11: Invoice notification routing
*For any* invoice status change: 'sent' notifies creator, 'paid' notifies finance/manager, 'overdue' notifies finance/manager/owner with type = 'overdue' and priority = 'high'.
**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

### Property 12: JO notification routing
*For any* JO created, notifications SHALL be sent to ops users. For JO completed, notifications SHALL be sent to admin/finance. For JO submitted to finance, notifications SHALL be sent to finance users.
**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

### Property 13: User activity notification routing
*For any* user activity event (first login, deactivation, role change), notifications SHALL be created with type = 'system' and routed to owner/admin as specified.
**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

### Property 14: Notification cleanup eligibility
*For any* notification where (expires_at < now) OR (is_read = true AND created_at < now - 30 days) OR (is_read = false AND created_at < now - 90 days), the notification SHALL be eligible for cleanup and excluded from query results.
**Validates: Requirements 9.1, 9.2, 9.3, 9.5**

### Property 15: Preference enforcement
*For any* notification type T and user U, if U's preference for T is disabled, no notifications of type T SHALL be created for U. If enabled, notifications SHALL be created normally.
**Validates: Requirements 10.3, 10.4, 10.5**

### Property 16: Relative time formatting
*For any* notification timestamp, the formatted relative time SHALL produce human-readable strings (e.g., "2 min ago", "1 hour ago", "Yesterday", "Dec 15").
**Validates: Requirements 11.6**

### Property 17: Notification service API contract
*For any* call to createNotification, the function SHALL accept title, message, type, and optional priority, entity_type, entity_id, action_url. For createBulkNotifications, it SHALL accept userIds array or roles filter.
**Validates: Requirements 12.1, 12.2, 12.3**

### Property 18: Soft delete behavior
*For any* deleted notification, the deleted_at field SHALL be set to a non-null timestamp, and the record SHALL be excluded from normal queries.
**Validates: Requirements 12.5**

## Error Handling

| Error Scenario | Handling Strategy |
|---------------|-------------------|
| Failed to create notification | Log error, don't block main operation |
| Failed to fetch notifications | Show error toast, allow retry |
| Failed to mark as read | Show error toast, revert optimistic update |
| Invalid notification type | Reject with validation error |
| User not found for notification | Skip user, log warning |
| Database connection error | Retry with exponential backoff |

## Testing Strategy

### Unit Tests
- NotificationService functions (create, fetch, mark as read, delete)
- Notification type/priority validation
- Relative time formatting
- Badge count calculation
- Filter logic

### Property-Based Tests
Using fast-check library:
- Badge count accuracy (Property 1)
- Dropdown limit and ordering (Property 2)
- Mark as read state transition (Property 4)
- Filter correctness (Property 6)
- Budget alert threshold (Property 9)
- Cleanup eligibility (Property 14)
- Preference enforcement (Property 15)
- Relative time formatting (Property 16)

### Integration Tests
- PJO approval triggers notification
- Cost item update triggers budget alert
- Invoice status change triggers notification
- Notification preferences respected
- RLS policies enforce user isolation

