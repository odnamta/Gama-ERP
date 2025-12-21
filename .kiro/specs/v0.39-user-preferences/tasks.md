# Implementation Plan: User Preferences & Settings

## Overview

This implementation plan breaks down the User Preferences & Settings feature (v0.39) into discrete coding tasks. The approach starts with database schema, then types, utilities, server actions, and finally UI components. Property-based tests are included as sub-tasks close to their related implementations.

## Tasks

- [ ] 1. Database schema setup
  - [ ] 1.1 Create migration for preferences JSONB column on user_profiles
    - Add `preferences` JSONB column with default values
    - Include display, notifications, dashboard, and workflow sections
    - _Requirements: 1.1, 1.5_
  - [ ] 1.2 Create migration for notification_types table
    - Create table with type_code, type_name, description, category, defaults, applicable_roles
    - Insert seed data for all notification types (bkk_pending, bkk_approved, leave_request, etc.)
    - _Requirements: 1.3_
  - [ ] 1.3 Create migration for notification_preferences table
    - Create table with user_id, notification_type, channel preferences
    - Add unique constraint on (user_id, notification_type)
    - Add RLS policies for user access
    - _Requirements: 1.2, 1.4_

- [ ] 2. TypeScript types and constants
  - [ ] 2.1 Create user preferences types file
    - Create `types/user-preferences.ts` with all interfaces
    - Define DisplayPreferences, NotificationChannelPreferences, DashboardPreferences, WorkflowPreferences
    - Define UserPreferences, NotificationType, NotificationPreference interfaces
    - Export DEFAULT_PREFERENCES constant
    - _Requirements: 1.5, 2.1-2.6, 3.1-3.5, 5.1-5.4_

- [ ] 3. Utility functions
  - [ ] 3.1 Create user preferences utility functions
    - Create `lib/user-preferences-utils.ts`
    - Implement formatDateWithPreferences function
    - Implement formatCurrencyWithPreferences function
    - Implement formatNumberWithPreferences function
    - Implement getDateFormatPreview and getNumberFormatPreview functions
    - Implement applyTheme function
    - _Requirements: 2.3, 2.4, 2.7, 7.2, 7.3, 7.4_
  - [ ] 3.2 Write property tests for format utilities
    - **Property 2: Date Formatting Consistency**
    - **Property 3: Number Formatting Consistency**
    - **Validates: Requirements 2.3, 2.4, 2.7, 7.2, 7.3**
  - [ ] 3.3 Create notification preferences utility functions
    - Implement filterNotificationTypesByRole function
    - Implement groupNotificationTypesByCategory function
    - Implement mergePreferencesWithDefaults function
    - Implement getEffectiveNotificationPreference function (handles master channel override)
    - _Requirements: 4.1, 4.2, 4.5, 4.6_
  - [ ] 3.4 Write property tests for notification utilities
    - **Property 4: Notification Type Role Filtering**
    - **Property 5: Notification Type Category Grouping**
    - **Property 7: Notification Preference Fallback to Defaults**
    - **Property 8: Master Channel Override Logic**
    - **Validates: Requirements 4.1, 4.2, 4.5, 4.6**

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Server actions
  - [ ] 5.1 Create preferences server actions
    - Create `app/(main)/settings/preferences/actions.ts`
    - Implement getUserPreferences action
    - Implement saveUserPreferences action
    - Implement resetPreferencesToDefaults action
    - _Requirements: 6.2, 6.3, 6.4, 7.1_
  - [ ] 5.2 Create notification preferences server actions
    - Implement getNotificationTypes action (filtered by role)
    - Implement getNotificationPreferences action
    - Implement saveNotificationPreference action (upsert)
    - _Requirements: 4.2, 4.3, 4.4, 4.6_
  - [ ] 5.3 Write property tests for server actions
    - **Property 1: Preferences Round-Trip Consistency**
    - **Property 6: Per-Type Notification Preference Round-Trip**
    - **Property 10: Default Preferences Initialization**
    - **Validates: Requirements 1.5, 2.1-2.6, 3.1-3.6, 4.3, 4.4, 5.1-5.5**

- [ ] 6. Preferences context
  - [ ] 6.1 Create preferences context provider
    - Create `contexts/preferences-context.tsx`
    - Implement PreferencesProvider component
    - Load preferences on mount
    - Provide formatDate, formatCurrency, formatNumber functions
    - Apply theme on preference change
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  - [ ] 6.2 Write property test for theme application
    - **Property 9: Theme Application**
    - **Validates: Requirements 7.4**

- [ ] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Settings page UI components
  - [ ] 8.1 Create settings tabs container
    - Create `components/settings/settings-tabs.tsx`
    - Implement tabbed interface with Profile, Display, Notifications, Preferences tabs
    - Handle tab navigation
    - _Requirements: 6.1_
  - [ ] 8.2 Create display settings tab
    - Create `components/settings/display-settings-tab.tsx`
    - Implement theme selector (light/dark/system radio buttons)
    - Implement language selector dropdown
    - Implement date format selector with preview
    - Implement number format selector with preview
    - Implement timezone selector
    - Implement compact mode toggle
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_
  - [ ] 8.3 Create notification settings tab
    - Create `components/settings/notification-settings-tab.tsx`
    - Implement channel toggles (email, in-app, desktop, sound)
    - Implement digest frequency selector
    - Display notification types grouped by category
    - Implement per-type channel toggles
    - Show override indication when master channel is disabled
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5_
  - [ ] 8.4 Create notification type row component
    - Create `components/settings/notification-type-row.tsx`
    - Display notification type name and description
    - Implement email and in-app toggle checkboxes
    - Handle disabled state when master channel is off
    - _Requirements: 4.3, 4.4, 4.5_
  - [ ] 8.5 Create workflow settings tab
    - Create `components/settings/workflow-settings-tab.tsx`
    - Implement auto-save toggle
    - Implement confirm delete toggle
    - Implement auto-refresh toggle
    - Implement refresh interval selector
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 9. Settings page integration
  - [ ] 9.1 Create settings page route
    - Create or update `app/(main)/settings/page.tsx`
    - Integrate settings tabs component
    - Implement save button with loading state
    - Implement reset to defaults button with confirmation dialog
    - Show success/error toast feedback
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_
  - [ ] 9.2 Write unit tests for settings page
    - Test tab navigation
    - Test save button triggers save action
    - Test reset button shows confirmation
    - Test error handling preserves form state
    - _Requirements: 6.1, 6.3, 6.4, 6.5, 6.6, 6.7_

- [ ] 10. App integration
  - [ ] 10.1 Integrate preferences provider in app layout
    - Wrap app with PreferencesProvider in `app/(main)/layout.tsx`
    - Ensure preferences are loaded on app start
    - _Requirements: 7.1_
  - [ ] 10.2 Update navigation to include settings link
    - Add settings link to user menu or sidebar
    - _Requirements: 6.1_

- [ ] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Database migrations should be applied in order (1.1 → 1.2 → 1.3)
- The preferences context must be integrated before UI components can use formatting functions
