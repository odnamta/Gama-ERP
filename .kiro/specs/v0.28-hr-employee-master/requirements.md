# Requirements Document

## Introduction

This document defines the requirements for the HR Employee Master Data module (v0.28) in the Gama ERP system. This module establishes the foundation for HR functionality by enabling management of employee records, organizational structure (departments and positions), and integration with the existing user authentication system.

## Glossary

- **Employee**: A person employed by PT. Gama Intisamudera, tracked in the system with personal, contact, and employment information
- **Department**: An organizational unit within the company (e.g., Operations, Finance, Marketing)
- **Position**: A job title or role within a department (e.g., Operations Manager, Driver, Accountant)
- **Employee_Code**: A unique auto-generated identifier for each employee in format EMP-XXX
- **User_Profile**: An existing system user account that can be linked to an employee record
- **Employment_Type**: Classification of employment relationship (permanent, contract, probation, intern, outsource)
- **Employee_Status**: Current state of employment (active, on_leave, suspended, resigned, terminated)
- **Reporting_Hierarchy**: The organizational structure defining who reports to whom

## Requirements

### Requirement 1: Department Management

**User Story:** As an HR administrator, I want to manage company departments, so that I can organize employees into logical organizational units.

#### Acceptance Criteria

1. THE System SHALL store departments with department_code, department_name, parent_department_id, manager_id, and is_active fields
2. WHEN the system initializes, THE System SHALL create default departments: Operations, Finance & Administration, Marketing & Sales, Engineering, Human Resources, Health Safety & Environment, Procurement, and Executive
3. THE System SHALL enforce unique department_code values across all departments
4. WHEN a department has a parent_department_id, THE System SHALL establish a hierarchical relationship with the parent department

### Requirement 2: Position Management

**User Story:** As an HR administrator, I want to manage job positions, so that I can define roles and their organizational levels within departments.

#### Acceptance Criteria

1. THE System SHALL store positions with position_code, position_name, department_id, salary_min, salary_max, level, and is_active fields
2. THE System SHALL enforce unique position_code values across all positions
3. THE System SHALL support position levels from 1 (Staff) to 5 (Director)
4. WHEN the system initializes, THE System SHALL create default positions for each department including managers and staff roles

### Requirement 3: Employee Record Creation

**User Story:** As an HR administrator, I want to create employee records, so that I can maintain a complete database of company personnel.

#### Acceptance Criteria

1. WHEN an employee record is created, THE System SHALL auto-generate a unique employee_code in format EMP-XXX
2. THE System SHALL require full_name and join_date as mandatory fields for employee creation
3. THE System SHALL store personal information including id_number (KTP), tax_id (NPWP), date_of_birth, place_of_birth, gender, religion, and marital_status
4. THE System SHALL store contact information including phone, email, address, and city
5. THE System SHALL store emergency contact information including name, phone, and relation
6. THE System SHALL store employment details including department_id, position_id, employment_type, join_date, end_date, and reporting_to
7. THE System SHALL store compensation details including base_salary, salary_currency, bank_name, bank_account, and bank_account_name
8. THE System SHALL support photo_url for employee photos
9. THE System SHALL support a documents JSONB field for storing references to uploaded documents with type, url, and expiry

### Requirement 4: Employee Record Updates

**User Story:** As an HR administrator, I want to update employee records, so that I can keep employee information current and accurate.

#### Acceptance Criteria

1. WHEN an employee record is updated, THE System SHALL update the updated_at timestamp automatically
2. THE System SHALL allow updates to all employee fields except employee_code
3. WHEN an employee status changes to resigned or terminated, THE System SHALL allow recording resignation_date and resignation_reason

### Requirement 5: Employee Status Management

**User Story:** As an HR administrator, I want to manage employee status, so that I can track the current employment state of each person.

#### Acceptance Criteria

1. THE System SHALL support employee statuses: active, on_leave, suspended, resigned, and terminated
2. WHEN an employee is created, THE System SHALL set the default status to active
3. THE System SHALL NOT physically delete employee records but instead change status to reflect termination or resignation

### Requirement 6: Employee List View

**User Story:** As an HR user, I want to view a list of all employees, so that I can quickly find and access employee information.

#### Acceptance Criteria

1. WHEN a user navigates to the employee list, THE System SHALL display summary cards showing total employees, active employees, employees on leave, and new employees (month-to-date)
2. THE System SHALL display employees in a table with columns: Code, Name, Department, Position, Join Date, Status, and Action
3. WHEN a user searches, THE System SHALL filter employees by full_name or employee_code matching the search term
4. WHEN a user selects a department filter, THE System SHALL display only employees in that department
5. WHEN a user selects a status filter, THE System SHALL display only employees with that status
6. THE System SHALL provide a link to view each employee's detail page

### Requirement 7: Employee Detail View

**User Story:** As an HR user, I want to view detailed employee information, so that I can access complete personnel records.

#### Acceptance Criteria

1. WHEN a user views an employee detail, THE System SHALL display personal information section
2. WHEN a user views an employee detail, THE System SHALL display contact information section
3. WHEN a user views an employee detail, THE System SHALL display emergency contact section
4. WHEN a user views an employee detail, THE System SHALL display employment details section including reporting hierarchy
5. IF the user has salary view permission, THEN THE System SHALL display compensation section
6. IF the user does NOT have salary view permission, THEN THE System SHALL hide compensation section

### Requirement 8: Employee-User Account Linking

**User Story:** As an HR administrator, I want to link employee records to system user accounts, so that employees can access the ERP system with appropriate permissions.

#### Acceptance Criteria

1. THE System SHALL allow linking an employee record to an existing user_profile via user_id
2. WHEN creating an employee, THE System SHALL provide an option to create a system user account
3. IF create user account is selected, THE System SHALL use the employee's email as the username
4. IF create user account is selected, THE System SHALL allow selection of a system role for the new user

### Requirement 9: Role-Based Access Control

**User Story:** As a system administrator, I want to control access to employee data based on user roles, so that sensitive information is protected.

#### Acceptance Criteria

1. WHEN a user with owner role accesses HR, THE System SHALL grant full access to all employee data and operations
2. WHEN a user with admin role accesses HR, THE System SHALL grant full access to all employee data and operations
3. WHEN a user with hr role accesses HR, THE System SHALL grant access to view and edit employee data, but NOT delete
4. WHEN a user with manager role accesses HR, THE System SHALL grant access to view employees in their own department only
5. WHEN a user with finance role accesses HR, THE System SHALL deny access to employee list and details
6. WHEN a user with ops role accesses HR, THE System SHALL deny access to employee list and details
7. WHEN a user with sales role accesses HR, THE System SHALL deny access to employee list and details
8. WHEN viewing salary information, THE System SHALL restrict access to owner, admin, hr, and finance roles only

### Requirement 10: Navigation Integration

**User Story:** As a user, I want to access the HR module from the main navigation, so that I can easily find employee management features.

#### Acceptance Criteria

1. THE System SHALL add an HR section to the sidebar navigation
2. THE HR section SHALL include an Employees submenu item
3. WHEN a user clicks Employees, THE System SHALL navigate to /hr/employees route

### Requirement 11: Reporting Hierarchy

**User Story:** As an HR administrator, I want to define reporting relationships, so that the organizational structure is clearly documented.

#### Acceptance Criteria

1. THE System SHALL allow setting a reporting_to field referencing another employee
2. WHEN displaying employee details, THE System SHALL show the reporting manager's name
3. THE System SHALL prevent circular reporting relationships where an employee reports to themselves directly or indirectly
