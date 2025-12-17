# Requirements Document

## Introduction

The Role Preview Feature allows the Owner to temporarily view the system as another role without creating test users. This enables testing and verification of role-based access controls directly from the Owner dashboard. The preview affects only the UI presentation (sidebar, dashboard, data visibility) while maintaining actual database permissions and audit trail integrity.

## Glossary

- **Owner**: The highest-privilege user role with full system access
- **Preview Mode**: A temporary client-side state where the Owner views the system as a different role
- **Effective Role**: The role used for UI rendering - either the preview role (if active) or the actual user role
- **Preview Banner**: A visual indicator showing that preview mode is active
- **Role Dropdown**: A UI control allowing the Owner to select which role to preview

## Requirements

### Requirement 1

**User Story:** As an Owner, I want to select a role to preview from a dropdown menu, so that I can see the system as that role would see it.

#### Acceptance Criteria

1. WHEN the Owner views the Owner Dashboard THEN the System SHALL display a "Preview as" dropdown in the dashboard header
2. WHEN the Owner clicks the preview dropdown THEN the System SHALL display all available roles (Owner, Admin, Manager, Finance, Sales, Ops, Viewer)
3. WHEN the Owner selects a role from the dropdown THEN the System SHALL immediately apply that role's view to the UI
4. WHEN a non-Owner user views any dashboard THEN the System SHALL hide the preview dropdown control

### Requirement 2

**User Story:** As an Owner in preview mode, I want to see a clear indicator that I'm in preview mode, so that I don't confuse the preview with my actual permissions.

#### Acceptance Criteria

1. WHEN preview mode is active THEN the System SHALL display a yellow warning banner at the top of the page
2. WHEN the preview banner is displayed THEN the System SHALL show the text "PREVIEW MODE: Viewing as [RoleName]"
3. WHEN the preview banner is displayed THEN the System SHALL include an "Exit Preview" button
4. WHEN the Owner clicks "Exit Preview" THEN the System SHALL return to the Owner's actual view
5. WHEN preview mode is not active THEN the System SHALL hide the preview banner

### Requirement 3

**User Story:** As an Owner in preview mode, I want the sidebar navigation to reflect the previewed role, so that I can verify menu visibility for that role.

#### Acceptance Criteria

1. WHEN preview mode is active THEN the System SHALL filter sidebar menu items based on the effective role
2. WHEN preview mode changes THEN the System SHALL immediately update the sidebar navigation
3. WHEN preview mode exits THEN the System SHALL restore the Owner's full sidebar navigation

### Requirement 4

**User Story:** As an Owner in preview mode, I want to see the dashboard that the previewed role would see, so that I can verify dashboard content.

#### Acceptance Criteria

1. WHEN preview mode is active THEN the System SHALL display the dashboard corresponding to the effective role
2. WHEN previewing as Finance THEN the System SHALL display the Finance Dashboard
3. WHEN previewing as Sales THEN the System SHALL display the Sales Dashboard
4. WHEN previewing as Ops THEN the System SHALL display the Ops Dashboard
5. WHEN previewing as Admin THEN the System SHALL display the Admin Dashboard
6. WHEN previewing as Manager THEN the System SHALL display the Manager Dashboard

### Requirement 5

**User Story:** As an Owner in preview mode, I want data visibility to match the previewed role, so that I can verify what data each role can access.

#### Acceptance Criteria

1. WHEN preview mode is active THEN the System SHALL apply the effective role's data visibility rules to UI components
2. WHEN previewing a role without revenue access THEN the System SHALL hide revenue-related data
3. WHEN previewing a role without profit access THEN the System SHALL hide profit-related data
4. WHEN preview mode exits THEN the System SHALL restore full data visibility

### Requirement 6

**User Story:** As an Owner, I want the preview state to be temporary and client-side only, so that it doesn't affect actual permissions or persist unexpectedly.

#### Acceptance Criteria

1. WHEN preview mode is set THEN the System SHALL store the preview role in React context only
2. WHEN the page refreshes THEN the System SHALL clear the preview state and return to Owner view
3. WHEN the user logs out THEN the System SHALL clear the preview state
4. WHEN preview mode is active THEN the System SHALL maintain actual database permissions via RLS
5. WHEN preview mode is active THEN the System SHALL log audit events under the Owner's actual identity

### Requirement 7

**User Story:** As a system administrator, I want the preview feature to be secure, so that only Owners can use it and it cannot be exploited.

#### Acceptance Criteria

1. WHEN a non-Owner attempts to set a preview role THEN the System SHALL reject the action
2. WHEN preview mode is active THEN the System SHALL block critical actions that could cause confusion
3. WHEN the preview context is accessed THEN the System SHALL verify the user's actual role is Owner before allowing preview
