# Requirements Document

## Introduction

This feature connects the existing Assets Dashboard to real Equipment module data. The dashboard currently exists at `app/(main)/dashboard/assets/` but uses mock/hardcoded data. We need to create a server-side data fetcher with caching and update the client component to display real metrics from the database.

## Glossary

- **Assets_Dashboard**: The dashboard page displaying equipment metrics, maintenance alerts, and utilization data
- **Data_Fetcher**: Server-side function that queries Supabase and returns aggregated metrics with caching
- **Asset**: Equipment item tracked in the `assets` table (vehicles, heavy equipment, tools)
- **Maintenance_Alert**: Upcoming or overdue maintenance item from the `upcoming_maintenance` view
- **Utilization_Rate**: Percentage of active assets currently assigned to jobs
- **Category_Summary**: Count of assets grouped by asset category

## Requirements

### Requirement 1: Equipment Summary Metrics

**User Story:** As an operations user, I want to see accurate equipment counts by status, so that I can understand fleet availability at a glance.

#### Acceptance Criteria

1. THE Assets_Dashboard SHALL display the total count of all assets from the `assets` table
2. THE Assets_Dashboard SHALL display the count of active assets where status is 'available' or 'in_use'
3. THE Assets_Dashboard SHALL display the count of assets under maintenance where status is 'maintenance' or 'repair'
4. THE Assets_Dashboard SHALL display the count of idle assets where status is 'available' AND assigned_to_job_id IS NULL
5. THE Assets_Dashboard SHALL display the count of disposed assets where status is 'retired' or 'sold'

### Requirement 2: Category Breakdown

**User Story:** As an operations user, I want to see equipment counts by category, so that I can understand the composition of our fleet.

#### Acceptance Criteria

1. THE Data_Fetcher SHALL retrieve asset counts grouped by category from `asset_categories` table
2. THE Assets_Dashboard SHALL display category name and count for each category with assets
3. WHEN a category has zero assets THEN the Assets_Dashboard SHALL exclude it from display

### Requirement 3: Maintenance Status Display

**User Story:** As an operations user, I want to see maintenance alerts and status, so that I can prioritize equipment servicing.

#### Acceptance Criteria

1. THE Data_Fetcher SHALL retrieve overdue maintenance items from `upcoming_maintenance` view where status is 'overdue'
2. THE Data_Fetcher SHALL retrieve due-soon maintenance items from `upcoming_maintenance` view where status is 'due_soon'
3. THE Data_Fetcher SHALL retrieve recently completed maintenance from `maintenance_records` within the last 7 days
4. THE Assets_Dashboard SHALL display maintenance alerts with asset name, asset code, maintenance type, and due date
5. WHEN maintenance is overdue THEN the Assets_Dashboard SHALL display the number of days overdue

### Requirement 4: Utilization Metrics

**User Story:** As an operations user, I want to see asset utilization metrics, so that I can optimize fleet deployment.

#### Acceptance Criteria

1. THE Data_Fetcher SHALL calculate the count of assets currently assigned to jobs (assigned_to_job_id IS NOT NULL)
2. THE Data_Fetcher SHALL calculate the count of idle/available assets (status = 'available' AND assigned_to_job_id IS NULL)
3. THE Data_Fetcher SHALL calculate utilization rate as (assigned count / total active count) * 100
4. THE Assets_Dashboard SHALL display utilization rate as a percentage

### Requirement 5: Recent Activity Feed

**User Story:** As an operations user, I want to see recent equipment activity, so that I can stay informed about fleet changes.

#### Acceptance Criteria

1. THE Data_Fetcher SHALL retrieve the 5 most recent maintenance records ordered by maintenance_date descending
2. THE Data_Fetcher SHALL retrieve the 5 most recent asset assignments from `asset_assignments` table
3. THE Data_Fetcher SHALL retrieve the 5 most recent status changes from `asset_status_history` table
4. THE Assets_Dashboard SHALL display recent activity items with timestamp and description

### Requirement 6: Data Caching

**User Story:** As a system, I want to cache dashboard data, so that the page loads quickly without excessive database queries.

#### Acceptance Criteria

1. THE Data_Fetcher SHALL use 5-minute caching following the pattern from `lib/dashboard-cache.ts`
2. THE Data_Fetcher SHALL generate cache keys using `generateCacheKey` function
3. THE Data_Fetcher SHALL use `getOrFetch` for cached data retrieval
4. WHEN cache expires THEN the Data_Fetcher SHALL refresh data from database

### Requirement 7: Server-Side Data Loading

**User Story:** As a developer, I want data loaded server-side, so that the page renders with data immediately.

#### Acceptance Criteria

1. THE page.tsx SHALL fetch dashboard data server-side before rendering
2. THE page.tsx SHALL pass fetched data as props to the client component
3. THE client component SHALL NOT fetch data client-side on mount
4. IF data fetching fails THEN the Assets_Dashboard SHALL display appropriate error state

### Requirement 8: Operations-Safe Data

**User Story:** As a system administrator, I want to ensure no revenue/profit data is exposed, so that operations roles cannot see financial information.

#### Acceptance Criteria

1. THE Data_Fetcher SHALL NOT query or return any revenue, profit, or invoice data
2. THE Assets_Dashboard SHALL NOT display any financial metrics beyond maintenance costs
3. THE Data_Fetcher SHALL only return operational metrics (counts, statuses, dates)
