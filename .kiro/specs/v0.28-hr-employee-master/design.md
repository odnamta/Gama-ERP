# Design Document: HR Employee Master Data

## Overview

This design document describes the implementation of the HR Employee Master Data module (v0.28) for the Gama ERP system. The module provides foundational HR functionality including employee record management, organizational structure (departments and positions), and integration with the existing authentication and permission systems.

The implementation follows existing patterns in the codebase, particularly those established by the Vendor Management module, ensuring consistency in code structure, UI components, and permission handling.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Next.js App Router                          │
├─────────────────────────────────────────────────────────────────────┤
│  /hr/employees          - Employee list page                        │
│  /hr/employees/new      - Create employee form                      │
│  /hr/employees/[id]     - Employee detail view                      │
│  /hr/employees/[id]/edit - Edit employee form                       │
├─────────────────────────────────────────────────────────────────────┤
│                      Components Layer                               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │
│  │EmployeeTable │ │EmployeeForm  │ │EmployeeDetail│                │
│  └──────────────┘ └──────────────┘ └──────────────┘                │
├─────────────────────────────────────────────────────────────────────┤
│                      Utilities Layer                                │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │
│  │employee-utils│ │ permissions  │ │  navigation  │                │
│  └──────────────┘ └──────────────┘ └──────────────┘                │
├─────────────────────────────────────────────────────────────────────┤
│                      Supabase Layer                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │
│  │  employees   │ │ departments  │ │  positions   │                │
│  └──────────────┘ └──────────────┘ └──────────────┘                │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. User navigates to `/hr/employees`
2. Server component fetches employee data via Supabase
3. Data passed to client components for rendering
4. User actions trigger server actions for mutations
5. UI updates via revalidation

## Components and Interfaces

### Type Definitions (`types/employees.ts`)

```typescript
// Employment types
export type EmploymentType = 'permanent' | 'contract' | 'probation' | 'intern' | 'outsource';

// Employee status
export type EmployeeStatus = 'active' | 'on_leave' | 'suspended' | 'resigned' | 'terminated';

// Gender
export type Gender = 'male' | 'female';

// Marital status
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed';

// Position level
export type PositionLevel = 1 | 2 | 3 | 4 | 5;

// Department interface
export interface Department {
  id: string;
  department_code: string;
  department_name: string;
  parent_department_id: string | null;
  manager_id: string | null;
  is_active: boolean;
  created_at: string;
}

// Position interface
export interface Position {
  id: string;
  position_code: string;
  position_name: string;
  department_id: string | null;
  salary_min: number | null;
  salary_max: number | null;
  level: PositionLevel;
  is_active: boolean;
  created_at: string;
}

// Employee document
export interface EmployeeDocument {
  type: string;
  url: string;
  expiry: string | null;
}

// Employee interface
export interface Employee {
  id: string;
  employee_code: string;
  user_id: string | null;
  full_name: string;
  nickname: string | null;
  id_number: string | null;
  tax_id: string | null;
  date_of_birth: string | null;
  place_of_birth: string | null;
  gender: Gender | null;
  religion: string | null;
  marital_status: MaritalStatus | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  department_id: string | null;
  position_id: string | null;
  employment_type: EmploymentType;
  join_date: string;
  end_date: string | null;
  reporting_to: string | null;
  base_salary: number | null;
  salary_currency: string;
  bank_name: string | null;
  bank_account: string | null;
  bank_account_name: string | null;
  status: EmployeeStatus;
  resignation_date: string | null;
  resignation_reason: string | null;
  photo_url: string | null;
  documents: EmployeeDocument[];
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Employee with relations for display
export interface EmployeeWithRelations extends Employee {
  department: Department | null;
  position: Position | null;
  reporting_manager: { full_name: string } | null;
}

// Employee summary stats
export interface EmployeeSummaryStats {
  total: number;
  active: number;
  onLeave: number;
  newThisMonth: number;
}

// Employee filters
export interface EmployeeFilters {
  departmentId?: string;
  status?: EmployeeStatus;
  search?: string;
}

// Employee form data
export interface EmployeeFormData {
  full_name: string;
  nickname?: string;
  id_number?: string;
  tax_id?: string;
  date_of_birth?: string;
  place_of_birth?: string;
  gender?: Gender;
  religion?: string;
  marital_status?: MaritalStatus;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  department_id?: string;
  position_id?: string;
  employment_type: EmploymentType;
  join_date: string;
  end_date?: string;
  reporting_to?: string;
  base_salary?: number;
  bank_name?: string;
  bank_account?: string;
  bank_account_name?: string;
  photo_url?: string;
  notes?: string;
  create_user_account?: boolean;
  user_role?: string;
}
```

### Utility Functions (`lib/employee-utils.ts`)

```typescript
// Employment type options
export const EMPLOYMENT_TYPES: { value: EmploymentType; label: string }[];

// Employee status options
export const EMPLOYEE_STATUSES: { value: EmployeeStatus; label: string }[];

// Gender options
export const GENDERS: { value: Gender; label: string }[];

// Marital status options
export const MARITAL_STATUSES: { value: MaritalStatus; label: string }[];

// Position level labels
export const POSITION_LEVELS: { value: PositionLevel; label: string }[];

// Generate employee code
export function generateEmployeeCode(count: number): string;

// Get employment type label
export function getEmploymentTypeLabel(type: EmploymentType): string;

// Get employee status label
export function getEmployeeStatusLabel(status: EmployeeStatus): string;

// Calculate employee summary stats
export function calculateEmployeeSummaryStats(employees: Employee[]): EmployeeSummaryStats;

// Filter employees by search term
export function filterEmployeesBySearch<T extends { full_name: string; employee_code: string }>(
  employees: T[],
  search: string
): T[];

// Validate employee code format
export function isValidEmployeeCode(code: string): boolean;

// Check if employee can be linked to user
export function canLinkToUser(employee: Employee): boolean;

// Format salary for display
export function formatSalary(amount: number | null, currency?: string): string;

// Detect circular reporting
export function hasCircularReporting(
  employeeId: string,
  reportingTo: string,
  employees: Employee[]
): boolean;
```

### Permission Extensions (`lib/permissions.ts`)

Add HR-specific feature keys and permission helpers:

```typescript
// New feature keys
| 'employees.view'
| 'employees.create'
| 'employees.edit'
| 'employees.delete'
| 'employees.view_salary'
| 'employees.edit_salary'
| 'employees.nav'

// Permission mapping
'employees.view': (p) => ['owner', 'admin', 'hr'].includes(p.role) || 
                         (p.role === 'manager'), // managers see own dept
'employees.create': (p) => ['owner', 'admin', 'hr'].includes(p.role),
'employees.edit': (p) => ['owner', 'admin', 'hr'].includes(p.role),
'employees.delete': (p) => ['owner', 'admin'].includes(p.role),
'employees.view_salary': (p) => ['owner', 'admin', 'hr', 'finance'].includes(p.role),
'employees.edit_salary': (p) => ['owner', 'admin'].includes(p.role),
'employees.nav': (p) => ['owner', 'admin', 'hr', 'manager'].includes(p.role),
```

### Server Actions (`app/(main)/hr/employees/actions.ts`)

```typescript
'use server'

// Get all employees with filters
export async function getEmployees(filters?: EmployeeFilters): Promise<EmployeeWithRelations[]>;

// Get single employee by ID
export async function getEmployee(id: string): Promise<EmployeeWithRelations | null>;

// Create new employee
export async function createEmployee(data: EmployeeFormData): Promise<{ success: boolean; employee?: Employee; error?: string }>;

// Update employee
export async function updateEmployee(id: string, data: Partial<EmployeeFormData>): Promise<{ success: boolean; error?: string }>;

// Update employee status
export async function updateEmployeeStatus(id: string, status: EmployeeStatus, reason?: string): Promise<{ success: boolean; error?: string }>;

// Link employee to user account
export async function linkEmployeeToUser(employeeId: string, userId: string): Promise<{ success: boolean; error?: string }>;

// Get all departments
export async function getDepartments(): Promise<Department[]>;

// Get all positions
export async function getPositions(departmentId?: string): Promise<Position[]>;

// Get employee count for code generation
export async function getEmployeeCount(): Promise<number>;
```

### React Components

#### EmployeeTable (`components/employees/employee-table.tsx`)

Displays employees in a table with columns: Code, Name, Department, Position, Join Date, Status, Actions.

#### EmployeeForm (`components/employees/employee-form.tsx`)

Multi-section form for creating/editing employees with:
- Personal Information section
- Contact Information section
- Emergency Contact section
- Employment Details section
- Compensation section (permission-gated)
- System Access section

#### EmployeeDetailView (`components/employees/employee-detail-view.tsx`)

Displays complete employee information organized by sections with permission-based visibility for salary data.

#### EmployeeSummaryCards (`components/employees/employee-summary-cards.tsx`)

Displays summary statistics: Total, Active, On Leave, New (MTD).

#### EmployeeFilters (`components/employees/employee-filters.tsx`)

Filter controls for department, status, and search.

## Data Models

### Database Schema

#### departments table
```sql
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_code VARCHAR(20) UNIQUE NOT NULL,
  department_name VARCHAR(100) NOT NULL,
  parent_department_id UUID REFERENCES departments(id),
  manager_id UUID,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### positions table
```sql
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_code VARCHAR(20) UNIQUE NOT NULL,
  position_name VARCHAR(100) NOT NULL,
  department_id UUID REFERENCES departments(id),
  salary_min DECIMAL(15,2),
  salary_max DECIMAL(15,2),
  level INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### employees table
```sql
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  employee_code VARCHAR(20) UNIQUE NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  nickname VARCHAR(50),
  id_number VARCHAR(30),
  tax_id VARCHAR(30),
  date_of_birth DATE,
  place_of_birth VARCHAR(100),
  gender VARCHAR(10),
  religion VARCHAR(30),
  marital_status VARCHAR(20),
  phone VARCHAR(50),
  email VARCHAR(100),
  address TEXT,
  city VARCHAR(100),
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(50),
  emergency_contact_relation VARCHAR(50),
  department_id UUID REFERENCES departments(id),
  position_id UUID REFERENCES positions(id),
  employment_type VARCHAR(30) DEFAULT 'permanent',
  join_date DATE NOT NULL,
  end_date DATE,
  reporting_to UUID REFERENCES employees(id),
  base_salary DECIMAL(15,2),
  salary_currency VARCHAR(3) DEFAULT 'IDR',
  bank_name VARCHAR(100),
  bank_account VARCHAR(50),
  bank_account_name VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active',
  resignation_date DATE,
  resignation_reason TEXT,
  photo_url VARCHAR(500),
  documents JSONB DEFAULT '[]',
  notes TEXT,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security Policies

```sql
-- Employees: View access for HR roles
CREATE POLICY "employees_select_policy" ON employees
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM user_profiles 
      WHERE role IN ('owner', 'admin', 'hr')
    )
    OR
    -- Managers can see their department
    (auth.uid() IN (
      SELECT user_id FROM user_profiles WHERE role = 'manager'
    ) AND department_id IN (
      SELECT department_id FROM employees WHERE user_id = auth.uid()
    ))
  );

-- Employees: Insert for HR roles
CREATE POLICY "employees_insert_policy" ON employees
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM user_profiles 
      WHERE role IN ('owner', 'admin', 'hr')
    )
  );

-- Employees: Update for HR roles
CREATE POLICY "employees_update_policy" ON employees
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM user_profiles 
      WHERE role IN ('owner', 'admin', 'hr')
    )
  );

-- Employees: Delete only for owner/admin
CREATE POLICY "employees_delete_policy" ON employees
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM user_profiles 
      WHERE role IN ('owner', 'admin')
    )
  );
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Employee Code Generation and Uniqueness

*For any* employee created in the system, the auto-generated employee_code SHALL match the format `EMP-XXX` (where XXX is a zero-padded number) AND be unique across all employees in the database.

**Validates: Requirements 3.1**

### Property 2: Required Field Validation

*For any* employee creation attempt, IF full_name is empty or null OR join_date is empty or null, THEN the creation SHALL fail with a validation error.

**Validates: Requirements 3.2**

### Property 3: Employee Data Round-Trip

*For any* valid employee data object, creating an employee and then retrieving it by ID SHALL return an employee with equivalent field values (excluding auto-generated fields like id, employee_code, created_at, updated_at).

**Validates: Requirements 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9**

### Property 4: Updated Timestamp Auto-Update

*For any* employee update operation, the updated_at timestamp of the resulting employee record SHALL be greater than or equal to the updated_at timestamp before the update.

**Validates: Requirements 4.1**

### Property 5: Employee Code Immutability

*For any* employee update operation that attempts to change the employee_code, the employee_code SHALL remain unchanged after the operation.

**Validates: Requirements 4.2**

### Property 6: Status Validation and Defaults

*For any* employee, the status field SHALL be one of: 'active', 'on_leave', 'suspended', 'resigned', 'terminated'. *For any* newly created employee without an explicit status, the status SHALL default to 'active'.

**Validates: Requirements 5.1, 5.2**

### Property 7: Soft Delete Behavior

*For any* employee "deletion" operation, the employee record SHALL still exist in the database with status changed to 'terminated' or 'resigned', rather than being physically removed.

**Validates: Requirements 5.3**

### Property 8: Summary Statistics Calculation

*For any* list of employees, the calculated summary statistics SHALL satisfy:
- total = count of all employees
- active = count of employees where status = 'active'
- onLeave = count of employees where status = 'on_leave'
- newThisMonth = count of employees where join_date is within current month

**Validates: Requirements 6.1**

### Property 9: Filter Correctness

*For any* employee list query with filters:
- IF search term is provided, THEN all returned employees SHALL have full_name OR employee_code containing the search term (case-insensitive)
- IF department filter is provided, THEN all returned employees SHALL have the specified department_id
- IF status filter is provided, THEN all returned employees SHALL have the specified status

**Validates: Requirements 6.3, 6.4, 6.5**

### Property 10: Salary Visibility Based on Permissions

*For any* user viewing employee data:
- IF user role is in ['owner', 'admin', 'hr', 'finance'], THEN salary fields SHALL be visible
- IF user role is NOT in ['owner', 'admin', 'hr', 'finance'], THEN salary fields SHALL be hidden/null

**Validates: Requirements 7.5, 7.6, 9.8**

### Property 11: Circular Reporting Prevention

*For any* employee with a reporting_to relationship, following the chain of reporting_to references SHALL never return to the original employee (no cycles in the reporting graph).

**Validates: Requirements 11.3**

### Property 12: Position Level Bounds

*For any* position in the system, the level field SHALL be an integer between 1 and 5 inclusive.

**Validates: Requirements 2.3**

## Error Handling

### Validation Errors

| Error Code | Condition | User Message |
|------------|-----------|--------------|
| `EMPLOYEE_NAME_REQUIRED` | full_name is empty | "Employee name is required" |
| `EMPLOYEE_JOIN_DATE_REQUIRED` | join_date is empty | "Join date is required" |
| `EMPLOYEE_CODE_EXISTS` | Duplicate employee_code | "Employee code already exists" |
| `INVALID_DEPARTMENT` | department_id not found | "Selected department does not exist" |
| `INVALID_POSITION` | position_id not found | "Selected position does not exist" |
| `INVALID_REPORTING_TO` | reporting_to not found | "Selected manager does not exist" |
| `CIRCULAR_REPORTING` | Circular reporting detected | "Cannot set reporting manager: would create circular reporting" |
| `INVALID_STATUS` | Invalid status value | "Invalid employee status" |
| `INVALID_EMPLOYMENT_TYPE` | Invalid employment type | "Invalid employment type" |

### Permission Errors

| Error Code | Condition | User Message |
|------------|-----------|--------------|
| `UNAUTHORIZED_VIEW` | User lacks view permission | "You don't have permission to view employees" |
| `UNAUTHORIZED_CREATE` | User lacks create permission | "You don't have permission to create employees" |
| `UNAUTHORIZED_EDIT` | User lacks edit permission | "You don't have permission to edit employees" |
| `UNAUTHORIZED_DELETE` | User lacks delete permission | "You don't have permission to delete employees" |
| `UNAUTHORIZED_SALARY` | User lacks salary view permission | "You don't have permission to view salary information" |

### Database Errors

| Error Code | Condition | User Message |
|------------|-----------|--------------|
| `DB_CONNECTION_ERROR` | Database connection failed | "Unable to connect to database. Please try again." |
| `DB_CONSTRAINT_VIOLATION` | Unique constraint violated | "A record with this value already exists" |
| `DB_FOREIGN_KEY_ERROR` | Foreign key constraint failed | "Referenced record does not exist" |

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples and edge cases:

1. **Employee Code Generation**
   - Test code format matches EMP-XXX pattern
   - Test sequential numbering
   - Test padding (EMP-001, EMP-010, EMP-100)

2. **Validation Functions**
   - Test required field validation
   - Test status enum validation
   - Test employment type validation
   - Test position level bounds

3. **Utility Functions**
   - Test `formatSalary()` with various inputs
   - Test `getEmploymentTypeLabel()` for all types
   - Test `getEmployeeStatusLabel()` for all statuses
   - Test `filterEmployeesBySearch()` with edge cases

4. **Summary Statistics**
   - Test with empty employee list
   - Test with mixed statuses
   - Test month boundary for new employees

5. **Circular Reporting Detection**
   - Test direct self-reference
   - Test two-level cycle
   - Test deep cycle
   - Test valid chain

### Property-Based Tests

Property-based tests will use `fast-check` library with minimum 100 iterations per test.

Each property test will be tagged with:
```typescript
// Feature: hr-employee-master, Property N: [property description]
```

**Test Configuration:**
- Library: `fast-check`
- Minimum iterations: 100
- Shrinking: enabled for counterexample minimization

**Property Test Files:**
- `__tests__/employee-utils.property.test.ts` - Utility function properties
- `__tests__/employee-validation.property.test.ts` - Validation properties
- `__tests__/employee-permissions.property.test.ts` - Permission properties

### Integration Tests

Integration tests will verify end-to-end flows:

1. **CRUD Operations**
   - Create employee → verify in database
   - Update employee → verify changes persisted
   - Soft delete → verify status changed

2. **Permission Flows**
   - Test each role's access to employee list
   - Test salary visibility per role
   - Test create/edit/delete permissions per role

3. **Relationship Integrity**
   - Test department assignment
   - Test position assignment
   - Test reporting hierarchy

### Test Data Generators

For property-based testing, create generators for:

```typescript
// Valid employee name generator
const employeeNameArb = fc.string({ minLength: 1, maxLength: 200 })
  .filter(s => s.trim().length > 0);

// Valid date generator
const dateArb = fc.date({ min: new Date('1950-01-01'), max: new Date() })
  .map(d => d.toISOString().split('T')[0]);

// Employment type generator
const employmentTypeArb = fc.constantFrom(
  'permanent', 'contract', 'probation', 'intern', 'outsource'
);

// Employee status generator
const employeeStatusArb = fc.constantFrom(
  'active', 'on_leave', 'suspended', 'resigned', 'terminated'
);

// Position level generator
const positionLevelArb = fc.integer({ min: 1, max: 5 });

// Valid employee generator
const employeeArb = fc.record({
  full_name: employeeNameArb,
  join_date: dateArb,
  employment_type: employmentTypeArb,
  status: employeeStatusArb,
  // ... other optional fields
});
```
