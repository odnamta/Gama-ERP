# Design Document: Complete RBAC Matrix

## Overview

This design implements a comprehensive hierarchical RBAC system for GAMA ERP with 11 user roles, department-scoped manager access, and a Maker-Checker-Approver workflow pattern for financial documents.

**Supported Roles (11):**
1. **owner** - Full system access, final approver (Dio)
2. **director** - Executive oversight, can approve PJO/JO/BKK (Managing Director)
3. **manager** - Department head with department_scope attribute (Hutami, Feri, Reza)
4. **sysadmin** - IT administration, user management
5. **administration** - PJO preparation, invoices, document management
6. **finance** - Payments, AR/AP, payroll, BKK preparation
7. **marketing** - Customers, quotations, cost estimation (no actual costs)
8. **ops** - Job execution, NO revenue visibility
9. **engineer** - Surveys, JMP, drawings, technical assessments
10. **hr** - Employee management, attendance, payroll
11. **hse** - Health, Safety, Environment modules

**Key Workflow Pattern:**
- Maker: administration/finance prepares document
- Checker: manager reviews/checks document
- Approver: director/owner gives final approval

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Client Layer                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  PermissionProvider (Context) - Extended with 11 roles                   │
│    └── usePermissions() hook                                             │
│    └── <PermissionGate> component                                        │
│    └── <FieldMask> component - hides fields based on role                │
│    └── <WorkflowGate> component - controls Maker-Checker-Approver        │
│    └── <DepartmentScopedView> component - filters by manager scope       │
├─────────────────────────────────────────────────────────────────────────┤
│                           Server Layer                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  lib/permissions.ts - Extended DEFAULT_PERMISSIONS & FEATURE_MAP         │
│  lib/permissions-server.ts - Server-side permission checks               │
│  lib/rbac-matrix.ts - Centralized RBAC matrix definition                 │
│  lib/field-mask.ts - Field-level hiding rules                            │
│  lib/workflow-permissions.ts - Maker-Checker-Approver logic              │
├─────────────────────────────────────────────────────────────────────────┤
│                           Database Layer                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  user_profiles table - Extended with department_scope                    │
│  RLS policies with role-based field selection                            │
│  Database views for role-specific queries                                │
└─────────────────────────────────────────────────────────────────────────┘
```


## Components and Interfaces

### Extended Type Definitions

```typescript
// types/permissions.ts - Extended UserRole type

export type UserRole = 
  | 'owner' 
  | 'director'      // NEW - Managing Director
  | 'manager' 
  | 'sysadmin'
  | 'administration' // Renamed from 'admin'
  | 'finance'
  | 'marketing'      // Renamed from 'sales'
  | 'ops' 
  | 'hr'
  | 'hse'
  | 'engineer'

export type DepartmentScope = 
  | 'marketing'
  | 'engineering'
  | 'administration'
  | 'finance'
  | 'operations'
  | 'assets'
  | 'hr'
  | 'hse'

export type DashboardType = 
  | 'executive'      // owner, director
  | 'manager'        // department-scoped
  | 'marketing'
  | 'admin_finance'
  | 'operations'
  | 'engineering'
  | 'hr'
  | 'hse'
  | 'sysadmin'
  | 'default'

export interface UserProfile {
  id: string
  user_id: string
  role: UserRole
  department_scope?: DepartmentScope[]  // For managers
  custom_dashboard?: DashboardType
  // ... other fields
}
```

### Workflow Status Types

```typescript
// types/workflow.ts - Maker-Checker-Approver workflow

export type WorkflowStatus = 
  | 'draft'      // Created by Maker
  | 'checked'    // Reviewed by Checker (Manager)
  | 'approved'   // Approved by Approver (Director/Owner)
  | 'rejected'   // Rejected at any stage

export interface WorkflowTransition {
  from: WorkflowStatus
  to: WorkflowStatus
  allowedRoles: UserRole[]
  action: 'submit' | 'check' | 'approve' | 'reject'
}

export const PJO_WORKFLOW: WorkflowTransition[] = [
  { from: 'draft', to: 'checked', allowedRoles: ['manager', 'director', 'owner'], action: 'check' },
  { from: 'checked', to: 'approved', allowedRoles: ['director', 'owner'], action: 'approve' },
  { from: 'checked', to: 'rejected', allowedRoles: ['director', 'owner'], action: 'reject' },
  { from: 'draft', to: 'rejected', allowedRoles: ['manager', 'director', 'owner'], action: 'reject' },
]

export const JO_WORKFLOW: WorkflowTransition[] = [
  { from: 'draft', to: 'checked', allowedRoles: ['manager', 'director', 'owner'], action: 'check' },
  { from: 'checked', to: 'approved', allowedRoles: ['director', 'owner'], action: 'approve' },
  { from: 'checked', to: 'rejected', allowedRoles: ['director', 'owner'], action: 'reject' },
]

export const BKK_WORKFLOW: WorkflowTransition[] = [
  { from: 'draft', to: 'checked', allowedRoles: ['manager', 'director', 'owner'], action: 'check' },
  { from: 'checked', to: 'approved', allowedRoles: ['director', 'owner'], action: 'approve' },
  { from: 'checked', to: 'rejected', allowedRoles: ['director', 'owner'], action: 'reject' },
]
```


### Extended Default Permissions

```typescript
// lib/permissions.ts - Extended DEFAULT_PERMISSIONS

export const DEFAULT_PERMISSIONS: Record<UserRole, UserPermissions> = {
  owner: {
    can_see_revenue: true,
    can_see_profit: true,
    can_approve_pjo: true,
    can_approve_jo: true,
    can_approve_bkk: true,
    can_manage_invoices: true,
    can_manage_users: true,
    can_create_pjo: true,
    can_fill_costs: true,
  },
  director: {
    can_see_revenue: true,
    can_see_profit: true,
    can_approve_pjo: true,
    can_approve_jo: true,
    can_approve_bkk: true,
    can_manage_invoices: true,
    can_manage_users: true,
    can_create_pjo: true,
    can_fill_costs: true,
  },
  manager: {
    can_see_revenue: true,
    can_see_profit: true,
    can_approve_pjo: false,  // Can only CHECK, not approve
    can_approve_jo: false,   // Can only CHECK, not approve
    can_approve_bkk: false,  // Can only CHECK, not approve
    can_check_pjo: true,     // NEW: Can review/check
    can_check_jo: true,      // NEW: Can review/check
    can_check_bkk: true,     // NEW: Can review/check
    can_manage_invoices: false,
    can_manage_users: false,
    can_create_pjo: true,
    can_fill_costs: true,
  },
  sysadmin: {
    can_see_revenue: false,
    can_see_profit: false,
    can_approve_pjo: false,
    can_approve_jo: false,
    can_approve_bkk: false,
    can_manage_invoices: false,
    can_manage_users: true,
    can_create_pjo: false,
    can_fill_costs: false,
  },
  administration: {
    can_see_revenue: true,
    can_see_profit: false,
    can_approve_pjo: false,
    can_approve_jo: false,
    can_approve_bkk: false,
    can_manage_invoices: true,
    can_manage_users: false,
    can_create_pjo: true,    // Maker role for PJO
    can_fill_costs: false,
  },
  finance: {
    can_see_revenue: true,
    can_see_profit: true,
    can_approve_pjo: false,
    can_approve_jo: false,
    can_approve_bkk: false,
    can_manage_invoices: true,
    can_manage_users: false,
    can_create_pjo: false,
    can_create_bkk: true,    // Maker role for BKK
    can_fill_costs: false,
  },
  marketing: {
    can_see_revenue: true,
    can_see_profit: false,   // Marketing sees revenue but NOT profit
    can_see_actual_costs: false,  // Only sees estimates
    can_approve_pjo: false,
    can_approve_jo: false,
    can_approve_bkk: false,
    can_manage_invoices: false,
    can_manage_users: false,
    can_create_pjo: false,
    can_fill_costs: false,
    can_estimate_costs: true,  // NEW: Can use cost estimation tools
  },
  ops: {
    can_see_revenue: false,  // CRITICAL: Hidden
    can_see_profit: false,   // CRITICAL: Hidden
    can_approve_pjo: false,
    can_approve_jo: false,
    can_approve_bkk: false,
    can_manage_invoices: false,
    can_manage_users: false,
    can_create_pjo: false,
    can_fill_costs: true,
  },
  engineer: {
    can_see_revenue: false,
    can_see_profit: false,
    can_approve_pjo: false,
    can_approve_jo: false,
    can_approve_bkk: false,
    can_manage_invoices: false,
    can_manage_users: false,
    can_create_pjo: false,
    can_fill_costs: false,
  },
  hr: {
    can_see_revenue: false,
    can_see_profit: false,
    can_approve_pjo: false,
    can_approve_jo: false,
    can_approve_bkk: false,
    can_manage_invoices: false,
    can_manage_users: false,
    can_create_pjo: false,
    can_fill_costs: false,
  },
  hse: {
    can_see_revenue: false,
    can_see_profit: false,
    can_approve_pjo: false,
    can_approve_jo: false,
    can_approve_bkk: false,
    can_manage_invoices: false,
    can_manage_users: false,
    can_create_pjo: false,
    can_fill_costs: false,
  },
}
```


### Extended Feature Permission Map

```typescript
// lib/permissions.ts - Extended FEATURE_PERMISSION_MAP

const FEATURE_PERMISSION_MAP: Record<FeatureKey, (profile: UserProfile) => boolean> = {
  // Workflow Permissions
  'workflow.pjo.create': (p) => ['owner', 'director', 'manager', 'administration'].includes(p.role),
  'workflow.pjo.check': (p) => ['owner', 'director', 'manager'].includes(p.role),
  'workflow.pjo.approve': (p) => ['owner', 'director'].includes(p.role),
  'workflow.jo.check': (p) => ['owner', 'director', 'manager'].includes(p.role),
  'workflow.jo.approve': (p) => ['owner', 'director'].includes(p.role),
  'workflow.bkk.create': (p) => ['owner', 'director', 'manager', 'administration', 'finance'].includes(p.role),
  'workflow.bkk.check': (p) => ['owner', 'director', 'manager'].includes(p.role),
  'workflow.bkk.approve': (p) => ['owner', 'director'].includes(p.role),
  
  // Customer & Marketing Module
  'customers.view': (p) => ['owner', 'director', 'manager', 'marketing', 'administration', 'finance', 'ops', 'engineer'].includes(p.role),
  'customers.create': (p) => ['owner', 'director', 'manager', 'marketing'].includes(p.role),
  'customers.edit': (p) => ['owner', 'director', 'manager', 'marketing'].includes(p.role),
  'customers.delete': (p) => ['owner', 'director', 'sysadmin'].includes(p.role),
  
  // Quotation Module
  'quotations.view': (p) => ['owner', 'director', 'manager', 'marketing', 'engineer', 'administration'].includes(p.role),
  'quotations.create': (p) => ['owner', 'director', 'manager', 'marketing'].includes(p.role),
  'quotations.edit': (p) => ['owner', 'director', 'manager', 'marketing'].includes(p.role),
  'quotations.approve': (p) => ['owner', 'director', 'manager'].includes(p.role),
  'quotations.cost_estimation': (p) => ['owner', 'director', 'manager', 'marketing'].includes(p.role),
  'quotations.engineering_review': (p) => ['owner', 'director', 'manager', 'engineer'].includes(p.role),
  
  // PJO Module
  'pjo.view': (p) => ['owner', 'director', 'manager', 'administration', 'finance', 'ops'].includes(p.role),
  'pjo.view_revenue': (p) => ['owner', 'director', 'manager', 'administration', 'finance'].includes(p.role),
  'pjo.create': (p) => ['owner', 'director', 'manager', 'administration'].includes(p.role),
  'pjo.edit': (p) => ['owner', 'director', 'manager', 'administration'].includes(p.role),
  'pjo.check': (p) => ['owner', 'director', 'manager'].includes(p.role),
  'pjo.approve': (p) => ['owner', 'director'].includes(p.role),
  
  // Job Orders Module
  'jo.view': (p) => ['owner', 'director', 'manager', 'administration', 'finance', 'ops', 'marketing', 'engineer'].includes(p.role),
  'jo.view_revenue': (p) => ['owner', 'director', 'manager', 'administration', 'finance'].includes(p.role),
  'jo.create': (p) => ['owner', 'director', 'manager'].includes(p.role),
  'jo.edit': (p) => ['owner', 'director', 'manager', 'ops'].includes(p.role),
  'jo.add_expense': (p) => ['owner', 'director', 'manager', 'ops'].includes(p.role),
  'jo.check': (p) => ['owner', 'director', 'manager'].includes(p.role),
  'jo.approve': (p) => ['owner', 'director'].includes(p.role),
  'jo.create_ba': (p) => ['owner', 'director', 'manager', 'ops'].includes(p.role),
  'jo.create_sj': (p) => ['owner', 'director', 'manager', 'ops'].includes(p.role),
  
  // Finance Module
  'invoices.view': (p) => ['owner', 'director', 'manager', 'administration', 'finance'].includes(p.role),
  'invoices.create': (p) => ['owner', 'director', 'manager', 'administration', 'finance'].includes(p.role),
  'invoices.edit': (p) => ['owner', 'director', 'manager', 'administration', 'finance'].includes(p.role),
  'payments.view': (p) => ['owner', 'director', 'manager', 'finance'].includes(p.role),
  'payments.create': (p) => ['owner', 'director', 'manager', 'finance'].includes(p.role),
  'bkk.view': (p) => ['owner', 'director', 'manager', 'administration', 'finance'].includes(p.role),
  'bkk.create': (p) => ['owner', 'director', 'manager', 'administration', 'finance'].includes(p.role),
  'bkk.check': (p) => ['owner', 'director', 'manager'].includes(p.role),
  'bkk.approve': (p) => ['owner', 'director'].includes(p.role),
  'reports.profit': (p) => ['owner', 'director', 'manager', 'finance'].includes(p.role),
  'reports.revenue': (p) => ['owner', 'director', 'manager', 'finance', 'marketing'].includes(p.role),
  
  // Equipment & Assets Module
  'assets.view': (p) => ['owner', 'director', 'manager', 'ops', 'administration', 'finance', 'hse', 'engineer'].includes(p.role),
  'assets.create': (p) => ['owner', 'director', 'manager'].includes(p.role),
  'assets.edit': (p) => ['owner', 'director', 'manager', 'ops'].includes(p.role),
  'assets.view_value': (p) => ['owner', 'director', 'manager', 'finance'].includes(p.role),
  'maintenance.view': (p) => ['owner', 'director', 'manager', 'ops'].includes(p.role),
  'maintenance.create': (p) => ['owner', 'director', 'manager', 'ops'].includes(p.role),
  
  // HR Module
  'hr.employees.view': (p) => ['owner', 'director', 'manager', 'hr'].includes(p.role),
  'hr.employees.view_own': () => true,
  'hr.employees.create': (p) => ['owner', 'director', 'sysadmin', 'hr'].includes(p.role),
  'hr.employees.edit': (p) => ['owner', 'director', 'hr'].includes(p.role),
  'hr.employees.salary': (p) => ['owner', 'director', 'hr', 'finance'].includes(p.role),
  'hr.attendance.view_all': (p) => ['owner', 'director', 'manager', 'hr'].includes(p.role),
  'hr.attendance.view_own': () => true,
  'hr.leave.approve': (p) => ['owner', 'director', 'manager', 'hr'].includes(p.role),
  'hr.payroll.view': (p) => ['owner', 'director', 'hr', 'finance'].includes(p.role),
  'hr.payroll.run': (p) => ['owner', 'director', 'hr', 'finance'].includes(p.role),
  'hr.nav': (p) => ['owner', 'director', 'manager', 'hr'].includes(p.role),
  
  // HSE Module
  'hse.incidents.view': (p) => ['owner', 'director', 'manager', 'ops', 'hse', 'engineer'].includes(p.role),
  'hse.incidents.create': (p) => ['owner', 'director', 'manager', 'ops', 'hse'].includes(p.role),
  'hse.incidents.investigate': (p) => ['owner', 'director', 'manager', 'hse'].includes(p.role),
  'hse.training.view': (p) => ['owner', 'director', 'manager', 'hr', 'hse'].includes(p.role),
  'hse.training.view_own': () => true,
  'hse.ppe.view': (p) => ['owner', 'director', 'manager', 'hse', 'ops'].includes(p.role),
  'hse.ppe.manage': (p) => ['owner', 'director', 'manager', 'hse'].includes(p.role),
  'hse.nav': (p) => ['owner', 'director', 'manager', 'ops', 'hse'].includes(p.role),
  
  // Engineering Module
  'engineering.surveys.view': (p) => ['owner', 'director', 'manager', 'engineer', 'ops', 'marketing'].includes(p.role),
  'engineering.surveys.create': (p) => ['owner', 'director', 'manager', 'engineer'].includes(p.role),
  'engineering.jmp.view': (p) => ['owner', 'director', 'manager', 'engineer', 'ops', 'marketing'].includes(p.role),
  'engineering.jmp.create': (p) => ['owner', 'director', 'manager', 'engineer'].includes(p.role),
  'engineering.drawings.view': (p) => ['owner', 'director', 'manager', 'engineer', 'ops'].includes(p.role),
  'engineering.drawings.create': (p) => ['owner', 'director', 'manager', 'engineer'].includes(p.role),
  'engineering.assessments.view': (p) => ['owner', 'director', 'manager', 'engineer'].includes(p.role),
  'engineering.assessments.create': (p) => ['owner', 'director', 'manager', 'engineer'].includes(p.role),
  'engineering.nav': (p) => ['owner', 'director', 'manager', 'engineer', 'ops'].includes(p.role),
  
  // Dashboard Features
  'dashboard.executive': (p) => ['owner', 'director'].includes(p.role),
  'dashboard.manager': (p) => p.role === 'manager',
  'dashboard.marketing': (p) => ['owner', 'director', 'manager', 'marketing'].includes(p.role),
  'dashboard.operations': (p) => ['owner', 'director', 'manager', 'ops'].includes(p.role),
  'dashboard.finance': (p) => ['owner', 'director', 'manager', 'finance'].includes(p.role),
  'dashboard.hr': (p) => ['owner', 'director', 'manager', 'hr'].includes(p.role),
  'dashboard.hse': (p) => ['owner', 'director', 'manager', 'hse'].includes(p.role),
  'dashboard.engineering': (p) => ['owner', 'director', 'manager', 'engineer'].includes(p.role),
  
  // System Administration
  'admin.users.view': (p) => ['owner', 'director', 'sysadmin'].includes(p.role),
  'admin.users.create': (p) => ['owner', 'director', 'sysadmin'].includes(p.role),
  'admin.users.edit': (p) => ['owner', 'director', 'sysadmin'].includes(p.role),
  'admin.users.delete': (p) => ['owner', 'sysadmin'].includes(p.role),
  'admin.settings': (p) => ['owner', 'sysadmin'].includes(p.role),
  'admin.audit_logs': (p) => ['owner', 'director', 'sysadmin'].includes(p.role),
}
```


### Field Mask Configuration

```typescript
// lib/field-mask.ts - Field-level hiding rules

import { UserRole } from '@/types/permissions'

export const HIDDEN_FIELDS: Record<UserRole, Record<string, string[]>> = {
  ops: {
    job_orders: [
      'total_revenue',
      'revenue_items',
      'profit',
      'profit_margin',
      'invoice_amount',
      'quoted_price',
    ],
    proforma_job_orders: [
      'total_revenue',
      'revenue_items',
      'profit_margin',
      'expected_profit',
    ],
    invoices: ['*'],  // Entire module hidden
    payments: ['*'],  // Entire module hidden
  },
  marketing: {
    job_orders: [
      'job_cost_details',
      'vendor_pricing',
      'actual_expenses',
      'profit_margin',
    ],
    customers: {
      financial_history: ['limited'],
    },
  },
  finance: {
    employees: [
      'personal_details',  // Only payroll-relevant fields visible
    ],
  },
  administration: {},
  engineer: {},
  hr: {},
  hse: {},
  sysadmin: {},
  owner: {},
  director: {},
  manager: {},
}
```

### Navigation Configuration by Role

```typescript
// lib/navigation-by-role.ts

import { UserRole } from '@/types/permissions'

export const NAVIGATION_BY_ROLE: Record<UserRole, string[]> = {
  owner: ['ALL'],
  director: ['ALL'],
  manager: ['DEPARTMENT_SCOPED'],  // Dynamic based on department_scope
  sysadmin: [
    'Dashboard (System)',
    'Users',
    'System Settings',
    'Audit Logs',
  ],
  administration: [
    'Dashboard',
    'Customers',
    'Projects',
    'Quotations',
    'PJO',
    'Job Orders',
    'Invoices',
  ],
  finance: [
    'Dashboard (Finance)',
    'Invoices',
    'Payments',
    'BKK',
    'AR/AP',
    'Payroll',
    'Reports (Finance)',
  ],
  marketing: [
    'Dashboard (Marketing)',
    'Customers',
    'Quotations',
    'Pipeline',
    'Projects',
  ],
  ops: [
    'Dashboard (Operations)',
    'Job Orders',
    'Equipment',
    'HSE',
    'Vendors',
  ],
  engineer: [
    'Dashboard (Engineering)',
    'Surveys',
    'JMP',
    'Drawings',
    'Assessments',
    'Quotations (review)',
    'Projects',
  ],
  hr: [
    'Dashboard (HR)',
    'Employees',
    'Attendance',
    'Leave',
    'Payroll',
    'Training',
  ],
  hse: [
    'Dashboard (HSE)',
    'Incidents',
    'Audits',
    'Training',
    'PPE',
    'Permits',
  ],
}

export const HIDDEN_NAV_ITEMS: Record<UserRole, string[]> = {
  ops: [
    '/invoices',
    '/payments',
    '/quotations',
    '/proforma-jo',
    '/reports/profit',
    '/reports/revenue',
  ],
  marketing: [
    '/invoices',
    '/payments',
    '/finance',
    '/job-orders/costs',  // Hide actual cost details
  ],
  finance: [
    '/admin/users',
    '/settings/system',
  ],
  administration: [
    '/admin/users',
    '/settings/system',
  ],
  hr: [
    '/invoices',
    '/quotations',
    '/proforma-jo',
    '/admin',
  ],
  hse: [
    '/invoices',
    '/quotations',
    '/proforma-jo',
    '/admin',
    '/hr/payroll',
  ],
  engineer: [
    '/invoices',
    '/payments',
    '/admin',
    '/hr/payroll',
  ],
  sysadmin: [
    '/invoices',
    '/payments',
    '/quotations',
    '/proforma-jo',
    '/job-orders',
  ],
  owner: [],
  director: [],
  manager: [],
}
```


### Manager Department Scope Configuration

```typescript
// lib/manager-scope.ts

import { DepartmentScope } from '@/types/permissions'

/**
 * Dashboard widgets shown based on manager's department scope
 */
export const DEPARTMENT_DASHBOARD_WIDGETS: Record<DepartmentScope, string[]> = {
  marketing: [
    'QuotationsPipeline',
    'WinLossRate',
    'CustomerActivity',
    'RevenueTarget',
  ],
  engineering: [
    'PendingAssessments',
    'ActiveSurveys',
    'DrawingsStatus',
    'JMPProgress',
  ],
  administration: [
    'PJOPending',
    'InvoicesDue',
    'DocumentsToProcess',
    'WorkflowQueue',
  ],
  finance: [
    'ARAgingSummary',
    'PaymentsDue',
    'CashFlow',
    'ProfitMargins',
  ],
  operations: [
    'ActiveJobs',
    'EquipmentUtilization',
    'ExpenseTracking',
    'DeliverySchedule',
  ],
  assets: [
    'AssetAvailability',
    'MaintenanceSchedule',
    'UtilizationRate',
    'DepreciationSummary',
  ],
  hr: [
    'HeadcountSummary',
    'LeaveRequests',
    'AttendanceOverview',
    'PayrollStatus',
  ],
  hse: [
    'IncidentSummary',
    'SafetyAudits',
    'TrainingCompliance',
    'PPEStatus',
  ],
}

/**
 * Get dashboard widgets for a manager based on their department scope
 */
export function getManagerDashboardWidgets(departmentScope: DepartmentScope[]): string[] {
  const widgets: string[] = []
  for (const dept of departmentScope) {
    widgets.push(...DEPARTMENT_DASHBOARD_WIDGETS[dept])
  }
  return [...new Set(widgets)]  // Remove duplicates
}
```

## Data Models

### Database Schema Updates

```sql
-- Update user_profiles role check constraint
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_role_check;

ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_role_check 
CHECK (role IN ('owner', 'director', 'manager', 'sysadmin', 'administration', 'finance', 'marketing', 'ops', 'engineer', 'hr', 'hse'));

-- Add department_scope column for managers
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS department_scope TEXT[] DEFAULT '{}';

-- Update custom_dashboard check constraint
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_custom_dashboard_check;

ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_custom_dashboard_check 
CHECK (custom_dashboard IN ('executive', 'manager', 'marketing', 'admin_finance', 'operations', 'engineering', 'hr', 'hse', 'sysadmin', 'default'));

-- Add workflow status columns to PJO
ALTER TABLE proforma_job_orders
ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS checked_by UUID REFERENCES user_profiles(id),
ADD COLUMN IF NOT EXISTS checked_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES user_profiles(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;

-- Add workflow status columns to Job Orders
ALTER TABLE job_orders
ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS checked_by UUID REFERENCES user_profiles(id),
ADD COLUMN IF NOT EXISTS checked_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES user_profiles(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;

-- Create BKK (disbursement) table if not exists
CREATE TABLE IF NOT EXISTS disbursements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bkk_number VARCHAR(50) UNIQUE NOT NULL,
  job_order_id UUID REFERENCES job_orders(id),
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  workflow_status VARCHAR(20) DEFAULT 'draft',
  created_by UUID REFERENCES user_profiles(id),
  checked_by UUID REFERENCES user_profiles(id),
  checked_at TIMESTAMP,
  approved_by UUID REFERENCES user_profiles(id),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```


## Correctness Properties

### Property 1: Owner Full Access
*For any* feature in the system, when a user with role "owner" checks access, the system should grant full access.

**Validates: Requirements 1.2**

### Property 2: Director Approval Authority
*For any* document requiring approval (PJO, JO, BKK), when a user with role "director" attempts to approve, the system should allow the operation.

**Validates: Requirements 2.3, 2.5, 2.6**

### Property 3: Manager Check-Only Authority
*For any* document requiring approval (PJO, JO, BKK), when a user with role "manager" attempts to approve, the system should deny the operation. When they attempt to check/review, the system should allow.

**Validates: Requirements 1.5, 2.4, 6.10**

### Property 4: Ops Revenue Field Hiding
*For any* user with role "ops" and any module containing revenue fields, the `isFieldHidden(role, module, field)` function should return true for all revenue-related fields.

**Validates: Requirements 15.1-15.6**

### Property 5: Marketing Cost Field Hiding
*For any* user with role "marketing" and any module containing actual cost fields, the `isFieldHidden(role, module, field)` function should return true for actual cost fields (but allow estimated costs).

**Validates: Requirements 5.1-5.6, 16.1-16.3**

### Property 6: Department Scope Filtering
*For any* manager with a specific department_scope, the dashboard widgets and data visibility should be limited to their assigned departments.

**Validates: Requirements 3.1-3.6**

### Property 7: Workflow State Transitions
*For any* workflow transition, only users with roles in the allowedRoles array should be able to perform the transition.

**Validates: Requirements 2.1-2.7**

## Error Handling

### Access Denied Scenarios

1. **Approval Denied for Manager**: When a manager attempts to approve (not just check) a document, show toast: "Approval requires Director or Owner authorization."

2. **Revenue Hidden for Ops**: When ops user attempts to access revenue data via API, return 403 with message: "Revenue data is not available for your role."

3. **Workflow Violation**: When user attempts invalid workflow transition, show toast: "This document must be checked by a Manager before approval."

## Testing Strategy

### Unit Tests
1. **Role Definition Tests**: Verify each of the 11 roles has expected default permissions
2. **Workflow Tests**: Test Maker-Checker-Approver transitions for PJO, JO, BKK
3. **Department Scope Tests**: Verify manager dashboard filtering
4. **Field Hiding Tests**: Verify ops/marketing field masking

### Property-Based Tests
1. **Owner Full Access Property**: Generate random features, verify owner always has access
2. **Director Approval Property**: Generate approval scenarios, verify director can approve
3. **Manager Check-Only Property**: Generate approval scenarios, verify manager cannot approve
4. **Field Hiding Property**: Generate ops/marketing profiles, verify field masking
5. **Workflow Transition Property**: Generate transitions, verify role restrictions

### Test File Structure
```
__tests__/
  rbac-matrix.property.test.ts
  workflow-permissions.property.test.ts
  field-mask.property.test.ts
  department-scope.test.ts
  maker-checker-approver.test.ts
```



## Manager Permission Inheritance

Managers inherit all CRUD permissions from staff roles within their department scope. This allows managers to perform any task their team can do when needed.

### Department to Staff Role Mapping

```typescript
// lib/manager-inheritance.ts

import { DepartmentScope, UserRole, UserProfile, FeatureKey } from '@/types/permissions'

/**
 * Maps each department to the staff roles that work in that department
 */
export const DEPARTMENT_STAFF_ROLES: Record<DepartmentScope, UserRole[]> = {
  marketing: ['marketing'],
  engineering: ['engineer'],
  administration: ['administration'],
  finance: ['finance'],
  operations: ['ops'],
  assets: ['ops'],  // Assets managed by ops team
  hr: ['hr'],
  hse: ['hse'],
}

/**
 * Get all staff roles a manager inherits based on their department scope
 */
export function getInheritedRoles(profile: UserProfile): UserRole[] {
  if (profile.role !== 'manager' || !profile.department_scope) {
    return []
  }
  
  const inheritedRoles: UserRole[] = []
  for (const dept of profile.department_scope) {
    const staffRoles = DEPARTMENT_STAFF_ROLES[dept]
    if (staffRoles) {
      inheritedRoles.push(...staffRoles)
    }
  }
  
  return [...new Set(inheritedRoles)]  // Remove duplicates
}

/**
 * Check if user can access a feature, considering manager inheritance
 */
export function canAccessFeatureWithInheritance(
  profile: UserProfile,
  feature: FeatureKey,
  featureMap: Record<FeatureKey, (p: UserProfile) => boolean>
): boolean {
  // Direct role check
  if (featureMap[feature](profile)) {
    return true
  }
  
  // Manager inheritance check
  if (profile.role === 'manager' && profile.department_scope) {
    const inheritedRoles = getInheritedRoles(profile)
    
    for (const inheritedRole of inheritedRoles) {
      const virtualProfile = { ...profile, role: inheritedRole }
      if (featureMap[feature](virtualProfile)) {
        return true
      }
    }
  }
  
  return false
}
```

### Manager Inheritance Examples

| Manager | Department Scope | Inherits From | Can Do |
|---------|------------------|---------------|--------|
| Hutami | marketing, engineering | marketing, engineer | Create quotations, surveys, JMP, drawings |
| Feri | administration, finance | administration, finance | Create PJO, invoices, BKK, payments |
| Reza | operations, assets | ops | Execute jobs, add expenses, manage equipment |

### What Managers CANNOT Do (Even With Inheritance)

- **Approve documents** - Only director/owner can approve
- **Access outside their scope** - Hutami cannot create PJO (not in her scope)
- **System administration** - Only sysadmin/owner can manage users

## Audit Trail System

Every action in the system is logged for accountability and traceability.

### Audit Log Schema

```sql
-- Comprehensive audit log table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  user_role VARCHAR(50) NOT NULL,
  
  -- What
  action VARCHAR(100) NOT NULL,  -- create, update, delete, approve, check, etc.
  module VARCHAR(50) NOT NULL,   -- quotations, pjo, job_orders, etc.
  
  -- Which record
  record_id UUID,
  record_type VARCHAR(50),       -- quotation, pjo, job_order, etc.
  record_number VARCHAR(100),    -- Human-readable: PJO-2026-0001
  
  -- Changes (for updates)
  old_values JSONB,              -- Previous state
  new_values JSONB,              -- New state
  changes_summary TEXT,          -- Human-readable summary
  
  -- Context
  ip_address VARCHAR(45),
  user_agent TEXT,
  session_id VARCHAR(255),
  
  -- Workflow context
  workflow_status_from VARCHAR(50),
  workflow_status_to VARCHAR(50),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_record ON audit_logs(record_id);
CREATE INDEX idx_audit_module ON audit_logs(module);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_record_type ON audit_logs(record_type, record_id);

-- Composite index for common queries
CREATE INDEX idx_audit_module_action ON audit_logs(module, action, created_at DESC);
```

### Audit Log Service

```typescript
// lib/audit-log.ts

import { createClient } from '@/lib/supabase/server'
import { UserProfile } from '@/types/permissions'

export interface AuditLogEntry {
  userId: string
  userName: string
  userEmail: string
  userRole: string
  action: AuditAction
  module: string
  recordId?: string
  recordType?: string
  recordNumber?: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
  changesSummary?: string
  workflowStatusFrom?: string
  workflowStatusTo?: string
}

export type AuditAction = 
  | 'create'
  | 'update'
  | 'delete'
  | 'view'
  | 'export'
  | 'submit'
  | 'check'      // Manager reviews
  | 'approve'    // Director/Owner approves
  | 'reject'
  | 'login'
  | 'logout'

/**
 * Log an action to the audit trail
 */
export async function logAudit(
  entry: AuditLogEntry,
  request?: Request
): Promise<void> {
  const supabase = await createClient()
  
  const ipAddress = request?.headers.get('x-forwarded-for') || 
                    request?.headers.get('x-real-ip') || 
                    'unknown'
  const userAgent = request?.headers.get('user-agent') || 'unknown'
  
  await supabase.from('audit_logs').insert({
    user_id: entry.userId,
    user_name: entry.userName,
    user_email: entry.userEmail,
    user_role: entry.userRole,
    action: entry.action,
    module: entry.module,
    record_id: entry.recordId,
    record_type: entry.recordType,
    record_number: entry.recordNumber,
    old_values: entry.oldValues,
    new_values: entry.newValues,
    changes_summary: entry.changesSummary,
    workflow_status_from: entry.workflowStatusFrom,
    workflow_status_to: entry.workflowStatusTo,
    ip_address: ipAddress,
    user_agent: userAgent,
  })
}

/**
 * Helper to create audit entry from user profile
 */
export function createAuditEntry(
  profile: UserProfile,
  action: AuditAction,
  module: string,
  details: Partial<AuditLogEntry> = {}
): AuditLogEntry {
  return {
    userId: profile.user_id,
    userName: profile.full_name || 'Unknown',
    userEmail: profile.email || 'unknown@example.com',
    userRole: profile.role,
    action,
    module,
    ...details,
  }
}
```

### Audit Log Usage Examples

```typescript
// When Feri (manager) creates a PJO
await logAudit(createAuditEntry(profile, 'create', 'pjo', {
  recordId: newPjo.id,
  recordType: 'proforma_job_order',
  recordNumber: newPjo.pjo_number,
  newValues: newPjo,
  changesSummary: `PJO ${newPjo.pjo_number} created by manager (acting as administration)`,
}))

// When Director approves a PJO
await logAudit(createAuditEntry(profile, 'approve', 'pjo', {
  recordId: pjo.id,
  recordType: 'proforma_job_order',
  recordNumber: pjo.pjo_number,
  workflowStatusFrom: 'checked',
  workflowStatusTo: 'approved',
  changesSummary: `PJO ${pjo.pjo_number} approved`,
}))

// When Manager checks a BKK
await logAudit(createAuditEntry(profile, 'check', 'bkk', {
  recordId: bkk.id,
  recordType: 'disbursement',
  recordNumber: bkk.bkk_number,
  workflowStatusFrom: 'draft',
  workflowStatusTo: 'checked',
  changesSummary: `BKK ${bkk.bkk_number} reviewed and checked`,
}))
```

### Audit Log Queries

```typescript
// Get all actions by a specific user
const userActions = await supabase
  .from('audit_logs')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })

// Get history of a specific record
const recordHistory = await supabase
  .from('audit_logs')
  .select('*')
  .eq('record_id', recordId)
  .order('created_at', { ascending: true })

// Get all approvals in a date range
const approvals = await supabase
  .from('audit_logs')
  .select('*')
  .eq('action', 'approve')
  .gte('created_at', startDate)
  .lte('created_at', endDate)

// Get workflow transitions for PJOs
const pjoWorkflow = await supabase
  .from('audit_logs')
  .select('*')
  .eq('module', 'pjo')
  .in('action', ['submit', 'check', 'approve', 'reject'])
  .order('created_at', { ascending: false })
```

