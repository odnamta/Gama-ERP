# Requirements Document

## Introduction

This document defines the requirements for a reusable dashboard widget system that allows dashboards to be composed of configurable widgets. The system enables role-based default layouts and future per-user customization, providing a flexible foundation for all dashboard views in the Gama ERP system.

## Glossary

- **Widget**: A self-contained UI component that displays specific data on a dashboard
- **Widget_Type**: Classification of widget rendering style (stat_card, chart, list, table, calendar, progress)
- **Widget_Config**: User-specific configuration for a widget including position, size, and settings
- **Default_Layout**: Pre-configured widget arrangement for a specific role
- **Grid_System**: A 4-column responsive layout system for positioning widgets
- **Data_Source**: A function or view name that provides data for a widget

## Requirements

### Requirement 1: Widget Definition Storage

**User Story:** As a system administrator, I want widget definitions stored in the database, so that new widgets can be added without code changes.

#### Acceptance Criteria

1. THE Database SHALL store widget definitions in a dashboard_widgets table with unique widget_code identifiers
2. WHEN a widget is defined, THE Database SHALL store widget_type, data_source, allowed_roles, and default dimensions
3. THE Database SHALL support widget types: stat_card, chart, list, table, calendar, and progress
4. WHEN a widget is created, THE Database SHALL assign default width (1-4 grid units) and height (1-3 grid units)
5. THE Database SHALL store a settings_schema as JSONB for widget-specific configuration options

### Requirement 2: Role-Based Widget Access

**User Story:** As a user, I want to see only widgets relevant to my role, so that my dashboard shows information I'm authorized to view.

#### Acceptance Criteria

1. WHEN a user accesses the dashboard, THE Widget_System SHALL filter widgets based on the user's role
2. THE Widget_System SHALL support multiple roles per widget via the allowed_roles array
3. WHEN a widget's allowed_roles is empty, THE Widget_System SHALL hide it from all users
4. THE Widget_System SHALL validate role access before rendering any widget

### Requirement 3: Default Widget Layouts

**User Story:** As a new user, I want to see a pre-configured dashboard layout for my role, so that I have a useful starting point without manual setup.

#### Acceptance Criteria

1. WHEN a user has no custom configuration, THE Widget_System SHALL load the default layout for their role
2. THE Default_Layout SHALL specify position_x, position_y, width, and height for each widget
3. THE Widget_System SHALL order widgets by position_y then position_x when rendering
4. WHEN no default layout exists for a role, THE Widget_System SHALL display an empty dashboard

### Requirement 4: User Widget Configuration

**User Story:** As a user, I want to customize my dashboard layout, so that I can arrange widgets according to my preferences.

#### Acceptance Criteria

1. WHEN a user customizes their layout, THE Widget_System SHALL store the configuration in user_widget_configs
2. THE User_Config SHALL override default layout settings for position, size, and visibility
3. WHEN a user saves their layout, THE Widget_System SHALL persist all widget configurations atomically
4. THE Widget_System SHALL allow users to hide widgets by setting is_visible to false
5. WHEN a user resets their layout, THE Widget_System SHALL delete user configurations and revert to defaults

### Requirement 5: Widget Rendering

**User Story:** As a user, I want widgets to render correctly based on their type, so that data is displayed in the most appropriate format.

#### Acceptance Criteria

1. WHEN widget_type is stat_card, THE Widget_Renderer SHALL display a compact card with key metric and optional trend
2. WHEN widget_type is chart, THE Widget_Renderer SHALL display data visualization (bar, line, pie, or funnel)
3. WHEN widget_type is list, THE Widget_Renderer SHALL display scrollable items with action links
4. WHEN widget_type is table, THE Widget_Renderer SHALL display tabular data with sortable columns
5. WHEN widget_type is progress, THE Widget_Renderer SHALL display progress bars or gauges
6. WHEN widget_type is calendar, THE Widget_Renderer SHALL display date-based events

### Requirement 6: Widget Data Fetching

**User Story:** As a user, I want each widget to load its data independently, so that slow widgets don't block the entire dashboard.

#### Acceptance Criteria

1. WHEN a widget renders, THE Widget_System SHALL fetch data using the widget's data_source function
2. WHILE data is loading, THE Widget_System SHALL display a loading skeleton
3. IF data fetching fails, THEN THE Widget_System SHALL display an error state with retry option
4. THE Widget_System SHALL support refreshing individual widgets without reloading the page
5. WHEN widget settings change, THE Widget_System SHALL re-fetch data with new parameters

### Requirement 7: Responsive Grid Layout

**User Story:** As a user, I want the dashboard to adapt to my screen size, so that I can use it on different devices.

#### Acceptance Criteria

1. THE Grid_System SHALL use a 4-column layout on desktop screens
2. WHEN screen width is below tablet breakpoint, THE Grid_System SHALL collapse to 2 columns
3. WHEN screen width is below mobile breakpoint, THE Grid_System SHALL collapse to 1 column
4. THE Grid_System SHALL allow widgets to span multiple columns (1-4) and rows (1-3)
5. THE Grid_System SHALL maintain widget aspect ratios when resizing

### Requirement 8: Default Widget Catalog

**User Story:** As a system administrator, I want a pre-defined set of widgets, so that users have useful dashboard components available immediately.

#### Acceptance Criteria

1. THE Widget_Catalog SHALL include finance widgets: Cash Position, AR Summary, AP Summary, AR Aging Chart, Revenue Trend, Pending Approvals
2. THE Widget_Catalog SHALL include sales widgets: Pipeline Summary, Pipeline Funnel, Active Quotations, Win Rate
3. THE Widget_Catalog SHALL include engineering widgets: Engineering Workload, Pending Assessments
4. THE Widget_Catalog SHALL include operations widgets: Active Jobs, Jobs List, Delivery Schedule, Cost Tracker, Pending Actions
5. THE Widget_Catalog SHALL include HR widgets: Attendance Today, Leave Requests, Skills Gap
6. THE Widget_Catalog SHALL include executive widgets: Company Health, Department Scores, KPI Summary
