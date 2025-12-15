# Requirements Document

## Introduction

This feature implements a dedicated Sales & Marketing Dashboard for sales/marketing users in Gama ERP. The dashboard provides a focused view of the quotation pipeline, win/loss rates, revenue targets, and customer acquisition metrics - giving sales users the tools they need to track opportunities and optimize their conversion rates.

## Glossary

- **Sales User**: A user with role='sales' who handles RFQs, quotations, and customer relationships
- **Pipeline**: The flow of Proforma Job Orders through various statuses (draft → pending_approval → approved → converted/rejected)
- **Pipeline Value**: Total estimated revenue of all active opportunities in the pipeline
- **Win Rate**: Percentage of decided PJOs that were converted to JOs (converted / (converted + rejected) × 100)
- **Stale PJO**: A PJO that has remained in draft or pending status longer than expected thresholds
- **Conversion Rate**: Percentage of PJOs that successfully move from one stage to the next
- **Follow-up**: An action required on a PJO to move it forward in the pipeline

## Requirements

### Requirement 1

**User Story:** As a sales user, I want to see a dashboard tailored to my work, so that I can focus on pipeline management and conversion tracking.

#### Acceptance Criteria

1. WHEN a sales user logs in THEN the System SHALL display the Sales Dashboard instead of the main dashboard
2. WHEN displaying the Sales Dashboard THEN the System SHALL show KPI cards for pipeline value, win rate, active PJOs count, and new customers count
3. WHEN displaying pipeline value THEN the System SHALL show the total estimated revenue and count of opportunities
4. WHEN displaying win rate THEN the System SHALL compare the current rate against a target percentage

### Requirement 2

**User Story:** As a sales user, I want to see a visual quotation pipeline, so that I can understand the distribution of opportunities across stages.

#### Acceptance Criteria

1. WHEN displaying the quotation pipeline THEN the System SHALL show PJOs grouped by status (draft, pending_approval, approved, converted, rejected)
2. WHEN displaying a pipeline stage THEN the System SHALL show the count of PJOs and total estimated revenue value for that stage
3. WHEN displaying the pipeline THEN the System SHALL show conversion rates between consecutive stages
4. WHEN displaying the pipeline THEN the System SHALL calculate overall conversion rate from draft to converted

### Requirement 3

**User Story:** As a sales user, I want to see pending follow-ups, so that I can take action on opportunities that need attention.

#### Acceptance Criteria

1. WHEN displaying pending follow-ups THEN the System SHALL show PJOs in draft or pending_approval status
2. WHEN displaying a follow-up row THEN the System SHALL show PJO number, customer name, value, status, and days in current status
3. WHEN displaying follow-ups THEN the System SHALL sort by days in current status (oldest first)
4. WHEN a user clicks an action button on a follow-up THEN the System SHALL navigate to the PJO detail page

### Requirement 4

**User Story:** As a sales user, I want stale PJOs highlighted, so that I can prioritize opportunities at risk of going cold.

#### Acceptance Criteria

1. WHEN a PJO has been in draft status for more than 5 days THEN the System SHALL display a yellow warning indicator
2. WHEN a PJO has been in draft status for more than 7 days THEN the System SHALL display a red alert indicator
3. WHEN a PJO has been in pending_approval status for more than 3 days THEN the System SHALL display a yellow warning indicator
4. WHEN there are stale PJOs THEN the System SHALL show a count in the pending follow-ups section header

### Requirement 5

**User Story:** As a sales user, I want to see top customers by value, so that I can focus on high-value relationships.

#### Acceptance Criteria

1. WHEN displaying top customers THEN the System SHALL show customers ranked by total PJO value in the selected period
2. WHEN displaying a customer row THEN the System SHALL show rank, customer name, total value, job count, and average value per job
3. WHEN displaying a customer row THEN the System SHALL show a trend indicator comparing to the previous period
4. WHEN a user clicks on a customer row THEN the System SHALL navigate to the customer detail page

### Requirement 6

**User Story:** As a sales user, I want to see win/loss analysis, so that I can understand conversion patterns and improve my approach.

#### Acceptance Criteria

1. WHEN displaying win/loss analysis THEN the System SHALL show counts and values for won, lost, and pending PJOs
2. WHEN displaying win/loss analysis THEN the System SHALL show a visual bar representation of the distribution
3. WHEN displaying win/loss analysis THEN the System SHALL show percentages for each category
4. WHEN PJOs have rejection reasons THEN the System SHALL display common loss reasons with counts

### Requirement 7

**User Story:** As a sales user, I want to filter dashboard data by time period, so that I can analyze performance across different timeframes.

#### Acceptance Criteria

1. WHEN displaying the Sales Dashboard THEN the System SHALL show a period filter dropdown defaulting to "This Month"
2. WHEN a user selects a period filter THEN the System SHALL update all dashboard components with data from that period
3. WHEN filtering by period THEN the System SHALL support options for This Week, This Month, This Quarter, This Year, and Custom Range
4. WHEN a user selects Custom Range THEN the System SHALL display date picker inputs for start and end dates

### Requirement 8

**User Story:** As a sales user, I want the sidebar navigation to show only relevant menu items, so that I don't see options I can't use.

#### Acceptance Criteria

1. WHEN a sales user views the sidebar THEN the System SHALL show Dashboard, Customers, Projects, and PJOs menu items
2. WHEN a sales user views the sidebar THEN the System SHALL hide menu items for Job Orders, Invoices, and system administration
3. WHEN a sales user attempts to access a restricted page via URL THEN the System SHALL redirect to the Sales Dashboard
