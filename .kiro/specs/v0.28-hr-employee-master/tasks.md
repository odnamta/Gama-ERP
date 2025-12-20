# Implementation Plan: HR Employee Master Data

## Overview

This implementation plan covers the HR Employee Master Data module (v0.28) for Gama ERP. The tasks are organized to build incrementally, starting with database schema, then types and utilities, followed by server actions, and finally UI components.

## Tasks

- [x] 1. Database Schema Setup
  - [x] 1.1 Create departments table with default data
    - Create departments table with columns: id, department_code, department_name, parent_department_id, manager_id, is_active, created_at
    - Insert default departments: Operations, Finance & Administration, Marketing & Sales, Engineering, Human Resources, HSE, Procurement, Executive
    - _Requirements: 1.1, 1.2, 1.4_

  - [x] 1.2 Create positions table with default data
    - Create positions table with columns: id, position_code, position_name, department_id, salary_min, salary_max, level, is_active, created_at
    - Insert default positions for each department
    - _Requirements: 2.1, 2.4_

  - [x] 1.3 Create employees table with auto-code generation
    - Create employees table with all specified columns
    - Create employee_seq sequence
    - Create generate_employee_code() trigger function
    - Create indexes on department_id, position_id, status, user_id
    - Add foreign key from departments.manager_id to employees.id
    - _Requirements: 3.1, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

  - [x] 1.4 Create RLS policies for HR tables
    - Create select policy for employees (owner, admin, hr, manager for own dept)
    - Create insert policy for employees (owner, admin, hr)
    - Create update policy for employees (owner, admin, hr)
    - Create delete policy for employees (owner, admin only)
    - Create policies for departments and positions tables
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [x] 2. Type Definitions and Utilities
  - [x] 2.1 Create employee type definitions
    - Create types/employees.ts with all interfaces
    - Define EmploymentType, EmployeeStatus, Gender, MaritalStatus, PositionLevel types
    - Define Department, Position, Employee, EmployeeWithRelations interfaces
    - Define EmployeeSummaryStats, EmployeeFilters, EmployeeFormData interfaces
    - _Requirements: 3.3, 5.1_

  - [x] 2.2 Create employee utility functions
    - Create lib/employee-utils.ts
    - Implement EMPLOYMENT_TYPES, EMPLOYEE_STATUSES, GENDERS, MARITAL_STATUSES constants
    - Implement generateEmployeeCode(), getEmploymentTypeLabel(), getEmployeeStatusLabel()
    - Implement calculateEmployeeSummaryStats(), filterEmployeesBySearch()
    - Implement isValidEmployeeCode(), formatSalary(), hasCircularReporting()
    - _Requirements: 3.1, 5.1, 6.1, 6.3, 11.3_

  - [x] 2.3 Write property tests for employee utilities
    - **Property 1: Employee Code Generation and Uniqueness**
    - **Property 8: Summary Statistics Calculation**
    - **Property 9: Filter Correctness**
    - **Property 11: Circular Reporting Prevention**
    - **Property 12: Position Level Bounds**
    - **Validates: Requirements 3.1, 6.1, 6.3, 6.4, 6.5, 11.3, 2.3**

  - [x] 2.4 Extend permissions system for HR
    - Add HR feature keys to types/permissions.ts
    - Add HR permission mappings to lib/permissions.ts
    - Add helper functions: canViewEmployees, canCreateEmployee, canEditEmployee, canDeleteEmployee, canViewSalary, canEditSalary
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

  - [x] 2.5 Write property tests for HR permissions
    - **Property 10: Salary Visibility Based on Permissions**
    - **Validates: Requirements 7.5, 7.6, 9.8**

- [x] 3. Checkpoint - Verify foundation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Server Actions
  - [x] 4.1 Create employee server actions
    - Create app/(main)/hr/employees/actions.ts
    - Implement getEmployees() with filters and relations
    - Implement getEmployee() by ID with relations
    - Implement createEmployee() with validation
    - Implement updateEmployee() with validation
    - Implement updateEmployeeStatus() for status changes
    - _Requirements: 3.1, 3.2, 4.1, 4.2, 4.3, 5.1, 5.2, 6.3, 6.4, 6.5_

  - [x] 4.2 Create department and position actions
    - Implement getDepartments()
    - Implement getPositions() with optional department filter
    - Implement getEmployeeCount() for code generation
    - Implement linkEmployeeToUser()
    - _Requirements: 8.1_

  - [x] 4.3 Write property tests for server action validation
    - **Property 2: Required Field Validation**
    - **Property 5: Employee Code Immutability**
    - **Property 6: Status Validation and Defaults**
    - **Validates: Requirements 3.2, 4.2, 5.1, 5.2**

- [x] 5. UI Components
  - [x] 5.1 Create employee summary cards component
    - Create components/employees/employee-summary-cards.tsx
    - Display Total, Active, On Leave, New (MTD) cards
    - Use existing Card component from shadcn/ui
    - _Requirements: 6.1_

  - [x] 5.2 Create employee filters component
    - Create components/employees/employee-filters.tsx
    - Add search input for name/code search
    - Add department dropdown filter
    - Add status dropdown filter
    - _Requirements: 6.3, 6.4, 6.5_

  - [x] 5.3 Create employee table component
    - Create components/employees/employee-table.tsx
    - Display columns: Code, Name, Department, Position, Join Date, Status, Actions
    - Add View action button
    - Add Edit action button (permission-gated)
    - Use existing Table components from shadcn/ui
    - _Requirements: 6.2, 6.6_

  - [x] 5.4 Create employee form component
    - Create components/employees/employee-form.tsx
    - Add Personal Information section (name, ID, DOB, gender, etc.)
    - Add Contact Information section (phone, email, address)
    - Add Emergency Contact section
    - Add Employment Details section (department, position, reporting to, dates)
    - Add Compensation section (permission-gated for salary fields)
    - Add System Access section (create user account option)
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 3.7, 7.5, 7.6, 8.2, 8.3, 8.4_

  - [x] 5.5 Create employee detail view component
    - Create components/employees/employee-detail-view.tsx
    - Display all sections with proper formatting
    - Hide salary section for unauthorized users
    - Show reporting manager name
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 11.2_

  - [x] 5.6 Create employee status badge component
    - Create components/ui/employee-status-badge.tsx
    - Style badges for each status (active, on_leave, suspended, resigned, terminated)
    - _Requirements: 5.1_

- [x] 6. Checkpoint - Verify components
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Page Routes
  - [x] 7.1 Create employee list page
    - Create app/(main)/hr/employees/page.tsx
    - Fetch employees with server component
    - Render summary cards, filters, and table
    - Add "Add Employee" button (permission-gated)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 7.2 Create new employee page
    - Create app/(main)/hr/employees/new/page.tsx
    - Render employee form in create mode
    - Handle form submission with createEmployee action
    - Redirect to list on success
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

  - [x] 7.3 Create employee detail page
    - Create app/(main)/hr/employees/[id]/page.tsx
    - Fetch employee by ID with relations
    - Render employee detail view
    - Add Edit button (permission-gated)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 11.2_

  - [x] 7.4 Create employee edit page
    - Create app/(main)/hr/employees/[id]/edit/page.tsx
    - Fetch employee by ID
    - Render employee form in edit mode
    - Handle form submission with updateEmployee action
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 8. Navigation Integration
  - [x] 8.1 Add HR section to navigation
    - Add HR nav item to lib/navigation.ts with Users icon
    - Add Employees submenu item pointing to /hr/employees
    - Set roles to ['owner', 'admin', 'hr', 'manager']
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 8.2 Create HR layout
    - Create app/(main)/hr/layout.tsx
    - Add permission check for HR access
    - Redirect unauthorized users
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [x] 9. Final Integration
  - [x] 9.1 Wire up employee-user linking
    - Add link to user functionality in employee detail
    - Show linked user info if user_id exists
    - _Requirements: 8.1_

  - [x] 9.2 Implement soft delete
    - Add deactivate/terminate action to employee detail
    - Update status instead of deleting record
    - _Requirements: 5.3_

  - [x] 9.3 Write integration tests
    - Test employee CRUD flow
    - Test permission-based access
    - Test filter functionality
    - **Property 3: Employee Data Round-Trip**
    - **Property 4: Updated Timestamp Auto-Update**
    - **Property 7: Soft Delete Behavior**
    - **Validates: Requirements 3.3-3.9, 4.1, 5.3**

- [x] 10. Final Checkpoint
  - All 71 employee tests pass
  - All acceptance criteria met

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation follows existing patterns from the Vendor Management module
