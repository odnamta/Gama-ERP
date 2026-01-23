# Requirements Document

## Introduction

This document specifies the requirements for the Changelog Feature (v0.82) in GAMA ERP. The system provides a changelog page where users can view updates and new features, helping them stay informed about system improvements. Administrators can manage changelog entries through a dedicated admin interface.

The changelog will be accessible to all authenticated users via a "What's New" menu item in the sidebar, with visual indicators for unread updates.

## Glossary

- **Changelog_Entry**: Database record representing a single update or release note
- **Changelog_Page**: Public-facing page at /changelog displaying all entries in timeline format
- **Admin_Editor**: Administrative interface at /admin/changelog for managing entries
- **Category**: Classification of changelog entry (feature, improvement, bugfix, security)
- **Major_Update**: Flag indicating an important update that should be visually highlighted
- **Last_Viewed_Timestamp**: User's last visit to the changelog, used for notification dot

## Requirements

### Requirement 1: Changelog Entries Table

**User Story:** As a system administrator, I want a database table to store changelog entries, so that I can maintain a history of system updates.

#### Acceptance Criteria

1. THE Database SHALL have a changelog_entries table with columns: id (UUID), version (TEXT), title (TEXT NOT NULL), description (TEXT), category (TEXT DEFAULT 'feature'), is_major (BOOLEAN DEFAULT false), published_at (TIMESTAMPTZ DEFAULT NOW()), created_by (UUID REFERENCES auth.users), created_at (TIMESTAMPTZ), updated_at (TIMESTAMPTZ)
2. THE changelog_entries table SHALL have an index on published_at for efficient ordering
3. THE category column SHALL only accept values: 'feature', 'improvement', 'bugfix', 'security'
4. THE changelog_entries table SHALL have RLS enabled

### Requirement 2: Changelog RLS Policies

**User Story:** As a system administrator, I want proper access control on changelog entries, so that everyone can read but only admins can write.

#### Acceptance Criteria

1. THE changelog_entries table SHALL have an RLS policy allowing all authenticated users to SELECT entries
2. THE changelog_entries table SHALL have an RLS policy allowing only owner, director, and sysadmin roles to INSERT entries
3. THE changelog_entries table SHALL have an RLS policy allowing only owner, director, and sysadmin roles to UPDATE entries
4. THE changelog_entries table SHALL have an RLS policy allowing only owner, director, and sysadmin roles to DELETE entries

### Requirement 3: Changelog Page Display

**User Story:** As a user, I want to view a changelog page, so that I can see what updates have been made to the system.

#### Acceptance Criteria

1. WHEN a user navigates to /changelog THEN the Changelog_Page SHALL display all entries ordered by published_at DESC
2. THE Changelog_Page SHALL group entries by month and year with clear section headers
3. THE Changelog_Page SHALL display for each entry: version, title, description, category badge, and published date
4. THE Changelog_Page SHALL render description content as markdown
5. WHEN an entry has is_major set to true THEN the Changelog_Page SHALL visually highlight that entry

### Requirement 4: Category Badge Display

**User Story:** As a user, I want to see color-coded category badges, so that I can quickly identify the type of update.

#### Acceptance Criteria

1. WHEN displaying a feature category THEN the Changelog_Page SHALL show a blue badge
2. WHEN displaying a bugfix category THEN the Changelog_Page SHALL show a red badge
3. WHEN displaying an improvement category THEN the Changelog_Page SHALL show a green badge
4. WHEN displaying a security category THEN the Changelog_Page SHALL show a yellow badge

### Requirement 5: Sidebar Navigation Integration

**User Story:** As a user, I want to access the changelog from the sidebar, so that I can easily find system updates.

#### Acceptance Criteria

1. THE Navigation SHALL include a "What's New" menu item with SparklesIcon
2. THE "What's New" menu item SHALL be visible to all authenticated users regardless of role
3. THE "What's New" menu item SHALL link to /changelog
4. THE "What's New" menu item SHALL appear in the Help section of the navigation

### Requirement 6: New Updates Notification

**User Story:** As a user, I want to see a notification indicator when there are new updates, so that I know when to check the changelog.

#### Acceptance Criteria

1. THE System SHALL track each user's last changelog view timestamp in localStorage
2. WHEN there are changelog entries newer than the user's last view THEN the Sidebar SHALL display a notification dot on the "What's New" menu item
3. WHEN a user visits /changelog THEN the System SHALL update the last viewed timestamp to current time
4. THE notification dot SHALL be a small colored indicator visible next to the menu item text

### Requirement 7: Admin Changelog Editor

**User Story:** As an administrator, I want to add and manage changelog entries, so that I can keep users informed about updates.

#### Acceptance Criteria

1. WHEN an owner, director, or sysadmin navigates to /admin/changelog THEN the Admin_Editor SHALL display
2. THE Admin_Editor SHALL provide a form with fields: Version, Title, Description (textarea), Category (dropdown), Is Major (checkbox)
3. WHEN the admin submits a valid entry THEN the Admin_Editor SHALL insert the record into changelog_entries
4. THE Admin_Editor SHALL display a list of existing entries with edit and delete options
5. WHEN a non-admin user attempts to access /admin/changelog THEN the System SHALL redirect to their dashboard

### Requirement 8: Initial Changelog Data

**User Story:** As a user, I want to see existing release history, so that I can understand the system's evolution.

#### Acceptance Criteria

1. THE Database SHALL contain an initial entry for v0.33: 'GAMA ERP Launch' with description 'Initial release with Operations, Finance, HR modules' and category 'feature' and is_major true
2. THE Database SHALL contain an initial entry for v0.34: 'Disbursement Module (BKK)' with description 'Complete cash-out tracking with approval workflow' and category 'feature'
3. THE Database SHALL contain an initial entry for v0.35: 'Agency & Customs Roles' with description 'Added support for Agency and Customs departments' and category 'feature'
4. THE Database SHALL contain an initial entry for v0.36: 'User Onboarding Fix' with description 'Fixed issue where new users could not sign up via Google OAuth' and category 'bugfix'

### Requirement 9: Performance Requirements

**User Story:** As a user, I want the changelog page to load quickly, so that I can efficiently check for updates.

#### Acceptance Criteria

1. THE Changelog_Page SHALL load within 2 seconds for the default view
2. THE Changelog_Page SHALL be implemented as a Server Component for optimal performance
3. THE notification dot check SHALL not block page navigation
