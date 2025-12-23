# Requirements Document

## Introduction

This document defines the requirements for the Executive Dashboard - KPI Overview feature (v0.61). The feature provides a comprehensive executive dashboard showing key performance indicators (KPIs) across all business functions with real-time data visualization. Executives need a single view to monitor business health, identify trends, and make strategic decisions without diving into individual modules.

## Glossary

- **KPI**: Key Performance Indicator - a measurable value that demonstrates how effectively the company is achieving key business objectives
- **Dashboard**: A visual display of the most important information needed to achieve objectives, consolidated on a single screen
- **KPI_Calculator**: The system component responsible for computing KPI values from source data
- **KPI_Card**: A visual widget displaying a single KPI with its current value, target, trend, and status
- **Dashboard_Layout_Manager**: The system component that manages widget positioning and user customization
- **Trend_Analyzer**: The system component that calculates period-over-period changes and trends
- **MTD**: Month-to-Date - cumulative value from the first day of the current month to the current date
- **QTD**: Quarter-to-Date - cumulative value from the first day of the current quarter to the current date
- **YTD**: Year-to-Date - cumulative value from the first day of the current year to the current date
- **DSO**: Days Sales Outstanding - average number of days to collect payment after a sale
- **TRIR**: Total Recordable Incident Rate - safety metric measuring workplace incidents
- **LTI**: Lost Time Injury - workplace injury resulting in time away from work

## Requirements

### Requirement 1: KPI Definition Management

**User Story:** As an administrator, I want to define and configure KPIs, so that the dashboard displays relevant metrics for the business.

#### Acceptance Criteria

1. THE KPI_Definition_Manager SHALL store KPI definitions with code, name, description, and category
2. WHEN a KPI is created, THE KPI_Definition_Manager SHALL assign a calculation type from: sum, average, count, ratio, percentage, or custom
3. THE KPI_Definition_Manager SHALL support unit types: currency, percent, number, days, and hours
4. WHEN a KPI has target_type 'higher_better', THE KPI_Calculator SHALL indicate success when actual exceeds target
5. WHEN a KPI has target_type 'lower_better', THE KPI_Calculator SHALL indicate success when actual is below target
6. THE KPI_Definition_Manager SHALL allow role-based visibility configuration for each KPI

### Requirement 2: KPI Value Calculation

**User Story:** As an executive, I want KPI values calculated automatically from source data, so that I see accurate real-time metrics.

#### Acceptance Criteria

1. WHEN calculating a KPI value, THE KPI_Calculator SHALL use the configured data source and calculation type
2. THE KPI_Calculator SHALL support date range parameters for MTD, QTD, YTD, and custom periods
3. WHEN a custom_query is defined, THE KPI_Calculator SHALL execute it with the provided date parameters
4. THE KPI_Calculator SHALL return zero when no data exists for the specified period
5. WHEN calculating ratio KPIs, THE KPI_Calculator SHALL handle division by zero gracefully by returning zero

### Requirement 3: KPI Target Management

**User Story:** As a manager, I want to set targets for KPIs by period, so that performance can be measured against goals.

#### Acceptance Criteria

1. THE KPI_Target_Manager SHALL store targets by KPI, period type (monthly, quarterly, yearly), and period
2. WHEN a target is set, THE KPI_Target_Manager SHALL validate that target_value is a positive number
3. THE KPI_Target_Manager SHALL support optional stretch_target values
4. WHEN no period-specific target exists, THE KPI_Calculator SHALL use the default_target from KPI definition

### Requirement 4: KPI Status Determination

**User Story:** As an executive, I want to see visual status indicators for each KPI, so that I can quickly identify areas needing attention.

#### Acceptance Criteria

1. WHEN a KPI with target_type 'higher_better' achieves 100% or more of target, THE Status_Evaluator SHALL return status 'exceeded'
2. WHEN a KPI with target_type 'higher_better' achieves 90-99% of target, THE Status_Evaluator SHALL return status 'on_track'
3. WHEN a KPI with target_type 'higher_better' achieves 70-89% of target, THE Status_Evaluator SHALL return status 'warning'
4. WHEN a KPI with target_type 'higher_better' achieves below 70% of target, THE Status_Evaluator SHALL return status 'critical'
5. WHEN a KPI with target_type 'lower_better' is at or below target, THE Status_Evaluator SHALL return status 'exceeded'
6. WHEN a KPI with target_type 'lower_better' exceeds target by up to 10%, THE Status_Evaluator SHALL return status 'on_track'
7. WHEN a KPI with target_type 'lower_better' exceeds target by 10-30%, THE Status_Evaluator SHALL return status 'warning'
8. WHEN a KPI with target_type 'lower_better' exceeds target by more than 30%, THE Status_Evaluator SHALL return status 'critical'

### Requirement 5: Trend Analysis

**User Story:** As an executive, I want to see how KPIs compare to previous periods, so that I can understand performance trends.

#### Acceptance Criteria

1. WHEN displaying a KPI, THE Trend_Analyzer SHALL calculate the change from the previous comparable period
2. THE Trend_Analyzer SHALL calculate change_percentage as ((current - previous) / previous) * 100
3. WHEN previous value is zero, THE Trend_Analyzer SHALL return zero for change_percentage
4. WHEN change_percentage is between -2% and 2%, THE Trend_Analyzer SHALL indicate trend as 'stable'
5. WHEN change_percentage is greater than 2%, THE Trend_Analyzer SHALL indicate trend as 'up'
6. WHEN change_percentage is less than -2%, THE Trend_Analyzer SHALL indicate trend as 'down'

### Requirement 6: Financial KPIs Display

**User Story:** As an executive, I want to see financial KPIs including revenue, profit, and receivables, so that I can monitor financial health.

#### Acceptance Criteria

1. THE Dashboard SHALL display Revenue MTD calculated from completed job orders
2. THE Dashboard SHALL display Gross Profit MTD as total_revenue minus total_cost from completed job orders
3. THE Dashboard SHALL display Profit Margin as (gross_profit / revenue) * 100
4. THE Dashboard SHALL display AR Outstanding as sum of unpaid invoice amounts
5. THE Dashboard SHALL display AR Overdue as sum of invoice amounts past due date
6. THE Dashboard SHALL display DSO calculated from average collection time

### Requirement 7: Sales KPIs Display

**User Story:** As an executive, I want to see sales pipeline KPIs, so that I can monitor business development performance.

#### Acceptance Criteria

1. THE Dashboard SHALL display Pipeline Value as sum of active quotation values
2. THE Dashboard SHALL display Quotations MTD as count of quotations created in current month
3. THE Dashboard SHALL display Win Rate as (won quotations / total decided quotations) * 100
4. THE Dashboard SHALL display Average Deal Size from won quotations
5. THE Dashboard SHALL display a Sales Funnel showing quotation counts and values by stage

### Requirement 8: Operations KPIs Display

**User Story:** As an executive, I want to see operational KPIs, so that I can monitor job execution performance.

#### Acceptance Criteria

1. THE Dashboard SHALL display Active Jobs count from job_orders with in_progress status
2. THE Dashboard SHALL display Jobs Completed MTD from job_orders completed in current month
3. THE Dashboard SHALL display On-Time Delivery Rate as percentage of jobs completed by target date
4. THE Dashboard SHALL display Equipment Utilization from equipment assignment data

### Requirement 9: HSE KPIs Display

**User Story:** As an executive, I want to see health, safety, and environment KPIs, so that I can monitor workplace safety.

#### Acceptance Criteria

1. THE Dashboard SHALL display Days Without LTI calculated from last lost-time incident date
2. THE Dashboard SHALL display TRIR calculated from incident records
3. THE Dashboard SHALL display Near Misses MTD count from incident reports
4. THE Dashboard SHALL display Training Compliance percentage from training records

### Requirement 10: Dashboard Layout Customization

**User Story:** As an executive, I want to customize my dashboard layout, so that I can prioritize the KPIs most relevant to me.

#### Acceptance Criteria

1. THE Dashboard_Layout_Manager SHALL allow users to add, remove, and reposition widgets
2. THE Dashboard_Layout_Manager SHALL persist layout configurations per user
3. WHEN a user has no saved layout, THE Dashboard_Layout_Manager SHALL display the default layout for their role
4. THE Dashboard_Layout_Manager SHALL support widget types: kpi_card, chart, table, funnel, gauge, and list
5. WHEN a layout is saved, THE Dashboard_Layout_Manager SHALL store widget positions with x, y, width, and height

### Requirement 11: Period Selection

**User Story:** As an executive, I want to select different time periods for KPI analysis, so that I can compare performance across timeframes.

#### Acceptance Criteria

1. THE Dashboard SHALL provide period selection options: MTD, QTD, YTD, and custom date range
2. WHEN period is changed, THE Dashboard SHALL recalculate all KPI values for the selected period
3. WHEN custom date range is selected, THE Dashboard SHALL validate that start_date is before end_date
4. THE Dashboard SHALL display the selected period prominently in the header

### Requirement 12: KPI Trend Charts

**User Story:** As an executive, I want to see historical trend charts for KPIs, so that I can visualize performance over time.

#### Acceptance Criteria

1. THE Dashboard SHALL display a 12-month trend chart for revenue and profit
2. WHEN displaying trend data, THE Chart_Renderer SHALL show monthly data points
3. THE Chart_Renderer SHALL support line charts for trend visualization
4. THE Chart_Renderer SHALL display legend identifying each data series

### Requirement 13: Role-Based Access Control

**User Story:** As an administrator, I want to control which KPIs each role can see, so that sensitive data is appropriately restricted.

#### Acceptance Criteria

1. THE Dashboard SHALL only display KPIs where the user's role is in visible_to_roles
2. WHEN a user with 'owner' role accesses the dashboard, THE Dashboard SHALL display all KPIs
3. WHEN a user with 'finance' role accesses the dashboard, THE Dashboard SHALL display only financial KPIs
4. WHEN a user with 'sales' role accesses the dashboard, THE Dashboard SHALL display only sales KPIs
5. WHEN a user with 'ops' role accesses the dashboard, THE Dashboard SHALL display only operational KPIs

### Requirement 14: KPI Snapshot History

**User Story:** As an executive, I want historical KPI snapshots stored, so that I can analyze performance over time.

#### Acceptance Criteria

1. THE KPI_Snapshot_Manager SHALL store daily snapshots of KPI values
2. WHEN a snapshot is created, THE KPI_Snapshot_Manager SHALL record actual_value, target_value, and status
3. THE KPI_Snapshot_Manager SHALL calculate and store change_value and change_percentage from previous snapshot
4. THE KPI_Snapshot_Manager SHALL prevent duplicate snapshots for the same KPI, date, and period_type

### Requirement 15: Dashboard Export

**User Story:** As an executive, I want to export dashboard data, so that I can share KPI information in reports.

#### Acceptance Criteria

1. THE Dashboard SHALL provide an export function for current KPI values
2. WHEN export is requested, THE Export_Manager SHALL generate data in a structured format
3. THE Export_Manager SHALL include KPI name, current value, target, status, and trend in exports
