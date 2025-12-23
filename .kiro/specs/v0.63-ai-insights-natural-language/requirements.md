# Requirements Document

## Introduction

This document defines the requirements for the AI Insights - Natural Language Queries feature (v0.63) for Gama ERP. This feature enables executives to ask business questions in plain English and receive instant, accurate answers from the database. The system uses template matching for common queries and AI-powered SQL generation for complex questions, with strict safety controls to prevent unauthorized data access or modification.

## Glossary

- **AI_Query_System**: The natural language processing system that interprets user questions and generates database queries
- **Query_Template**: A predefined pattern matching common business questions to optimized SQL queries
- **Query_Response**: The formatted answer returned to the user, which can be text, table, chart, or number
- **SQL_Validator**: The component that validates and sanitizes generated SQL to ensure safety
- **Query_History**: The log of all queries made by users for audit and improvement purposes
- **Quick_Question**: A predefined button that executes a common query with one click

## Requirements

### Requirement 1: Natural Language Query Input

**User Story:** As an executive, I want to type business questions in plain English, so that I can get answers without knowing SQL or navigating complex reports.

#### Acceptance Criteria

1. WHEN an executive types a question in the query input field and submits, THE AI_Query_System SHALL process the natural language query and return a response within 10 seconds
2. WHEN the query input field is empty and the user attempts to submit, THE AI_Query_System SHALL prevent submission and display a validation message
3. WHEN the user focuses on the query input field, THE AI_Query_System SHALL display placeholder text suggesting example questions
4. THE AI_Query_System SHALL support questions about revenue, costs, profit margins, customers, jobs, invoices, equipment, and HSE metrics

### Requirement 2: Query Template Matching

**User Story:** As an executive, I want common questions to be answered quickly using predefined templates, so that I get consistent and fast responses.

#### Acceptance Criteria

1. WHEN a user submits a query that matches a predefined template with similarity score above 0.7, THE AI_Query_System SHALL use the template SQL instead of generating new SQL
2. WHEN a template match is found, THE AI_Query_System SHALL extract parameters from the natural language query and substitute them into the SQL template
3. THE AI_Query_System SHALL maintain templates for: revenue queries, profit queries, customer queries, operations queries, and HSE queries
4. WHEN a template query is executed, THE AI_Query_System SHALL format the response using the template's response format

### Requirement 3: AI-Powered SQL Generation

**User Story:** As an executive, I want to ask complex questions that don't match templates, so that I can explore data in flexible ways.

#### Acceptance Criteria

1. WHEN a user query does not match any template, THE AI_Query_System SHALL generate SQL using AI with the database schema context
2. WHEN generating SQL, THE AI_Query_System SHALL only generate SELECT statements
3. WHEN SQL is generated, THE SQL_Validator SHALL validate the query before execution
4. IF the AI cannot understand the query, THEN THE AI_Query_System SHALL return an error message with suggested questions

### Requirement 4: SQL Validation and Safety

**User Story:** As a system administrator, I want all queries to be validated for safety, so that the database is protected from unauthorized access or modification.

#### Acceptance Criteria

1. THE SQL_Validator SHALL block any query containing INSERT, UPDATE, DELETE, DROP, TRUNCATE, ALTER, CREATE, GRANT, REVOKE, or EXECUTE keywords
2. THE SQL_Validator SHALL block access to sensitive tables including user_profiles, auth, passwords, and tokens
3. THE SQL_Validator SHALL only allow queries that start with SELECT
4. IF a query fails validation, THEN THE AI_Query_System SHALL return an error message without executing the query
5. THE AI_Query_System SHALL implement query timeout of 30 seconds to prevent long-running queries

### Requirement 5: Response Formatting

**User Story:** As an executive, I want query results displayed in an appropriate format, so that I can quickly understand the answer.

#### Acceptance Criteria

1. WHEN a query returns a single numeric value, THE AI_Query_System SHALL display it as a formatted number response with context
2. WHEN a query returns up to 20 rows, THE AI_Query_System SHALL display the results in a table format
3. WHEN a query returns more than 20 rows, THE AI_Query_System SHALL display the results as a chart visualization
4. WHEN a query returns no data, THE AI_Query_System SHALL display a message indicating no results were found
5. THE AI_Query_System SHALL format currency values with "Rp" prefix and thousand separators
6. THE AI_Query_System SHALL format percentage values with "%" suffix and one decimal place

### Requirement 6: Quick Question Buttons

**User Story:** As an executive, I want quick access to common questions, so that I can get frequent answers with one click.

#### Acceptance Criteria

1. THE AI_Query_System SHALL display quick question buttons for: "Revenue this month", "Active jobs", "Top customers", "Overdue invoices", and "Equipment utilization"
2. WHEN a user clicks a quick question button, THE AI_Query_System SHALL execute the corresponding template query immediately
3. THE AI_Query_System SHALL visually distinguish quick question buttons from the main query input

### Requirement 7: Query History

**User Story:** As an executive, I want to see my recent queries, so that I can quickly re-run previous questions.

#### Acceptance Criteria

1. THE AI_Query_System SHALL store all queries in the query history with user ID, query text, generated SQL, response, and timestamp
2. THE AI_Query_System SHALL display the 10 most recent queries for the current user
3. WHEN a user clicks on a history item, THE AI_Query_System SHALL re-execute that query
4. THE AI_Query_System SHALL display relative timestamps for history items (e.g., "2 hours ago", "Yesterday")

### Requirement 8: User Feedback

**User Story:** As an executive, I want to provide feedback on query responses, so that the system can improve over time.

#### Acceptance Criteria

1. THE AI_Query_System SHALL display "Helpful" and "Not Helpful" feedback buttons for each response
2. WHEN a user clicks a feedback button, THE AI_Query_System SHALL record the feedback in the query history
3. THE AI_Query_System SHALL allow users to add optional notes when providing feedback

### Requirement 9: Response Actions

**User Story:** As an executive, I want to export or share query results, so that I can use the data in reports or communications.

#### Acceptance Criteria

1. THE AI_Query_System SHALL provide an "Export" button for table and chart responses
2. WHEN a user clicks Export, THE AI_Query_System SHALL download the data as CSV format
3. THE AI_Query_System SHALL provide an "Email Report" button to share results via email

### Requirement 10: Access Control

**User Story:** As a system administrator, I want AI queries restricted to authorized users, so that sensitive business data is protected.

#### Acceptance Criteria

1. THE AI_Query_System SHALL only be accessible to users with 'owner', 'manager', or 'finance' roles
2. WHEN an unauthorized user attempts to access the AI query page, THE AI_Query_System SHALL redirect them to their default dashboard
3. THE AI_Query_System SHALL log all query attempts with user ID for audit purposes
