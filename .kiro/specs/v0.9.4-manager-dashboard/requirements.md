# Requirements Document

## Introduction

This document specifies the requirements for the Manager Dashboard feature in Gama ERP. The Manager Dashboard provides comprehensive oversight of business operations, including profit & loss reporting, approval workflows, team performance metrics, and executive-level KPIs. This dashboard is designed for users with the `manager` role who need visibility across all departments and the ability to approve PJOs.

## Glossary

- **Manager_Dashboard**: The specialized dashboard view for users with the `manager` role
- **P&L_Report**: Profit and Loss report showing revenue, costs, and margins
- **Approval_Queue**: List of PJOs pending manager approval
- **Team_Performance**: Metrics showing performance by department/user
- **Period_Comparison**: Comparison of metrics between current and previous periods
- **Margin**: Profit as a percentage of revenue ((revenue - cost) / revenue * 100)
- **YTD**: Year-to-date cumulative metrics
- **MTD**: Month-to-date cumulative metrics

## Requirements

### Requirement 1

**User Story:** As a manager, I want to see a dedicated dashboard when I log in, so that I can quickly assess overall business performance.

#### Acceptance Criteria

1. WHEN a user with role 'manager' accesses the dashboard THEN the Manager_Dashboard SHALL render the manager-specific view
2. WHEN the Manager_Dashboard loads THEN the Manager_Dashboard SHALL display P&L summary, approval queue, and team performance sections
3. WHEN the Manager_Dashboard loads THEN the Manager_Dashboard SHALL show data for the current month by default
4. WHEN the Manager_Dashboard encounters a data fetch error THEN the Manager_Dashboard SHALL display an error message and retry option

### Requirement 2

**User Story:** As a manager, I want to see profit and loss metrics, so that I can understand the financial health of the business.

#### Acceptance Criteria

1. WHEN displaying P&L metrics THEN the Manager_Dashboard SHALL show total revenue, total costs, gross profit, and margin percentage
2. WHEN calculating gross profit THEN the Manager_Dashboard SHALL compute revenue minus costs
3. WHEN calculating margin THEN the Manager_Dashboard SHALL compute (gross profit / revenue) * 100 with two decimal precision
4. WHEN revenue is zero THEN the Manager_Dashboard SHALL display margin as 0% instead of NaN or infinity
5. WHEN displaying P&L THEN the Manager_Dashboard SHALL show comparison to previous period with percentage change

### Requirement 3

**User Story:** As a manager, I want to see revenue and cost breakdown by category, so that I can identify areas of concern or opportunity.

#### Acceptance Criteria

1. WHEN displaying revenue breakdown THEN the Manager_Dashboard SHALL group revenue by customer with totals
2. WHEN displaying cost breakdown THEN the Manager_Dashboard SHALL group costs by category (trucking, port_charges, documentation, etc.)
3. WHEN displaying breakdowns THEN the Manager_Dashboard SHALL show both absolute values and percentages of total
4. WHEN a category has zero value THEN the Manager_Dashboard SHALL exclude it from the breakdown display

### Requirement 4

**User Story:** As a manager, I want to see PJOs pending my approval, so that I can review and approve them efficiently.

#### Acceptance Criteria

1. WHEN displaying the approval queue THEN the Manager_Dashboard SHALL show all PJOs with status 'pending_approval'
2. WHEN displaying approval queue items THEN the Manager_Dashboard SHALL show PJO number, customer name, project name, total value, and days pending
3. WHEN a PJO has been pending for more than 2 days THEN the Manager_Dashboard SHALL highlight it with a warning indicator
4. WHEN the manager clicks on a PJO in the queue THEN the Manager_Dashboard SHALL navigate to the PJO detail page
5. WHEN the approval queue is empty THEN the Manager_Dashboard SHALL display a message indicating no pending approvals

### Requirement 5

**User Story:** As a manager, I want to see team performance metrics, so that I can monitor productivity and identify bottlenecks.

#### Acceptance Criteria

1. WHEN displaying team performance THEN the Manager_Dashboard SHALL show metrics grouped by department (sales, ops, admin, finance)
2. WHEN displaying sales metrics THEN the Manager_Dashboard SHALL show PJOs created, win rate, and pipeline value
3. WHEN displaying ops metrics THEN the Manager_Dashboard SHALL show JOs completed, average completion time, and budget adherence rate
4. WHEN displaying admin metrics THEN the Manager_Dashboard SHALL show PJOs processed, JOs created, and invoices generated
5. WHEN displaying finance metrics THEN the Manager_Dashboard SHALL show invoices collected, collection rate, and average days to payment

### Requirement 6

**User Story:** As a manager, I want to filter dashboard data by time period, so that I can analyze trends over different timeframes.

#### Acceptance Criteria

1. WHEN the Manager_Dashboard loads THEN the Manager_Dashboard SHALL display a period filter with options: This Month, This Quarter, This Year, YTD, Custom
2. WHEN the manager selects a period THEN the Manager_Dashboard SHALL refresh all metrics for the selected period
3. WHEN the manager selects Custom period THEN the Manager_Dashboard SHALL display date pickers for start and end dates
4. WHEN period changes THEN the Manager_Dashboard SHALL show loading state while fetching new data
5. WHEN displaying period data THEN the Manager_Dashboard SHALL show comparison to equivalent previous period

### Requirement 7

**User Story:** As a manager, I want to see trend charts, so that I can visualize business performance over time.

#### Acceptance Criteria

1. WHEN displaying trends THEN the Manager_Dashboard SHALL show a revenue vs costs line chart for the selected period
2. WHEN displaying trends THEN the Manager_Dashboard SHALL show monthly data points for periods longer than one month
3. WHEN hovering over chart data points THEN the Manager_Dashboard SHALL display tooltip with exact values
4. WHEN the selected period is one month or less THEN the Manager_Dashboard SHALL show weekly data points

### Requirement 8

**User Story:** As a manager, I want quick action buttons, so that I can navigate to common tasks efficiently.

#### Acceptance Criteria

1. WHEN displaying the Manager_Dashboard THEN the Manager_Dashboard SHALL show quick action buttons for: View All PJOs, View All JOs, View All Invoices, Export Report
2. WHEN the manager clicks Export Report THEN the Manager_Dashboard SHALL generate a PDF or Excel summary of current dashboard data
3. WHEN the manager clicks a quick action THEN the Manager_Dashboard SHALL navigate to the appropriate page with relevant filters applied

