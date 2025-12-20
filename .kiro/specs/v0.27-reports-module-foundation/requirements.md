# Requirements Document

## Introduction

This document defines the requirements for the Reports Module Foundation (v0.27) in Gama ERP. The module provides a unified reports framework with a reports hub, configurable report definitions, and initial key reports including AR Aging and Job Profitability reports. The system supports role-based access control, multiple export formats, and execution logging.

## Glossary

- **Report_Configuration**: A database record defining a report's metadata, filters, columns, and access permissions
- **Report_Execution**: A log entry recording when a report was run, by whom, with what parameters
- **AR_Aging_Report**: Accounts Receivable aging report showing outstanding invoices grouped by age buckets
- **Job_Profitability_Report**: Report showing revenue, costs, overhead, and net profit for job orders
- **Aging_Bucket**: Time-based grouping for outstanding amounts (Current, 1-30 days, 31-60 days, 61-90 days, Over 90 days)
- **Reports_Hub**: Central page displaying all available reports grouped by category
- **Report_Category**: Classification of reports (operations, finance, sales, executive)

## Requirements

### Requirement 1: Report Configuration Management

**User Story:** As a system administrator, I want to define and manage report configurations, so that reports can be customized and controlled centrally.

#### Acceptance Criteria

1. THE Report_Configuration_Table SHALL store report_code, report_name, description, report_category, default_filters, columns, allowed_roles, is_active, and display_order
2. WHEN a report configuration is created, THE System SHALL generate a unique UUID as the primary key
3. THE System SHALL enforce uniqueness on the report_code field
4. WHEN the system initializes, THE System SHALL seed default report configurations for operations, finance, sales, and executive categories
5. THE System SHALL support JSONB storage for default_filters and columns configuration

### Requirement 2: Report Execution Logging

**User Story:** As a system administrator, I want to track report executions, so that I can audit report usage and understand user behavior.

#### Acceptance Criteria

1. THE Report_Execution_Table SHALL store report_code, parameters, executed_by, executed_at, export_format, and export_url
2. WHEN a user runs a report, THE System SHALL create a report execution log entry
3. THE System SHALL record the export format used (view, pdf, excel, csv)
4. THE System SHALL index report executions by report_code and executed_by for efficient querying

### Requirement 3: Reports Hub Display

**User Story:** As a user, I want to see all available reports in a central hub, so that I can easily find and run the reports I need.

#### Acceptance Criteria

1. WHEN a user navigates to /reports, THE System SHALL display all active reports the user has permission to access
2. THE System SHALL group reports by category (Operations, Finance, Sales, Executive)
3. THE System SHALL display report name, description, and a "Run Report" action for each report card
4. WHEN a user searches for reports, THE System SHALL filter the displayed reports by name or description
5. THE System SHALL display recently run reports for quick access
6. THE System SHALL order reports within each category by display_order

### Requirement 4: Role-Based Report Access

**User Story:** As a manager, I want reports to be restricted based on user roles, so that sensitive financial data is only visible to authorized users.

#### Acceptance Criteria

1. WHEN displaying reports, THE System SHALL only show reports where the user's role is in the allowed_roles array
2. THE System SHALL grant owner role access to all reports
3. THE System SHALL grant admin role access to all reports
4. THE System SHALL grant manager role access to all reports
5. THE System SHALL restrict finance reports to owner, admin, manager, and finance roles
6. THE System SHALL restrict operations reports to owner, admin, manager, and ops roles
7. THE System SHALL restrict sales reports to owner, admin, manager, and sales roles
8. WHEN a user without permission attempts to access a report, THE System SHALL display an access denied message

### Requirement 5: AR Aging Report

**User Story:** As a finance user, I want to view an AR Aging report, so that I can monitor outstanding receivables and identify overdue accounts.

#### Acceptance Criteria

1. WHEN a user runs the AR Aging report, THE System SHALL calculate aging based on the as-of date parameter
2. THE System SHALL categorize invoices into aging buckets: Current (not yet due), 1-30 days, 31-60 days, 61-90 days, and Over 90 days
3. THE System SHALL display a summary section showing totals and percentages for each aging bucket
4. THE System SHALL display a detail section grouped by customer showing amounts in each aging bucket
5. THE System SHALL display a detail section listing individual invoices with invoice number, customer, dates, days outstanding, and amount due
6. WHEN a customer filter is applied, THE System SHALL show only invoices for that customer
7. THE System SHALL calculate days outstanding as the difference between the as-of date and the invoice due date
8. THE System SHALL only include invoices with amount_due greater than zero
9. THE System SHALL visually indicate severely overdue invoices (over 90 days) with a warning indicator

### Requirement 6: Job Profitability Report

**User Story:** As a finance user, I want to view a Job Profitability report, so that I can analyze the financial performance of completed jobs.

#### Acceptance Criteria

1. WHEN a user runs the Job Profitability report, THE System SHALL display revenue, direct cost, overhead, net profit, and net margin for each job
2. THE System SHALL calculate net profit as revenue minus direct cost minus overhead
3. THE System SHALL calculate net margin as (net profit / revenue) * 100
4. WHEN a date range filter is applied, THE System SHALL show only jobs within that date range
5. WHEN a customer filter is applied, THE System SHALL show only jobs for that customer
6. WHEN a margin range filter is applied, THE System SHALL show only jobs within that margin range
7. THE System SHALL display a summary section with total jobs, total revenue, total cost, total overhead, total net profit, and average margin
8. THE System SHALL sort jobs by net margin in descending order by default

### Requirement 7: Report Export

**User Story:** As a user, I want to export reports to different formats, so that I can share and analyze data outside the system.

#### Acceptance Criteria

1. WHEN a user clicks Export PDF, THE System SHALL generate a PDF file of the current report view
2. WHEN a user clicks Export Excel, THE System SHALL generate an Excel file with the report data
3. THE System SHALL include report title, filters applied, and generation timestamp in exported files
4. THE System SHALL log the export action in report_executions with the export format

### Requirement 8: Navigation Integration

**User Story:** As a user, I want to access reports from the main navigation, so that I can quickly navigate to the reports module.

#### Acceptance Criteria

1. THE System SHALL add a "Reports" menu item to the main sidebar navigation
2. WHEN a user clicks the Reports menu item, THE System SHALL navigate to /reports
3. THE System SHALL display the Reports menu item to all authenticated users
