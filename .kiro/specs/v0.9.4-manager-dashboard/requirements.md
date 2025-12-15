# Requirements Document

## Introduction

This document specifies the requirements for the Manager Dashboard feature in Gama ERP. The Manager Dashboard provides comprehensive oversight of business operations for users with the `manager` role (Feri, Hutami, Reza). It includes full P&L visibility, pending approvals queue with inline actions, budget alerts, and team performance metrics.

## Glossary

- **Manager_Dashboard**: The specialized dashboard view for users with the `manager` role
- **P&L_Summary**: Profit and Loss summary showing revenue, costs by category, gross profit, and margin
- **Approval_Queue**: List of PJOs pending manager approval with inline approve/reject actions
- **Budget_Alert**: Cost items that have exceeded their estimated budget
- **Team_Performance**: Metrics showing performance by team member
- **MTD**: Month-to-date cumulative metrics
- **YTD**: Year-to-date cumulative metrics
- **Variance**: Percentage change compared to previous period
- **Margin**: Profit as a percentage of revenue ((revenue - cost) / revenue * 100)

## Requirements

### Requirement 1

**User Story:** As a manager, I want to see a dedicated dashboard when I log in, so that I can quickly assess overall business performance.

#### Acceptance Criteria

1. WHEN a user with role 'manager' accesses the dashboard THEN the Manager_Dashboard SHALL render the manager-specific view
2. WHEN the Manager_Dashboard loads THEN the Manager_Dashboard SHALL display a welcome message with the manager's name
3. WHEN the Manager_Dashboard loads THEN the Manager_Dashboard SHALL show data for the current month by default
4. WHEN the Manager_Dashboard encounters a data fetch error THEN the Manager_Dashboard SHALL display an error message and retry option

### Requirement 2

**User Story:** As a manager, I want to see key financial KPIs at a glance, so that I can quickly understand business health.

#### Acceptance Criteria

1. WHEN displaying KPI cards THEN the Manager_Dashboard SHALL show Revenue MTD, Costs MTD, and Profit MTD with currency formatting
2. WHEN displaying KPI cards THEN the Manager_Dashboard SHALL show percentage variance compared to last month
3. WHEN displaying Profit MTD THEN the Manager_Dashboard SHALL show the margin percentage
4. WHEN displaying operational KPIs THEN the Manager_Dashboard SHALL show Pending Approvals count, Budget Exceeded count, and Jobs In Progress count
5. WHEN Pending Approvals count is greater than zero THEN the Manager_Dashboard SHALL display a "Review Now" action link
6. WHEN Budget Exceeded count is greater than zero THEN the Manager_Dashboard SHALL display a warning indicator

### Requirement 3

**User Story:** As a manager, I want to see a detailed P&L summary with cost breakdown, so that I can analyze financial performance by category.

#### Acceptance Criteria

1. WHEN displaying P&L summary THEN the Manager_Dashboard SHALL show a table with columns: Category, This Month, Last Month, Variance, YTD
2. WHEN displaying P&L summary THEN the Manager_Dashboard SHALL show Revenue as the first row
3. WHEN displaying costs THEN the Manager_Dashboard SHALL group costs by category (Trucking, Port, Crew, Fuel, Other)
4. WHEN displaying P&L summary THEN the Manager_Dashboard SHALL show Total Cost as a subtotal row
5. WHEN displaying P&L summary THEN the Manager_Dashboard SHALL show Gross Profit and Margin % as the final rows
6. WHEN calculating variance THEN the Manager_Dashboard SHALL compute percentage change from last month
7. WHEN revenue is zero THEN the Manager_Dashboard SHALL display margin as 0% instead of NaN or infinity

### Requirement 4

**User Story:** As a manager, I want to see and act on PJOs pending approval, so that I can review and approve them efficiently.

#### Acceptance Criteria

1. WHEN displaying the approval queue THEN the Manager_Dashboard SHALL show all PJOs with status 'pending_approval'
2. WHEN displaying approval queue items THEN the Manager_Dashboard SHALL show PJO number, customer name, revenue, estimated profit, and margin percentage
3. WHEN displaying approval queue items THEN the Manager_Dashboard SHALL show inline approve (✓) and reject (✗) action buttons
4. WHEN the manager clicks the approve button THEN the Manager_Dashboard SHALL update the PJO status to 'approved'
5. WHEN the manager clicks the reject button THEN the Manager_Dashboard SHALL prompt for rejection reason and update status to 'rejected'
6. WHEN the approval queue is empty THEN the Manager_Dashboard SHALL display a message indicating no pending approvals
7. WHEN multiple PJOs are pending THEN the Manager_Dashboard SHALL display an "Approve All" batch action button

### Requirement 5

**User Story:** As a manager, I want to see budget alerts for cost overruns, so that I can review and address them.

#### Acceptance Criteria

1. WHEN displaying budget alerts THEN the Manager_Dashboard SHALL show all cost items with status 'exceeded'
2. WHEN displaying budget alert items THEN the Manager_Dashboard SHALL show PJO number, cost item category, budget amount, actual amount, and over-by percentage
3. WHEN displaying budget alerts THEN the Manager_Dashboard SHALL sort items by variance percentage descending (highest overrun first)
4. WHEN the manager clicks Review on a budget alert THEN the Manager_Dashboard SHALL navigate to the PJO detail page
5. WHEN no budget alerts exist THEN the Manager_Dashboard SHALL display a success message indicating all items within budget

### Requirement 6

**User Story:** As a manager, I want to see team performance metrics, so that I can monitor productivity.

#### Acceptance Criteria

1. WHEN displaying team performance THEN the Manager_Dashboard SHALL show a table with team members and their metrics
2. WHEN displaying team performance THEN the Manager_Dashboard SHALL show columns: Team Member, Role, PJOs Created, JOs Completed, On-Time Rate
3. WHEN a team member has role 'admin' or 'sales' THEN the Manager_Dashboard SHALL show PJOs Created metric
4. WHEN a team member has role 'ops' THEN the Manager_Dashboard SHALL show JOs Completed and On-Time Rate metrics
5. WHEN displaying team performance THEN the Manager_Dashboard SHALL show a performance rating indicator (1-5 stars based on metrics)

### Requirement 7

**User Story:** As a manager, I want to filter dashboard data by time period, so that I can analyze trends over different timeframes.

#### Acceptance Criteria

1. WHEN the Manager_Dashboard loads THEN the Manager_Dashboard SHALL display a period filter dropdown in the header
2. WHEN the manager selects a period THEN the Manager_Dashboard SHALL refresh all metrics for the selected period
3. WHEN period changes THEN the Manager_Dashboard SHALL show loading state while fetching new data
4. WHEN displaying period data THEN the Manager_Dashboard SHALL update the comparison column to show equivalent previous period

### Requirement 8

**User Story:** As a manager, I want quick navigation to detailed views, so that I can drill down into specific areas.

#### Acceptance Criteria

1. WHEN the manager clicks on a PJO number THEN the Manager_Dashboard SHALL navigate to the PJO detail page
2. WHEN the manager clicks on a team member THEN the Manager_Dashboard SHALL navigate to a filtered view of their work
3. WHEN the manager clicks on Revenue or Costs in P&L THEN the Manager_Dashboard SHALL navigate to the relevant report page

