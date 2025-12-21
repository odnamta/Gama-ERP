# Requirements Document

## Introduction

This document defines the requirements for the User Preferences & Settings feature (v0.39) in Gama ERP. This feature allows users to customize their experience with display settings, notification preferences, and workflow configurations. The system will store preferences in a flexible JSONB structure and provide granular control over notification channels per notification type.

## Glossary

- **User_Preferences_System**: The system responsible for storing, retrieving, and applying user preference settings
- **Display_Settings_Manager**: The component that handles theme, language, date format, number format, timezone, and compact mode preferences
- **Notification_Preferences_Manager**: The component that manages notification channel settings and per-type notification preferences
- **Workflow_Preferences_Manager**: The component that handles auto-save, confirm delete, and dashboard refresh settings
- **Settings_Page**: The UI page where users configure all their preferences across multiple tabs

## Requirements

### Requirement 1: Database Schema for User Preferences

**User Story:** As a system administrator, I want user preferences stored in a flexible JSONB structure, so that we can easily extend preferences without schema migrations.

#### Acceptance Criteria

1. THE User_Preferences_System SHALL add a `preferences` JSONB column to the `user_profiles` table with default values for display, notifications, dashboard, and workflow settings
2. THE User_Preferences_System SHALL create a `notification_preferences` table to store per-user, per-notification-type channel preferences
3. THE User_Preferences_System SHALL create a `notification_types` table with predefined notification types categorized by approvals, finance, operations, hr, and system
4. THE User_Preferences_System SHALL enforce a unique constraint on (user_id, notification_type) in the notification_preferences table
5. WHEN a new user is created, THE User_Preferences_System SHALL initialize their preferences with sensible defaults (light theme, Indonesian language, DD/MM/YYYY date format, Asia/Jakarta timezone)

### Requirement 2: Display Settings

**User Story:** As a user, I want to customize display settings like theme, language, and date format, so that the application matches my preferences and regional conventions.

#### Acceptance Criteria

1. WHEN a user selects a theme (light, dark, or system), THE Display_Settings_Manager SHALL apply the theme immediately and persist the selection
2. WHEN a user selects a language, THE Display_Settings_Manager SHALL store the preference (Indonesian or English supported)
3. WHEN a user selects a date format, THE Display_Settings_Manager SHALL apply the format throughout the application and show a preview
4. WHEN a user selects a number format, THE Display_Settings_Manager SHALL apply the format to all currency and number displays and show a preview
5. WHEN a user selects a timezone, THE Display_Settings_Manager SHALL store the preference for date/time calculations
6. WHEN a user toggles compact mode, THE Display_Settings_Manager SHALL adjust the UI density to show more information in less space
7. THE Display_Settings_Manager SHALL provide real-time previews for date and number format changes before saving

### Requirement 3: Notification Channel Settings

**User Story:** As a user, I want to control which notification channels I receive alerts through, so that I can manage how I'm notified without being overwhelmed.

#### Acceptance Criteria

1. WHEN a user toggles email notifications, THE Notification_Preferences_Manager SHALL enable or disable email delivery for all notification types
2. WHEN a user toggles in-app notifications, THE Notification_Preferences_Manager SHALL enable or disable the notification bell and dropdown
3. WHEN a user toggles desktop notifications, THE Notification_Preferences_Manager SHALL request browser permission and enable or disable push notifications
4. WHEN a user toggles sound, THE Notification_Preferences_Manager SHALL enable or disable audio alerts for new notifications
5. WHEN a user selects an email digest frequency (none, daily, weekly), THE Notification_Preferences_Manager SHALL configure how notification summaries are batched and sent
6. THE Notification_Preferences_Manager SHALL persist all channel settings immediately upon change

### Requirement 4: Per-Type Notification Preferences

**User Story:** As a user, I want to configure notification preferences for each notification type individually, so that I receive important alerts while filtering out less critical ones.

#### Acceptance Criteria

1. THE Notification_Preferences_Manager SHALL display notification types grouped by category (approvals, finance, operations, hr, system)
2. THE Notification_Preferences_Manager SHALL only show notification types applicable to the user's role
3. WHEN a user toggles email for a specific notification type, THE Notification_Preferences_Manager SHALL update that type's email preference
4. WHEN a user toggles in-app for a specific notification type, THE Notification_Preferences_Manager SHALL update that type's in-app preference
5. IF a master channel is disabled, THEN THE Notification_Preferences_Manager SHALL visually indicate that per-type settings for that channel are overridden
6. THE Notification_Preferences_Manager SHALL load existing preferences or fall back to notification type defaults

### Requirement 5: Workflow Preferences

**User Story:** As a user, I want to configure workflow behaviors like auto-save and confirmation dialogs, so that the application works the way I prefer.

#### Acceptance Criteria

1. WHEN a user toggles auto-save drafts, THE Workflow_Preferences_Manager SHALL enable or disable automatic saving of form data
2. WHEN a user toggles confirm before delete, THE Workflow_Preferences_Manager SHALL enable or disable confirmation dialogs for destructive actions
3. WHEN a user toggles auto-refresh dashboard, THE Workflow_Preferences_Manager SHALL enable or disable automatic data refresh
4. WHEN a user selects a refresh interval (1, 5, 10, 15 minutes), THE Workflow_Preferences_Manager SHALL configure the dashboard polling frequency
5. THE Workflow_Preferences_Manager SHALL persist all workflow settings immediately upon change

### Requirement 6: Settings Page UI

**User Story:** As a user, I want a well-organized settings page with tabs for different preference categories, so that I can easily find and modify my settings.

#### Acceptance Criteria

1. THE Settings_Page SHALL display four tabs: Profile, Display, Notifications, and Preferences
2. THE Settings_Page SHALL load the user's current preferences when opened
3. THE Settings_Page SHALL provide a "Save" button to persist all changes
4. THE Settings_Page SHALL provide a "Reset to Defaults" button to restore factory settings
5. WHEN a user clicks Reset to Defaults, THE Settings_Page SHALL show a confirmation dialog before resetting
6. THE Settings_Page SHALL show success or error feedback after save operations
7. IF an error occurs during save, THEN THE Settings_Page SHALL display a user-friendly error message and retain the form state

### Requirement 7: Preferences Application

**User Story:** As a user, I want my preferences to be applied consistently across the entire application, so that my customizations are reflected everywhere.

#### Acceptance Criteria

1. WHEN the application loads, THE User_Preferences_System SHALL fetch and apply the user's display preferences
2. THE User_Preferences_System SHALL apply date format preferences to all date displays using a centralized formatting function
3. THE User_Preferences_System SHALL apply number format preferences to all currency and number displays using a centralized formatting function
4. THE User_Preferences_System SHALL apply theme preferences by setting the appropriate CSS class on the document root
5. WHEN preferences are updated, THE User_Preferences_System SHALL update the application state without requiring a page refresh
