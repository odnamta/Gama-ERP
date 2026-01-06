# Requirements Document

## Introduction

This specification defines a comprehensive Role-Based Access Control (RBAC) matrix for GAMA ERP. It implements a hierarchical RBAC system with 11 user roles, department-scoped manager access, granular module-level permissions, field-level visibility controls, and a Maker-Checker-Approver workflow pattern for financial documents.

## Glossary

- **RBAC_System**: The role-based access control system that manages user permissions and access levels
- **User_Profile**: Database record containing user identity, role assignment, department scope, and permission flags
- **Permission_Level**: Access type for a feature (Full, Read, Own, Partial, None)
- **Full_Access**: Create, Read, Update, Delete operations allowed
- **Read_Access**: View-only access to data
- **Own_Access**: Access limited to records the user created or is assigned to
- **Partial_Access**: Limited field visibility within accessible records
- **Department_Scope**: Array of departments a manager oversees (e.g., ['marketing', 'engineering'])
- **Navigation_Filter**: System that shows/hides menu items based on user role
- **Field_Mask**: System that hides specific data fields from unauthorized roles
- **Permission_Gate**: UI component that conditionally renders content based on permissions
- **RLS_Policy**: Row-Level Security policy enforcing database-level access control
- **Maker-Checker-Approver**: Workflow pattern where documents are prepared, reviewed, then approved by different roles

## Requirements

### Requirement 1: Extended Role Definitions

**User Story:** As a system administrator, I want to define distinct user roles with clear responsibilities, so that access control aligns with organizational structure.

#### Role Hierarchy

```
OWNER (Dio)
    └── DIRECTOR (Managing Director)
            ├── MANAGER (Hutami) → Marketing + Engineering depts
            ├── MANAGER (Feri) → Administration + Finance depts
            └── MANAGER (Reza) → Operations + Assets depts
                    └── Staff Roles: marketing, administration, finance, ops, engineer, hr, hse
            └── SYSADMIN (IT - reports to Owner/Director)
```

#### Role Descriptions

**1. Owner (owner)**
- Full system access with no restrictions
- Final approver for all documents (PJO, JO, BKK)
- Can view all financial data including revenue, costs, and profit margins
- Can manage all users including directors and admins
- Can access all system settings and configurations
- Can view audit logs and system health
- Example Users: Dio Atmando (Company Owner)

**2. Director (director)**
- Executive oversight with near-full system access
- Can approve PJO, JO, and BKK (disbursements)
- Can view all financial data including revenue, costs, and profit margins
- Can manage users except owner
- Can access most system settings
- Cannot modify owner account or critical system settings
- Example Users: Managing Director, General Manager

**3. Manager (manager)**
- Department head with department-scoped visibility
- Has `department_scope` attribute defining which departments they oversee
- Can review and check documents (PJO, JO, BKK) before approval
- Can view revenue, costs, and profit margins within their scope
- Can manage team members within their department scope
- CANNOT approve PJO, JO, or BKK - only review/check
- Dashboard shows widgets relevant to their department scope
- Department Scope Examples:
  - **Hutami**: `['marketing', 'engineering']` → Marketing/Engineering Dashboard
  - **Feri**: `['administration', 'finance']` → Admin/Finance Dashboard
  - **Reza**: `['operations', 'assets']` → Operations Dashboard
- Example Users: Hutami Arini, Feri Supriono, Reza Pramana

**4. System Administrator (sysadmin)**
- IT administration and technical system management
- Can manage users, roles, and permissions
- Can access system settings, audit logs, and configurations
- Can view system health and performance metrics
- Limited access to business/financial data
- Cannot approve business documents
- Example Users: IT Administrator, IT Staff

**5. Administration (administration)**
- Business administration and document management
- Prepares PJO from won quotations (Maker role)
- Creates invoices after job completion
- Manages business documentation
- Can view revenue and cost data for document preparation
- Cannot approve documents - only prepare
- Example Users: Administration Staff (Feri's team)

**6. Finance (finance)**
- Financial operations and reporting
- Manages payments, AR/AP, and disbursements
- Prepares BKK (disbursement) documents
- Can process payroll
- Can view financial reports and tax documents
- Can view revenue and profit data
- Cannot approve BKK - only prepare
- Example Users: Finance Staff, Accountants

**7. Marketing (marketing)**
- Customer relationship and quotation management
- Full access to customers and quotations
- Can structure cost estimates for quotations (using estimation tools)
- Can view pipeline and win/loss reports
- Can see revenue pricing but NOT profit margins or actual job costs
- Can request engineering assessments for complex quotations
- No access to invoices or payments
- No access to actual job order cost details (only estimates)
- Example Users: Sales Representatives, Account Managers, Marketing Staff

**8. Operations (ops)**
- Job execution and field operations focus
- Can manage job orders, expenses, and equipment
- Can create delivery documents (Surat Jalan, Berita Acara)
- CRITICAL: Cannot see revenue, profit margins, or invoice amounts
- Can only see cost budgets and actual expenses
- No access to quotations, PJO revenue items, or invoices
- Example Users: Field Supervisors, Operations Staff

**9. Engineer (engineer)**
- Technical and engineering focus
- Full access to engineering modules (surveys, JMP, drawings, assessments)
- Can review complex quotations requiring engineering assessment
- Can view project technical details
- Limited access to financial data
- Example Users: Engineers, Technical Assessors

**10. HR (hr)**
- Human resources management focus
- Full access to employee records, attendance, leave, and payroll
- Can manage training records and certifications
- Can view manpower costs
- Limited access to other modules
- No access to financial reports or invoices
- Example Users: HR Staff, HR Manager

**11. HSE (hse)**
- Health, Safety, and Environment focus
- Full access to HSE modules (incidents, audits, training, PPE, permits)
- Can view employee safety records
- Can manage safety documentation
- Limited access to job orders (safety-related only)
- No access to financial data
- Example Users: HSE Officers, Safety Coordinators

#### Acceptance Criteria

1. THE RBAC_System SHALL support the following roles: owner, director, manager, sysadmin, administration, finance, marketing, ops, engineer, hr, hse
2. WHEN a user with role "owner" accesses the system, THE RBAC_System SHALL grant full access to all features and data
3. WHEN a user with role "director" accesses the system, THE RBAC_System SHALL grant executive access including PJO/JO/BKK approval
4. WHEN a user with role "manager" accesses the system, THE RBAC_System SHALL grant department-scoped access based on their department_scope attribute
5. WHEN a user with role "manager" attempts to approve PJO/JO/BKK, THE RBAC_System SHALL deny the operation (managers can only review/check)
6. WHEN a user with role "sysadmin" accesses the system, THE RBAC_System SHALL grant IT administration access
7. WHEN a user with role "administration" accesses the system, THE RBAC_System SHALL grant document preparation access (PJO, invoices)
8. WHEN a user with role "finance" accesses the system, THE RBAC_System SHALL grant financial operations access
9. WHEN a user with role "marketing" accesses the system, THE RBAC_System SHALL grant customer and quotation access with cost estimation tools
10. WHEN a user with role "ops" accesses the system, THE RBAC_System SHALL grant job execution access without revenue visibility
11. WHEN a user with role "engineer" accesses the system, THE RBAC_System SHALL grant engineering module access
12. WHEN a user with role "hr" accesses the system, THE RBAC_System SHALL grant HR module access
13. WHEN a user with role "hse" accesses the system, THE RBAC_System SHALL grant HSE module access

### Requirement 2: Maker-Checker-Approver Workflow

**User Story:** As a company owner, I want financial documents to go through a prepare-review-approve workflow, so that there is proper oversight and control.

#### Workflow Definitions

**PJO Workflow:**
```
Maker: administration (prepares PJO from won quotation)
Checker: manager[administration] (Feri reviews/checks)
Approver: director OR owner (final approval)
```

**JO Workflow (after costs collected):**
```
Maker: administration (compiles final costs)
Checker: manager[administration] (Feri reviews/checks)
Approver: director OR owner (final approval)
```

**BKK (Disbursement) Workflow:**
```
Maker: administration OR finance (prepares disbursement)
Checker: manager[finance] (Feri reviews/checks)
Approver: director OR owner (final approval)
```

#### Acceptance Criteria

1. WHEN a user with role "administration" creates a PJO, THE RBAC_System SHALL set status to "draft"
2. WHEN a user with role "manager" with department_scope including "administration" reviews a PJO, THE RBAC_System SHALL allow status change to "checked"
3. WHEN a user with role in [director, owner] approves a PJO, THE RBAC_System SHALL allow status change to "approved"
4. WHEN a user with role NOT in [director, owner] attempts to approve a PJO, THE RBAC_System SHALL deny the operation
5. THE RBAC_System SHALL enforce the same Maker-Checker-Approver pattern for JO finalization
6. THE RBAC_System SHALL enforce the same Maker-Checker-Approver pattern for BKK disbursements
7. THE RBAC_System SHALL log all workflow state transitions with user, timestamp, and action

### Requirement 3: Department-Scoped Manager Access

**User Story:** As a manager, I want to see only the data and dashboards relevant to my department scope, so that I can focus on my areas of responsibility.

#### Acceptance Criteria

1. WHEN a manager with department_scope=['marketing', 'engineering'] logs in, THE RBAC_System SHALL show Marketing/Engineering dashboard widgets
2. WHEN a manager with department_scope=['administration', 'finance'] logs in, THE RBAC_System SHALL show Admin/Finance dashboard widgets
3. WHEN a manager with department_scope=['operations', 'assets'] logs in, THE RBAC_System SHALL show Operations dashboard widgets
4. THE RBAC_System SHALL filter data visibility based on manager's department_scope
5. THE RBAC_System SHALL allow managers to view all records within their department scope
6. THE RBAC_System SHALL hide records outside manager's department scope unless explicitly shared

### Requirement 4: Customer & Marketing Module Permissions

**User Story:** As a user, I want appropriate access to customer and marketing data based on my role, so that I can perform my job functions while sensitive data remains protected.

#### Acceptance Criteria

1. WHEN a user with role in [owner, director, manager, marketing] accesses Customer List, THE RBAC_System SHALL grant Full_Access
2. WHEN a user with role in [administration, finance, ops, hr, hse, engineer] accesses Customer List, THE RBAC_System SHALL grant Read_Access only
3. WHEN a user with role in [owner, director, manager, marketing] attempts to create a Customer, THE RBAC_System SHALL allow the operation
4. WHEN a user with role in [owner, director, sysadmin] attempts to delete a Customer, THE RBAC_System SHALL allow the operation
5. WHEN a user with role "marketing" views Customer Financial History, THE RBAC_System SHALL show Partial_Access (limited fields)
6. WHEN a user with role in [owner, director, manager, marketing, engineer] accesses Quotation List, THE RBAC_System SHALL grant Full_Access
7. WHEN a user with role "ops" accesses Quotation List, THE RBAC_System SHALL deny access completely
8. WHEN a user with role in [owner, director, manager] attempts to approve a Quotation, THE RBAC_System SHALL allow the operation

### Requirement 5: Quotation Cost Estimation for Marketing

**User Story:** As a marketing user, I want to structure cost estimates when creating quotations, so that I can build accurate pricing for customers.

#### Acceptance Criteria

1. WHEN a user with role "marketing" creates a Quotation, THE RBAC_System SHALL grant access to cost estimation tools
2. WHEN a user with role "marketing" views Quotation Cost Items, THE RBAC_System SHALL show estimated costs (not actual job costs)
3. WHEN a user with role "marketing" views historical cost data, THE RBAC_System SHALL show aggregated/averaged data only (not specific job costs)
4. WHEN a user with role "marketing" requests engineering assessment, THE RBAC_System SHALL allow the operation
5. WHEN a user with role "marketing" views Job Order actual costs, THE RBAC_System SHALL deny access
6. THE RBAC_System SHALL distinguish between "estimated costs" (visible to marketing) and "actual costs" (hidden from marketing)

### Requirement 6: Projects & PJO Module Permissions

**User Story:** As a user, I want appropriate access to project and PJO data based on my role, so that project management and financial planning are properly controlled.

#### Acceptance Criteria

1. WHEN a user with role in [owner, director, manager, marketing, engineer] accesses Project List, THE RBAC_System SHALL grant Full_Access
2. WHEN a user with role in [administration, finance, ops, hr, hse] accesses Project List, THE RBAC_System SHALL grant Read_Access only
3. WHEN a user with role "ops" views PJO List, THE RBAC_System SHALL show Partial_Access (costs only, no revenue)
4. WHEN a user with role in [owner, director, manager, administration, finance] views PJO List, THE RBAC_System SHALL grant Full_Access including revenue
5. WHEN a user with role in [owner, director, manager, administration] attempts to create a PJO, THE RBAC_System SHALL allow the operation
6. WHEN a user with role "ops" views PJO Revenue Items, THE RBAC_System SHALL deny access
7. WHEN a user with role "ops" views PJO Cost Items, THE RBAC_System SHALL grant Read_Access only
8. WHEN a user with role in [owner, director] attempts to approve a PJO, THE RBAC_System SHALL allow the operation
9. WHEN a user with role "manager" attempts to check/review a PJO, THE RBAC_System SHALL allow the operation
10. WHEN a user with role "manager" attempts to approve a PJO, THE RBAC_System SHALL deny the operation

### Requirement 7: Job Orders Module Permissions

**User Story:** As a user, I want appropriate access to job order data based on my role, so that operations can execute jobs while financial data remains protected.

#### Acceptance Criteria

1. WHEN a user with role in [owner, director, manager, ops] accesses Job Order List, THE RBAC_System SHALL grant Full_Access
2. WHEN a user with role in [administration, finance, marketing, hr, hse, engineer] accesses Job Order List, THE RBAC_System SHALL grant Read_Access only
3. WHEN a user with role in [owner, director, manager] attempts to create a JO from PJO, THE RBAC_System SHALL allow the operation
4. WHEN a user with role "ops" views JO Revenue Column, THE RBAC_System SHALL hide the field
5. WHEN a user with role "ops" views JO Profit Column, THE RBAC_System SHALL hide the field
6. WHEN a user with role in [owner, director, manager, administration, finance, ops] views JO Cost Budget, THE RBAC_System SHALL grant access
7. WHEN a user with role in [owner, director, manager, ops] attempts to add JO Expense, THE RBAC_System SHALL allow the operation
8. WHEN a user with role in [owner, director] attempts to approve final JO (after costs collected), THE RBAC_System SHALL allow the operation
9. WHEN a user with role "manager" attempts to check/review final JO, THE RBAC_System SHALL allow the operation
10. WHEN a user with role in [owner, director, manager, ops] attempts to create Berita Acara, THE RBAC_System SHALL allow the operation
11. WHEN a user with role in [owner, director, manager, ops] attempts to create Surat Jalan, THE RBAC_System SHALL allow the operation

### Requirement 8: Finance Module Permissions

**User Story:** As a user, I want appropriate access to financial data based on my role, so that sensitive financial information is protected while authorized users can manage billing and payments.

#### Acceptance Criteria

1. WHEN a user with role in [owner, director, manager, administration, finance] accesses Invoice List, THE RBAC_System SHALL grant Full_Access
2. WHEN a user with role in [ops, marketing, hr, hse, engineer] accesses Invoice List, THE RBAC_System SHALL deny access
3. WHEN a user with role in [owner, director, manager, administration, finance] attempts to create an Invoice, THE RBAC_System SHALL allow the operation
4. WHEN a user with role in [owner, director, manager, finance] accesses Payment List (BKM), THE RBAC_System SHALL grant Full_Access
5. WHEN a user with role in [owner, director, manager, administration, finance] accesses Disbursement (BKK), THE RBAC_System SHALL grant Full_Access
6. WHEN a user with role in [owner, director] attempts to approve BKK, THE RBAC_System SHALL allow the operation
7. WHEN a user with role "manager" attempts to check/review BKK, THE RBAC_System SHALL allow the operation
8. WHEN a user with role "manager" attempts to approve BKK, THE RBAC_System SHALL deny the operation
9. WHEN a user with role in [owner, director, manager, finance] accesses AR Aging Report, THE RBAC_System SHALL grant access
10. WHEN a user with role in [owner, director, manager, finance] accesses Profit Reports, THE RBAC_System SHALL grant access
11. WHEN a user with role "marketing" accesses Revenue Reports, THE RBAC_System SHALL grant Read_Access only (no profit data)

### Requirement 9: Equipment & Assets Module Permissions

**User Story:** As a user, I want appropriate access to equipment data based on my role, so that asset management and utilization tracking are properly controlled.

#### Acceptance Criteria

1. WHEN a user with role in [owner, director, manager, ops] accesses Asset List, THE RBAC_System SHALL grant Full_Access
2. WHEN a user with role in [administration, finance, hse, engineer] accesses Asset List, THE RBAC_System SHALL grant Read_Access only
3. WHEN a user with role in [marketing, hr] accesses Asset List, THE RBAC_System SHALL deny access
4. WHEN a user with role in [owner, director, manager] attempts to create an Asset, THE RBAC_System SHALL allow the operation
5. WHEN a user with role "ops" views Asset Value/Cost, THE RBAC_System SHALL deny access
6. WHEN a user with role in [owner, director, manager, ops] accesses Availability Calendar, THE RBAC_System SHALL grant access
7. WHEN a user with role in [owner, director, manager, ops] accesses Maintenance List, THE RBAC_System SHALL grant Full_Access
8. WHEN a user with role in [owner, director, manager, finance] accesses Utilization Reports, THE RBAC_System SHALL grant access
9. WHEN a user with role in [owner, director, manager, finance] accesses Depreciation, THE RBAC_System SHALL grant access

### Requirement 10: HR Module Permissions

**User Story:** As a user, I want appropriate access to HR data based on my role, so that employee information and payroll data are protected.

#### Acceptance Criteria

1. WHEN a user with role in [owner, director, manager, hr] accesses Employee List, THE RBAC_System SHALL grant Full_Access
2. WHEN a user with role "finance" accesses Employee List, THE RBAC_System SHALL show Partial_Access (for payroll processing)
3. WHEN a user with role in [administration, ops, marketing, hse, engineer] accesses Employee List, THE RBAC_System SHALL grant Own_Access only
4. WHEN a user with role in [owner, director, sysadmin, hr] attempts to create an Employee, THE RBAC_System SHALL allow the operation
5. WHEN a user with role in [owner, director, hr] views Employee Salary, THE RBAC_System SHALL grant access
6. WHEN a user with role "finance" views Employee Salary, THE RBAC_System SHALL show Partial_Access (for payroll)
7. WHEN any authenticated user accesses their own Attendance, THE RBAC_System SHALL grant Own_Access
8. WHEN a user with role in [owner, director, manager, hr] accesses Attendance View All, THE RBAC_System SHALL grant access
9. WHEN a user with role in [owner, director, manager, hr] attempts to approve Leave Requests, THE RBAC_System SHALL allow the operation
10. WHEN a user with role in [owner, director, hr, finance] accesses Payroll, THE RBAC_System SHALL grant Full_Access

### Requirement 11: HSE Module Permissions

**User Story:** As a user, I want appropriate access to HSE data based on my role, so that safety incidents can be reported and tracked.

#### Acceptance Criteria

1. WHEN a user with role in [owner, director, manager, ops, hse] accesses Incident List, THE RBAC_System SHALL grant Full_Access
2. WHEN a user with role in [owner, director, manager, ops, hse] attempts to create an Incident Report, THE RBAC_System SHALL allow the operation
3. WHEN a user with role in [owner, director, manager, hse] attempts to investigate an Incident, THE RBAC_System SHALL allow the operation
4. WHEN a user with role "ops" attempts to investigate an Incident, THE RBAC_System SHALL deny the operation
5. WHEN a user with role in [owner, director, manager, hr, hse] accesses Training Records (all), THE RBAC_System SHALL grant Full_Access
6. WHEN a user with role in [owner, director, manager, ops, hse] accesses Inspections, THE RBAC_System SHALL grant Full_Access
7. WHEN a user with role in [owner, director, manager, hse] accesses PPE Management, THE RBAC_System SHALL grant Full_Access
8. WHEN a user with role "ops" accesses PPE Management, THE RBAC_System SHALL grant Read_Access only

### Requirement 12: Engineering Module Permissions

**User Story:** As a user, I want appropriate access to engineering data based on my role, so that technical assessments are properly controlled.

#### Acceptance Criteria

1. WHEN a user with role in [owner, director, manager, engineer] accesses Survey List, THE RBAC_System SHALL grant Full_Access
2. WHEN a user with role in [ops, marketing] accesses Survey List, THE RBAC_System SHALL grant Read_Access only
3. WHEN a user with role in [owner, director, manager, engineer] attempts to create a Survey, THE RBAC_System SHALL allow the operation
4. WHEN a user with role in [owner, director, manager, ops, engineer] accesses JMP List, THE RBAC_System SHALL grant Full_Access
5. WHEN a user with role in [owner, director, manager, engineer] attempts to create a JMP, THE RBAC_System SHALL allow the operation
6. WHEN a user with role in [owner, director, manager, engineer] accesses Drawings, THE RBAC_System SHALL grant Full_Access
7. WHEN a user with role "ops" accesses Drawings, THE RBAC_System SHALL grant Read_Access only
8. WHEN a user with role in [owner, director, manager, engineer] accesses Technical Assessments, THE RBAC_System SHALL grant Full_Access
9. WHEN a user with role "engineer" reviews complex Quotations, THE RBAC_System SHALL grant access to engineering assessment fields

### Requirement 13: Reports & Dashboards Permissions

**User Story:** As a user, I want access to dashboards and reports appropriate to my role, so that I can view relevant business intelligence.

#### Acceptance Criteria

1. WHEN a user with role in [owner, director] accesses Executive Dashboard, THE RBAC_System SHALL grant Full_Access
2. WHEN a user with role "manager" accesses Dashboard, THE RBAC_System SHALL show department-scoped widgets based on department_scope
3. WHEN a user with role in [owner, director, finance] accesses Finance Dashboard, THE RBAC_System SHALL grant Full_Access
4. WHEN a user with role in [owner, director, manager, ops] accesses Operations Dashboard, THE RBAC_System SHALL grant access
5. WHEN a user with role in [owner, director, manager, marketing] accesses Marketing Dashboard, THE RBAC_System SHALL grant access
6. WHEN a user with role "hr" accesses HR Dashboard, THE RBAC_System SHALL grant Full_Access
7. WHEN a user with role "hse" accesses HSE Dashboard, THE RBAC_System SHALL grant Full_Access
8. WHEN a user with role "engineer" accesses Engineering Dashboard, THE RBAC_System SHALL grant Full_Access
9. WHEN a user with role "marketing" accesses Revenue Reports, THE RBAC_System SHALL show Partial_Access (no profit data)
10. WHEN a user with role not in [owner, director, manager, finance] accesses Profit Reports, THE RBAC_System SHALL deny access

### Requirement 14: System Administration Permissions

**User Story:** As a system administrator, I want exclusive access to system administration features, so that critical system functions are protected.

#### Acceptance Criteria

1. WHEN a user with role in [owner, director, sysadmin] accesses User Management, THE RBAC_System SHALL grant Full_Access
2. WHEN a user with role not in [owner, director, sysadmin] accesses User Management, THE RBAC_System SHALL deny access
3. WHEN a user with role "sysadmin" attempts to modify owner account, THE RBAC_System SHALL deny the operation
4. WHEN a user with role in [owner, director, sysadmin] accesses Audit Logs, THE RBAC_System SHALL grant access
5. WHEN a user with role in [owner, sysadmin] accesses System Settings, THE RBAC_System SHALL grant access
6. WHEN a user with role in [owner, sysadmin] accesses Backup/Restore, THE RBAC_System SHALL grant access

### Requirement 15: Field-Level Hiding for Operations Role

**User Story:** As a system administrator, I want specific financial fields hidden from operations users, so that revenue and profit data remains confidential.

#### Acceptance Criteria

1. WHEN a user with role "ops" views Job Orders, THE Field_Mask SHALL hide: total_revenue, revenue_items, profit, profit_margin, invoice_amount, quoted_price
2. WHEN a user with role "ops" views PJO, THE Field_Mask SHALL hide: total_revenue, revenue_items, profit_margin, expected_profit
3. WHEN a user with role "ops" navigates the system, THE Navigation_Filter SHALL hide the entire Invoices module
4. WHEN a user with role "ops" navigates the system, THE Navigation_Filter SHALL hide the entire Payments module
5. WHEN a user with role "ops" navigates the system, THE Navigation_Filter SHALL hide Revenue Reports page
6. WHEN a user with role "ops" navigates the system, THE Navigation_Filter SHALL hide Profit Reports page

### Requirement 16: Field-Level Hiding for Marketing Role

**User Story:** As a system administrator, I want specific cost fields hidden from marketing users, so that vendor pricing and actual expenses remain confidential.

#### Acceptance Criteria

1. WHEN a user with role "marketing" views any record, THE Field_Mask SHALL hide: job_cost_details, vendor_pricing, actual_expenses, profit_margin
2. WHEN a user with role "marketing" views Quotations, THE RBAC_System SHALL grant access to cost estimation fields (not actual costs)
3. WHEN a user with role "marketing" views Customer Financial History, THE Field_Mask SHALL show limited fields only

### Requirement 17: Navigation Menu by Role

**User Story:** As a user, I want to see only navigation items relevant to my role, so that the interface is clean and focused.

#### Acceptance Criteria

1. WHEN a user with role "owner" views the sidebar, THE Navigation_Filter SHALL show all menu items
2. WHEN a user with role "director" views the sidebar, THE Navigation_Filter SHALL show all menu items except system settings
3. WHEN a user with role "manager" views the sidebar, THE Navigation_Filter SHALL show department-scoped menu items
4. WHEN a user with role "sysadmin" views the sidebar, THE Navigation_Filter SHALL show: Dashboard, Users, System Settings, Audit Logs
5. WHEN a user with role "administration" views the sidebar, THE Navigation_Filter SHALL show: Dashboard, Customers, Projects, Quotations, PJO, Job Orders, Invoices
6. WHEN a user with role "finance" views the sidebar, THE Navigation_Filter SHALL show: Dashboard (Finance), Invoices, Payments, AR/AP, Payroll, Reports (Finance)
7. WHEN a user with role "marketing" views the sidebar, THE Navigation_Filter SHALL show: Dashboard (Marketing), Customers, Quotations, Pipeline, Projects
8. WHEN a user with role "ops" views the sidebar, THE Navigation_Filter SHALL show: Dashboard (Operations), Job Orders, Equipment, HSE, Vendors
9. WHEN a user with role "ops" views the sidebar, THE Navigation_Filter SHALL NOT show: Invoices, Payments, Quotations, PJO
10. WHEN a user with role "engineer" views the sidebar, THE Navigation_Filter SHALL show: Dashboard (Engineering), Surveys, JMP, Drawings, Assessments, Quotations (review)
11. WHEN a user with role "hr" views the sidebar, THE Navigation_Filter SHALL show: Dashboard (HR), Employees, Attendance, Leave, Payroll, Training
12. WHEN a user with role "hse" views the sidebar, THE Navigation_Filter SHALL show: Dashboard (HSE), Incidents, Audits, Training, PPE, Permits

### Requirement 18: Database Query Patterns

**User Story:** As a developer, I want standardized query patterns for role-based field selection, so that data access is consistently enforced.

#### Acceptance Criteria

1. WHEN querying Job Orders for a user with role "ops", THE RBAC_System SHALL exclude revenue fields from the SELECT statement
2. WHEN querying Job Orders for a user with role in [owner, director, manager, finance], THE RBAC_System SHALL include all fields
3. THE RBAC_System SHALL implement RLS policies that enforce role-based access at the database level
4. THE RBAC_System SHALL provide database views for ops role that exclude revenue fields

### Requirement 19: Permission Serialization

**User Story:** As a developer, I want to serialize and deserialize permission configurations, so that role permissions can be stored and retrieved consistently.

#### Acceptance Criteria

1. THE RBAC_System SHALL serialize permission configurations to JSON format
2. THE RBAC_System SHALL deserialize JSON permission configurations back to permission objects
3. FOR ALL valid permission configurations, serializing then deserializing SHALL produce an equivalent configuration


### Requirement 20: Manager Permission Inheritance

**User Story:** As a manager, I want to perform any task my team can do when needed, so that work doesn't stop when staff are busy or unavailable.

#### Acceptance Criteria

1. WHEN a manager with department_scope=['marketing', 'engineering'] attempts to create a Quotation, THE RBAC_System SHALL allow the operation (inherits marketing permissions)
2. WHEN a manager with department_scope=['administration', 'finance'] attempts to create a PJO, THE RBAC_System SHALL allow the operation (inherits administration permissions)
3. WHEN a manager with department_scope=['operations', 'assets'] attempts to add a Job Expense, THE RBAC_System SHALL allow the operation (inherits ops permissions)
4. WHEN a manager attempts an action outside their department_scope, THE RBAC_System SHALL deny the operation
5. WHEN a manager performs an action via inheritance, THE Audit_Log SHALL record the manager's identity (not the inherited role)
6. THE RBAC_System SHALL map departments to staff roles: marketing→marketing, engineering→engineer, administration→administration, finance→finance, operations→ops, assets→ops, hr→hr, hse→hse

### Requirement 21: Comprehensive Audit Trail

**User Story:** As a company owner, I want every action logged with full details, so that I can track who did what and when for accountability.

#### Acceptance Criteria

1. FOR ALL create, update, delete operations, THE Audit_System SHALL log: user_id, user_name, user_role, action, module, record_id, timestamp
2. FOR ALL update operations, THE Audit_System SHALL log: old_values, new_values, changes_summary
3. FOR ALL workflow transitions (submit, check, approve, reject), THE Audit_System SHALL log: workflow_status_from, workflow_status_to
4. THE Audit_System SHALL capture: ip_address, user_agent for security tracking
5. THE Audit_System SHALL provide query capabilities by: user, record, module, action, date range
6. THE Audit_System SHALL retain logs for a minimum of 7 years (regulatory compliance)
7. WHEN viewing a record's history, THE System SHALL display all audit entries in chronological order
8. THE Audit_System SHALL be tamper-proof (no delete/update allowed on audit_logs table)
