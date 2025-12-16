# Requirements Document

## Introduction

This document specifies the requirements for Reports Module Phase 2 (v0.10.1) in Gama ERP. Building on the foundation from v0.10, this phase adds additional reports for revenue analysis, operational metrics, and customer insights. It also introduces PDF/Excel export capabilities and chart visualizations.

## Glossary

- **Reports_Module**: The dedicated reports section accessible from the main navigation
- **Revenue_By_Customer**: Report showing total revenue breakdown per customer
- **Revenue_By_Project**: Report showing revenue breakdown per project
- **Cost_Analysis**: Report analyzing costs by category across all PJOs/JOs
- **JO_Summary**: Summary report of all Job Orders with key metrics
- **On_Time_Delivery**: Report measuring delivery performance against scheduled dates
- **Vendor_Performance**: Report tracking vendor reliability and cost efficiency
- **Customer_Payment_History**: Report showing payment patterns per customer
- **Outstanding_Invoices**: Report listing all unpaid invoices with aging details
- **Sales_Pipeline**: Report analyzing PJO pipeline stages and values
- **Customer_Acquisition**: Report tracking new customer trends over time
- **Export_Service**: Service handling PDF and Excel file generation
- **Chart_Component**: Reusable visualization component for report data

## Requirements

### Requirement 1

**User Story:** As a sales or manager user, I want to generate a Revenue by Customer report, so that I can identify top customers and revenue distribution.

#### Acceptance Criteria

1. WHEN generating the Revenue_By_Customer report THEN the Reports_Module SHALL list all customers with their total revenue from completed JOs within the selected period
2. WHEN displaying Revenue_By_Customer data THEN the Reports_Module SHALL show customer name, total revenue, number of JOs, and percentage of total revenue
3. WHEN displaying Revenue_By_Customer data THEN the Reports_Module SHALL sort customers by total revenue in descending order by default
4. WHEN a customer has zero revenue in the period THEN the Reports_Module SHALL exclude that customer from the report
5. WHEN the user clicks on a customer name THEN the Reports_Module SHALL navigate to the customer detail page

### Requirement 2

**User Story:** As a manager user, I want to generate a Revenue by Project report, so that I can analyze revenue performance across projects.

#### Acceptance Criteria

1. WHEN generating the Revenue_By_Project report THEN the Reports_Module SHALL list all projects with their total revenue from completed JOs within the selected period
2. WHEN displaying Revenue_By_Project data THEN the Reports_Module SHALL show project name, customer name, total revenue, total cost, and profit margin
3. WHEN calculating profit margin THEN the Reports_Module SHALL compute ((Revenue - Cost) / Revenue) * 100
4. WHEN Revenue is zero THEN the Reports_Module SHALL display profit margin as 0%
5. WHEN the user clicks on a project name THEN the Reports_Module SHALL navigate to the project detail page

### Requirement 3

**User Story:** As a manager or ops user, I want to generate a Cost Analysis by Category report, so that I can identify cost patterns and optimization opportunities.

#### Acceptance Criteria

1. WHEN generating the Cost_Analysis report THEN the Reports_Module SHALL aggregate actual costs by category across all JOs within the selected period
2. WHEN displaying Cost_Analysis data THEN the Reports_Module SHALL show category name, total amount, percentage of total costs, and average per JO
3. WHEN displaying Cost_Analysis data THEN the Reports_Module SHALL sort categories by total amount in descending order
4. WHEN comparing periods THEN the Reports_Module SHALL show period-over-period change percentage for each category
5. WHEN a category has zero costs THEN the Reports_Module SHALL exclude that category from the report

### Requirement 4

**User Story:** As a manager or ops user, I want to generate a JO Summary report, so that I can get an overview of all job orders and their status.

#### Acceptance Criteria

1. WHEN generating the JO_Summary report THEN the Reports_Module SHALL list all JOs within the selected period with key metrics
2. WHEN displaying JO_Summary data THEN the Reports_Module SHALL show JO number, customer name, project name, status, revenue, cost, and margin
3. WHEN displaying JO_Summary data THEN the Reports_Module SHALL allow filtering by status (active, completed, invoiced, closed)
4. WHEN displaying JO_Summary totals THEN the Reports_Module SHALL show total count, total revenue, total cost, and average margin
5. WHEN the user clicks on a JO number THEN the Reports_Module SHALL navigate to the JO detail page

### Requirement 5

**User Story:** As a manager or ops user, I want to generate an On-Time Delivery report, so that I can measure operational performance.

#### Acceptance Criteria

1. WHEN generating the On_Time_Delivery report THEN the Reports_Module SHALL calculate delivery performance for completed JOs within the selected period
2. WHEN displaying On_Time_Delivery metrics THEN the Reports_Module SHALL show on-time count, late count, on-time percentage, and average delay days for late deliveries
3. WHEN a JO is completed on or before the scheduled date THEN the Reports_Module SHALL classify it as on-time
4. WHEN a JO is completed after the scheduled date THEN the Reports_Module SHALL classify it as late and calculate delay days
5. WHEN a JO has no scheduled completion date THEN the Reports_Module SHALL exclude it from the on-time calculation

### Requirement 6

**User Story:** As a manager or ops user, I want to generate a Vendor Performance report, so that I can evaluate vendor reliability and cost efficiency.

#### Acceptance Criteria

1. WHEN generating the Vendor_Performance report THEN the Reports_Module SHALL aggregate vendor data from cost items across JOs within the selected period
2. WHEN displaying Vendor_Performance data THEN the Reports_Module SHALL show vendor name, total spend, number of JOs, average cost per JO, and on-time delivery rate
3. WHEN calculating vendor on-time rate THEN the Reports_Module SHALL compute (on-time deliveries / total deliveries) * 100
4. WHEN a vendor has zero deliveries THEN the Reports_Module SHALL display on-time rate as N/A
5. WHEN displaying Vendor_Performance data THEN the Reports_Module SHALL allow sorting by total spend, JO count, or on-time rate

### Requirement 7

**User Story:** As a finance or manager user, I want to generate a Customer Payment History report, so that I can analyze payment patterns and identify slow payers.

#### Acceptance Criteria

1. WHEN generating the Customer_Payment_History report THEN the Reports_Module SHALL aggregate payment data per customer within the selected period
2. WHEN displaying Customer_Payment_History data THEN the Reports_Module SHALL show customer name, total invoiced, total paid, outstanding balance, and average days to pay
3. WHEN calculating average days to pay THEN the Reports_Module SHALL compute the mean of (payment date - invoice date) for all paid invoices
4. WHEN a customer has no paid invoices THEN the Reports_Module SHALL display average days to pay as N/A
5. WHEN average days to pay exceeds 45 days THEN the Reports_Module SHALL highlight the customer row with a warning indicator

### Requirement 8

**User Story:** As a finance or manager user, I want to generate an Outstanding Invoices report, so that I can track all unpaid invoices in one view.

#### Acceptance Criteria

1. WHEN generating the Outstanding_Invoices report THEN the Reports_Module SHALL list all unpaid invoices regardless of age
2. WHEN displaying Outstanding_Invoices data THEN the Reports_Module SHALL show invoice number, customer name, JO number, invoice date, due date, amount, and days outstanding
3. WHEN displaying Outstanding_Invoices totals THEN the Reports_Module SHALL show total count, total amount, and breakdown by aging bucket
4. WHEN the user filters by customer THEN the Reports_Module SHALL show only invoices for the selected customer
5. WHEN the user clicks on an invoice number THEN the Reports_Module SHALL navigate to the invoice detail page

### Requirement 9

**User Story:** As a sales or manager user, I want to generate a Sales Pipeline Analysis report, so that I can forecast revenue and identify bottlenecks.

#### Acceptance Criteria

1. WHEN generating the Sales_Pipeline report THEN the Reports_Module SHALL show PJOs grouped by status with total values
2. WHEN displaying Sales_Pipeline data THEN the Reports_Module SHALL show status, count, total value, and percentage of pipeline
3. WHEN displaying Sales_Pipeline metrics THEN the Reports_Module SHALL show weighted pipeline value (value * probability by stage)
4. WHEN calculating stage probability THEN the Reports_Module SHALL use: Draft=10%, Pending=30%, Approved=70%, Converted=100%
5. WHEN displaying Sales_Pipeline trends THEN the Reports_Module SHALL show period-over-period change in pipeline value

### Requirement 10

**User Story:** As a sales or manager user, I want to generate a Customer Acquisition report, so that I can track new customer trends.

#### Acceptance Criteria

1. WHEN generating the Customer_Acquisition report THEN the Reports_Module SHALL show new customers added within the selected period
2. WHEN displaying Customer_Acquisition data THEN the Reports_Module SHALL show customer name, acquisition date, first project, and total revenue to date
3. WHEN displaying Customer_Acquisition metrics THEN the Reports_Module SHALL show total new customers, average revenue per new customer, and acquisition trend
4. WHEN calculating acquisition trend THEN the Reports_Module SHALL compare current period new customers to previous period
5. WHEN a new customer has no projects yet THEN the Reports_Module SHALL display first project as "No projects"

### Requirement 11

**User Story:** As a user, I want to export reports to PDF and Excel formats, so that I can share and archive report data.

#### Acceptance Criteria

1. WHEN viewing any report THEN the Reports_Module SHALL display export buttons for PDF and Excel formats
2. WHEN the user clicks PDF export THEN the Export_Service SHALL generate a PDF file with report title, period, data table, and summary
3. WHEN the user clicks Excel export THEN the Export_Service SHALL generate an XLSX file with report data in tabular format
4. WHEN generating exports THEN the Export_Service SHALL include the generation timestamp and user name in the file
5. WHEN export generation fails THEN the Reports_Module SHALL display an error message and allow retry

### Requirement 12

**User Story:** As a user, I want to see visual charts in reports, so that I can quickly understand data patterns.

#### Acceptance Criteria

1. WHEN displaying Revenue_By_Customer report THEN the Reports_Module SHALL show a pie chart of revenue distribution
2. WHEN displaying Cost_Analysis report THEN the Reports_Module SHALL show a bar chart of costs by category
3. WHEN displaying Sales_Pipeline report THEN the Reports_Module SHALL show a funnel chart of pipeline stages
4. WHEN displaying trend data THEN the Reports_Module SHALL show a line chart of values over time
5. WHEN the user hovers over chart elements THEN the Chart_Component SHALL display a tooltip with exact values

### Requirement 13

**User Story:** As an administrator, I want to control access to Phase 2 reports, so that sensitive data remains protected.

#### Acceptance Criteria

1. WHEN a user with role 'admin' or 'manager' accesses reports THEN the Reports_Module SHALL display all Phase 2 reports
2. WHEN a user with role 'finance' accesses reports THEN the Reports_Module SHALL display Customer Payment History and Outstanding Invoices reports
3. WHEN a user with role 'ops' accesses reports THEN the Reports_Module SHALL display JO Summary, On-Time Delivery, Vendor Performance, and Cost Analysis reports
4. WHEN a user with role 'sales' accesses reports THEN the Reports_Module SHALL display Revenue by Customer, Sales Pipeline, and Customer Acquisition reports
5. WHEN checking report access THEN the Reports_Module SHALL validate permissions on both client and server side
