# Requirements Document

## Introduction

This document specifies the requirements for the Agency Dashboard feature (v0.9.15). The Agency Dashboard provides real-time operational metrics for the shipping agency division, displaying booking statistics, B/L management status, vessel schedules, and container tracking information. The dashboard replaces the current placeholder implementation with live data from the Agency module tables.

## Glossary

- **Agency_Dashboard**: The main dashboard page for agency role users displaying shipping operations metrics
- **Freight_Booking**: A shipping booking record containing cargo, route, and schedule information
- **Bill_of_Lading**: A legal document issued by a carrier acknowledging receipt of cargo for shipment
- **Shipping_Line**: A company that operates vessels for cargo transportation
- **Vessel_Schedule**: A record of vessel arrival and departure times at ports
- **Booking_Container**: A container associated with a freight booking
- **Data_Fetcher**: Server action that retrieves and aggregates dashboard metrics from the database
- **Cache_System**: In-memory caching mechanism with 5-minute TTL for dashboard data

## Requirements

### Requirement 1: Dashboard Access Control

**User Story:** As a system administrator, I want to restrict dashboard access to authorized roles, so that only agency, owner, and director users can view agency operations data.

#### Acceptance Criteria

1. WHEN a user with role 'agency' accesses the agency dashboard THEN THE Agency_Dashboard SHALL display the full dashboard content
2. WHEN a user with role 'owner' accesses the agency dashboard THEN THE Agency_Dashboard SHALL display the full dashboard content
3. WHEN a user with role 'director' accesses the agency dashboard THEN THE Agency_Dashboard SHALL display the full dashboard content
4. WHEN a user with any other role accesses the agency dashboard THEN THE Agency_Dashboard SHALL redirect the user to the default dashboard
5. WHEN an unauthenticated user accesses the agency dashboard THEN THE Agency_Dashboard SHALL redirect the user to the login page

### Requirement 2: Booking Overview Metrics

**User Story:** As an agency user, I want to see booking statistics at a glance, so that I can monitor the current state of shipping operations.

#### Acceptance Criteria

1. THE Agency_Dashboard SHALL display the count of active bookings with status in ('draft', 'requested', 'confirmed', 'amended')
2. THE Agency_Dashboard SHALL display the count of bookings created in the current month
3. THE Agency_Dashboard SHALL display the count of bookings with status 'requested' as pending confirmations
4. THE Agency_Dashboard SHALL display the count of bookings with status 'completed' and completed_at in the current month
5. WHEN no bookings exist THEN THE Agency_Dashboard SHALL display zero for all booking metrics

### Requirement 3: Shipping Line Statistics

**User Story:** As an agency user, I want to see shipping line information, so that I can understand our carrier relationships and preferences.

#### Acceptance Criteria

1. THE Agency_Dashboard SHALL display the total count of active shipping lines
2. THE Agency_Dashboard SHALL display the name of the most frequently used shipping line based on booking count
3. THE Agency_Dashboard SHALL display the count of preferred shipping lines (is_preferred = true)
4. WHEN no shipping lines exist THEN THE Agency_Dashboard SHALL display zero for counts and "-" for the most used line name

### Requirement 4: Bill of Lading Statistics

**User Story:** As an agency user, I want to see B/L document status, so that I can track documentation progress and identify pending work.

#### Acceptance Criteria

1. THE Agency_Dashboard SHALL display the count of B/Ls with status 'issued' and issued_at in the current month
2. THE Agency_Dashboard SHALL display the count of B/Ls with status in ('draft', 'submitted') as pending issuance
3. THE Agency_Dashboard SHALL display the count of B/Ls with status 'draft'
4. WHEN no B/Ls exist THEN THE Agency_Dashboard SHALL display zero for all B/L metrics

### Requirement 5: Vessel and Container Status

**User Story:** As an agency user, I want to see vessel arrival schedules and container tracking status, so that I can plan operations and monitor shipments.

#### Acceptance Criteria

1. THE Agency_Dashboard SHALL display the count of vessel schedules with scheduled_arrival within the current week
2. THE Agency_Dashboard SHALL display the count of booking containers with status 'shipped' as containers in transit
3. THE Agency_Dashboard SHALL display the count of vessel schedules with status 'scheduled' and scheduled_arrival in the next 7 days as expected arrivals
4. WHEN no vessel schedules exist THEN THE Agency_Dashboard SHALL display zero for vessel metrics
5. WHEN no containers exist THEN THE Agency_Dashboard SHALL display zero for container metrics

### Requirement 6: Recent Activity Display

**User Story:** As an agency user, I want to see recent bookings and B/L activity, so that I can stay informed about the latest operations.

#### Acceptance Criteria

1. THE Agency_Dashboard SHALL display the 5 most recently created bookings with booking_number, customer name, status, and created_at
2. THE Agency_Dashboard SHALL display the 5 most recently issued B/Ls with bl_number, vessel_name, status, and issued_at
3. WHEN displaying recent bookings THEN THE Agency_Dashboard SHALL order them by created_at descending
4. WHEN displaying recent B/Ls THEN THE Agency_Dashboard SHALL order them by issued_at descending
5. WHEN no recent activity exists THEN THE Agency_Dashboard SHALL display an appropriate empty state message

### Requirement 7: Data Caching

**User Story:** As a system architect, I want dashboard data to be cached, so that the dashboard loads quickly and reduces database load.

#### Acceptance Criteria

1. THE Data_Fetcher SHALL cache dashboard metrics with a 5-minute TTL
2. WHEN cached data exists and is not expired THEN THE Data_Fetcher SHALL return cached data without querying the database
3. WHEN cached data is expired or does not exist THEN THE Data_Fetcher SHALL query the database and cache the results
4. THE Data_Fetcher SHALL use the generateCacheKey function with 'agency-dashboard-metrics' prefix and 'agency' role

### Requirement 8: Date and Currency Formatting

**User Story:** As a user, I want dates and numbers to be formatted consistently, so that the dashboard is easy to read and follows Indonesian conventions.

#### Acceptance Criteria

1. WHEN displaying dates THEN THE Agency_Dashboard SHALL use the formatDate function from lib/utils/format.ts
2. WHEN displaying relative times THEN THE Agency_Dashboard SHALL use the formatRelative function from lib/utils/format.ts
3. WHEN displaying currency amounts THEN THE Agency_Dashboard SHALL use the formatCurrency function from lib/utils/format.ts
4. WHEN displaying numeric counts THEN THE Agency_Dashboard SHALL use the formatNumber function from lib/utils/format.ts
5. WHEN a date value is null or undefined THEN THE formatting functions SHALL return "-"

### Requirement 9: Dashboard Layout

**User Story:** As an agency user, I want the dashboard to be well-organized and visually consistent, so that I can quickly find the information I need.

#### Acceptance Criteria

1. THE Agency_Dashboard SHALL display metrics in a responsive grid layout with 4 columns on large screens
2. THE Agency_Dashboard SHALL display metrics in a 2-column layout on medium screens
3. THE Agency_Dashboard SHALL display metrics in a single column on small screens
4. THE Agency_Dashboard SHALL use consistent card styling matching other role dashboards
5. THE Agency_Dashboard SHALL display a page title "Agency Dashboard" and subtitle describing the dashboard purpose
