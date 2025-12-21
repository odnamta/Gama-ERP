# Design Document: Enhanced Notification Center

## Overview

This design document describes the implementation of an enhanced Notification Center for Gama ERP. The system builds upon the existing notification infrastructure (types, service, utils, components) to add real-time updates via Supabase subscriptions, notification grouping, filtering, archiving, and multi-channel delivery support.

The enhanced notification center provides:
- Real-time notification delivery via Supabase Realtime
- Full notification center page with filtering, search, and pagination
- Enhanced notification bell with grouped dropdown
- Archive functionality for notification management
- Integration with user notification preferences
- Desktop notification and sound support

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Client Layer                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │ NotificationBell │  │NotificationCenter│  │ Desktop Notification │  │
│  │   (Enhanced)     │  │     Page         │  │      Handler         │  │
│  └────────┬─────────┘  └────────┬─────────┘  └──────────┬───────────┘  │
│           │                     │                        │              │
│           └─────────────────────┼────────────────────────┘              │
│                                 │                                        │
│                    ┌────────────▼────────────┐                          │
│                    │  useNotificationsEnhanced │                         │
│                    │       (Hook)             │                          │
│                    └────────────┬────────────┘                          │
├─────────────────────────────────┼───────────────────────────────────────┤
│                           Service Layer                                  │
├─────────────────────────────────┼───────────────────────────────────────┤
│  ┌──────────────────────────────▼──────────────────────────────────┐   │
│  │              notification-center-utils.ts                        │   │
│  │  - groupNotificationsByDate()                                    │   │
│  │  - filterNotifications()                                         │   │
│  │  - searchNotifications()                                         │   │
│  │  - getCategoryIcon()                                             │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │              notification-center-actions.ts                       │   │
│  │  - archiveNotification()                                          │   │
│  │  - archiveAllNotifications()                                      │   │
│  │  - executeQuickAction()                                           │   │
│  └──────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│                           Database Layer                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    notifications table                            │   │
│  │  + is_archived, archived_at columns                               │   │
│  │  + category column                                                │   │
│  │  + action_label column                                            │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                 Supabase Realtime Channel                         │   │
│  │  - postgres_changes on notifications table                        │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Enhanced Types (types/notification-center.ts)

```typescript
import { Notification, NotificationPriority } from './notifications'

export type NotificationCategory = 
  | 'finance' 
  | 'operations' 
  | 'hr' 
  | 'approvals' 
  | 'system'

export interface EnhancedNotification extends Notification {
  category: NotificationCategory
  action_label: string | null
  is_archived: boolean
  archived_at: string | null
  email_sent: boolean
  email_sent_at: string | null
  push_sent: boolean
  push_sent_at: string | null
}

export interface NotificationGroup {
  label: string  // 'Today', 'Yesterday', 'Earlier', or date string
  notifications: EnhancedNotification[]
}

export interface NotificationCenterFilters {
  status: 'all' | 'unread' | 'read'
  category: NotificationCategory | 'all'
  priority: NotificationPriority | 'all'
  searchQuery: string
}

export interface NotificationCenterState {
  notifications: EnhancedNotification[]
  groupedNotifications: NotificationGroup[]
  unreadCount: number
  totalCount: number
  isLoading: boolean
  hasMore: boolean
  filters: NotificationCenterFilters
}

export interface QuickAction {
  id: string
  label: string
  variant: 'default' | 'destructive' | 'outline'
  action: string  // Action identifier for server
  entityType: string
  entityId: string
}
```

### 2. Enhanced Hook (hooks/use-notifications-enhanced.ts)

```typescript
interface UseNotificationsEnhancedOptions {
  limit?: number
  enableRealtime?: boolean
  enableSound?: boolean
  enableDesktop?: boolean
}

interface UseNotificationsEnhancedReturn {
  // State
  notifications: EnhancedNotification[]
  groupedNotifications: NotificationGroup[]
  unreadCount: number
  totalCount: number
  isLoading: boolean
  hasMore: boolean
  error: Error | null
  
  // Filters
  filters: NotificationCenterFilters
  setFilters: (filters: Partial<NotificationCenterFilters>) => void
  
  // Actions
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  archive: (id: string) => Promise<void>
  archiveAll: () => Promise<void>
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  
  // Quick actions
  executeQuickAction: (action: QuickAction) => Promise<void>
}
```

### 3. UI Components

#### NotificationBellEnhanced
- Displays unread count badge
- Opens dropdown on click
- Groups notifications into "New" (unread) and "Earlier" (read)
- Shows max 10 recent notifications
- "Mark all read" button
- "View All" link to /notifications

#### NotificationCenterPage
- Full page at /notifications
- Header with title, "Mark All Read", "Settings", "Archive All"
- Filter bar: status dropdown, category dropdown, search input
- Notification list grouped by date
- Each notification shows: icon, title, message, timestamp, actions
- Pagination with "Load More"
- Empty state when no notifications

#### NotificationItemEnhanced
- Blue dot indicator for unread
- Priority-based styling (urgent = red border)
- Icon based on category/type
- Action button if action_url present
- Quick action buttons for actionable notifications
- Archive button
- Mark read button (for unread)

### 4. Server Actions (lib/notification-center-actions.ts)

```typescript
'use server'

export async function archiveNotification(id: string): Promise<{ success: boolean; error?: string }>

export async function archiveAllNotifications(userId: string): Promise<{ success: boolean; count: number; error?: string }>

export async function executeQuickAction(
  action: string,
  entityType: string,
  entityId: string
): Promise<{ success: boolean; error?: string }>

export async function getNotificationsWithFilters(
  userId: string,
  filters: NotificationCenterFilters,
  limit: number,
  offset: number
): Promise<{ notifications: EnhancedNotification[]; total: number }>
```

## Data Models

### Database Schema Changes

The existing `notifications` table needs these additional columns:

```sql
-- Add new columns to notifications table
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'system',
ADD COLUMN IF NOT EXISTS action_label VARCHAR(100),
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS push_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS push_sent_at TIMESTAMPTZ;

-- Create index for archived notifications
CREATE INDEX IF NOT EXISTS idx_notifications_archived 
ON notifications(user_id, is_archived) 
WHERE is_archived = FALSE;

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_notifications_category 
ON notifications(user_id, category);
```

### Notification Category Mapping

```typescript
const TYPE_TO_CATEGORY: Record<string, NotificationCategory> = {
  'approval': 'approvals',
  'budget_alert': 'finance',
  'status_change': 'operations',
  'overdue': 'finance',
  'system': 'system',
  'info': 'system',
  'leave_request': 'hr',
  'payroll': 'hr',
  'payment': 'finance',
  'invoice': 'finance',
  'jo_update': 'operations',
  'pjo_update': 'operations',
}
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Category Lookup from Type

*For any* notification type code, when a notification is created, the resulting category should match the predefined type-to-category mapping.

**Validates: Requirements 1.4**

### Property 2: Badge Visibility Based on Count

*For any* unread count value, the notification bell badge should be visible if and only if the count is greater than zero.

**Validates: Requirements 2.1**

### Property 3: Notification Grouping

*For any* list of notifications with mixed read/unread status and various timestamps, grouping should produce:
- "New" section containing all unread notifications
- "Earlier" section containing all read notifications
- Date-based groups (Today, Yesterday, Earlier) based on created_at timestamp

**Validates: Requirements 2.3, 3.2**

### Property 4: Notification Item Rendering

*For any* notification object, the rendered notification item should contain: icon (based on type), title, message (or truncated preview), and relative timestamp.

**Validates: Requirements 2.4, 3.3**

### Property 5: Unread Indicator Visibility

*For any* notification, the blue unread indicator dot should be visible if and only if is_read is false.

**Validates: Requirements 3.4**

### Property 6: Filter Application

*For any* filter combination (status, category, priority) and notification list, the filtered result should contain only notifications matching all filter criteria.

**Validates: Requirements 4.4**

### Property 7: Search Filtering

*For any* search query string and notification list, the search result should contain only notifications where the title OR message contains the search term (case-insensitive).

**Validates: Requirements 4.5**

### Property 8: Mark as Read State Update

*For any* notification, after marking as read, the notification should have is_read=true and read_at set to a timestamp within the last few seconds.

**Validates: Requirements 5.1**

### Property 9: Mark All as Read Bulk Update

*For any* user with N unread notifications, after marking all as read, all N notifications should have is_read=true.

**Validates: Requirements 5.2**

### Property 10: Archive State Update

*For any* notification, after archiving, the notification should have is_archived=true and archived_at set to a timestamp within the last few seconds.

**Validates: Requirements 5.3**

### Property 11: Action Button Conditional Rendering

*For any* notification, an action button should be rendered if and only if action_url is non-null and non-empty.

**Validates: Requirements 5.4**

### Property 12: Preference Enforcement

*For any* notification creation request and user preferences:
- If in_app_enabled is false for that notification type, no in-app notification should be created
- If email_enabled is true for that notification type, email_sent should be queued

**Validates: Requirements 7.1, 7.2, 7.3**

### Property 13: Priority Visual Styling

*For any* notification with priority 'high' or 'urgent', the rendered notification should have distinct visual styling (e.g., colored border class applied).

**Validates: Requirements 8.2**

### Property 14: Priority-Aware Sorting

*For any* list of notifications, after sorting, notifications should be ordered by created_at descending, with same-timestamp notifications ordered by priority (urgent > high > normal > low).

**Validates: Requirements 8.4**

## Error Handling

### Database Errors

| Error Scenario | Handling Strategy |
|----------------|-------------------|
| Failed to fetch notifications | Display error toast, show retry button, log error |
| Failed to mark as read | Display error toast, revert optimistic update |
| Failed to archive | Display error toast, revert optimistic update |
| Real-time subscription failed | Fallback to polling every 30 seconds, log warning |
| Foreign key violation | Display user-friendly error, log details |

### Client-Side Errors

| Error Scenario | Handling Strategy |
|----------------|-------------------|
| Desktop notification permission denied | Disable desktop notifications, show info message |
| Sound playback failed | Silently fail, log warning |
| Invalid filter combination | Reset to default filters, show info message |
| Network timeout | Show offline indicator, queue actions for retry |

### Optimistic Updates

All state-changing actions (mark read, archive) use optimistic updates:
1. Update local state immediately
2. Send request to server
3. On success: confirm state
4. On failure: revert state, show error toast

## Testing Strategy

### Property-Based Testing

We will use **fast-check** for property-based testing in TypeScript. Each property test will run a minimum of 100 iterations.

**Test File**: `__tests__/notification-center-utils.property.test.ts`

Property tests will cover:
- Grouping functions (Properties 3, 5)
- Filtering functions (Properties 6, 7)
- Rendering logic (Properties 2, 4, 11, 13)
- Sorting functions (Property 14)

### Unit Tests

**Test File**: `__tests__/notification-center-utils.test.ts`

Unit tests will cover:
- Category lookup mapping (Property 1)
- Mark as read action (Property 8)
- Mark all as read action (Property 9)
- Archive action (Property 10)
- Preference enforcement (Property 12)
- Edge cases: empty lists, null values, boundary conditions

### Integration Tests

**Test File**: `__tests__/notification-center-actions.test.ts`

Integration tests will cover:
- Real-time subscription setup and teardown
- Quick action execution
- Pagination behavior
- Filter + search combination

### Test Configuration

```typescript
// vitest.config.ts additions
export default defineConfig({
  test: {
    // Property tests may take longer
    testTimeout: 30000,
  },
})
```

### Test Data Generators

```typescript
// Generators for property tests
const notificationGenerator = fc.record({
  id: fc.uuid(),
  user_id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 200 }),
  message: fc.string({ minLength: 1, maxLength: 1000 }),
  type: fc.constantFrom('approval', 'budget_alert', 'status_change', 'overdue', 'system', 'info'),
  category: fc.constantFrom('finance', 'operations', 'hr', 'approvals', 'system'),
  priority: fc.constantFrom('low', 'normal', 'high', 'urgent'),
  is_read: fc.boolean(),
  is_archived: fc.boolean(),
  action_url: fc.option(fc.webUrl()),
  created_at: fc.date({ min: new Date('2024-01-01'), max: new Date() }).map(d => d.toISOString()),
})

const filtersGenerator = fc.record({
  status: fc.constantFrom('all', 'unread', 'read'),
  category: fc.constantFrom('all', 'finance', 'operations', 'hr', 'approvals', 'system'),
  priority: fc.constantFrom('all', 'low', 'normal', 'high', 'urgent'),
  searchQuery: fc.string({ maxLength: 50 }),
})
```
