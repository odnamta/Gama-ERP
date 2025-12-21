# Requirements: Engineering/Sales Dashboard (v0.9.9)

## Overview

Create a combined Engineering/Sales Dashboard for Hutami (Marketing Manager) who manages both Marketing/Sales (client acquisition, quotations) and Engineering (surveys, technical assessments). She needs visibility into the sales pipeline and engineering workload in one unified view.

## User Story

As Hutami (Marketing Manager), I need a dashboard that shows both my sales pipeline status and engineering workload so that I can track quotations from RFQ to award while monitoring technical assessments for complex projects.

## Functional Requirements

### Requirement 1: Dashboard Routing and Access

1. THE System SHALL route users with role='sales' OR email='hutamiarini@gama-group.co' to the Engineering/Sales Dashboard
2. THE Dashboard SHALL display a tabbed interface with "Sales Pipeline", "Engineering", and "Combined View" tabs
3. THE Dashboard SHALL show a personalized greeting with the user's name and last updated timestamp
4. THE Dashboard SHALL provide a manual refresh button to update all data

### Requirement 2: Sales Pipeline Summary Cards

1. THE Dashboard SHALL display a "Draft" card showing count and total value of quotations in draft status
2. THE Dashboard SHALL display an "Engineering Review" card showing count and total value of quotations in engineering_review status
3. THE Dashboard SHALL display a "Submitted" card showing count and total value of quotations in submitted status
4. THE Dashboard SHALL display a "Won MTD" card showing count and total value of quotations won this month
5. THE Dashboard SHALL display a "Win Rate" card showing win rate percentage calculated from last 90 days
6. THE Dashboard SHALL display pursuit costs MTD (Month-To-Date) total

### Requirement 3: Pipeline Funnel Visualization

1. THE Dashboard SHALL display a horizontal bar chart showing pipeline stages (Draft, Eng Review, Submitted)
2. THE Dashboard SHALL show count and value for each pipeline stage
3. THE Dashboard SHALL visually represent relative values between stages using bar widths

### Requirement 4: Urgent Quotations (Deadline Approaching)

1. THE Dashboard SHALL display quotations with submission_deadline within 7 days
2. THE Dashboard SHALL show quotation number, customer name, cargo description, and value
3. THE Dashboard SHALL show days remaining until deadline
4. THE Dashboard SHALL highlight quotations with 3 or fewer days remaining
5. THE Dashboard SHALL provide click-through navigation to quotation detail page
6. THE Dashboard SHALL limit display to 5 most urgent quotations with "View All" link

### Requirement 5: Engineering Workload Summary

1. THE Dashboard SHALL display total count of pending engineering assessments (status IN 'pending', 'in_progress')
2. THE Dashboard SHALL break down pending assessments by type: surveys, technical, JMP
3. THE Dashboard SHALL display count of assessments completed this month
4. THE Dashboard SHALL display count of complex projects (market_type='complex') currently in pipeline
5. THE Dashboard SHALL provide "View Engineering Queue" link to full assessment list

### Requirement 6: Recent Quotations Table

1. THE Dashboard SHALL display a table of recent quotations (limit 10)
2. THE Table SHALL show: quotation number, customer name, value, margin %, status, engineering status, action
3. THE Engineering status column SHALL show: ✅ (completed), 🔄 (in_progress), ⏳ (pending), N/A (not required)
4. THE Action column SHALL show "View" for submitted quotations and "Edit" for draft quotations
5. THE Table SHALL be sortable by value and status

### Requirement 7: Quick Actions Bar

1. THE Dashboard SHALL provide a "New Quotation" button linking to quotation creation form
2. THE Dashboard SHALL provide a "Start Assessment" button linking to engineering assessment form
3. THE Dashboard SHALL provide a "Follow Up" button for quotation follow-up workflow
4. THE Dashboard SHALL provide a "Pipeline Report" button linking to sales pipeline report

### Requirement 8: Data Refresh and Staleness

1. THE Dashboard SHALL auto-refresh data if older than 5 minutes when loaded
2. THE Dashboard SHALL display "Last updated: X minutes ago" timestamp
3. THE Dashboard SHALL show a visual indicator when data is stale (>5 minutes old)
4. THE Refresh button SHALL trigger materialized view refresh and reload all data

### Requirement 9: Database Views and Functions

1. THE Database SHALL have a `sales_pipeline_summary` materialized view with pipeline counts, values, win rate, and pursuit costs
2. THE Database SHALL have an `engineering_workload_summary` materialized view with assessment counts by type and status
3. THE Database SHALL have a `quotation_dashboard_list` view joining quotations with customers and engineering status
4. THE Database SHALL have a `refresh_sales_engineering_dashboard()` function to refresh both materialized views
5. THE Database SHALL have indexes on quotations(submission_deadline) and engineering_assessments(status, quotation_id)

## Non-Functional Requirements

### Performance
- Dashboard initial load SHALL complete within 2 seconds
- Materialized view refresh SHALL complete within 5 seconds
- All database queries SHALL use appropriate indexes

### Security
- All views SHALL respect existing RLS policies
- Only authorized roles (sales, manager, owner, admin) SHALL access this dashboard

### Accessibility
- All interactive elements SHALL be keyboard accessible
- Color indicators SHALL have text alternatives
- Charts SHALL have appropriate ARIA labels

## Out of Scope

- Real-time WebSocket updates (manual refresh only)
- Custom dashboard layout configuration
- Export functionality (covered by reports module)
- Mobile-specific layout optimizations

## Dependencies

- Existing `quotations` table with status, market_type, submission_deadline fields
- Existing `engineering_assessments` table with quotation_id, status, assessment_type fields
- Existing `pursuit_costs` table for pursuit cost tracking
- Existing `customers` table for customer information
