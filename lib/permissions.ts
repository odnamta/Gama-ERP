// Permission utilities for Role-Based Access Control - RBAC v0.9.11

import { UserRole, UserPermissions, UserProfile, FeatureKey, DepartmentScope } from '@/types/permissions'

/**
 * Owner email - auto-assigned owner role on login
 */
export const OWNER_EMAIL = 'dioatmando@gama-group.co'

/**
 * Department to staff role mapping for manager inheritance
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
 * Default permissions for each role (11 roles)
 */
export const DEFAULT_PERMISSIONS: Record<UserRole, UserPermissions> = {
  owner: {
    can_see_revenue: true,
    can_see_profit: true,
    can_see_actual_costs: true,
    can_approve_pjo: true,
    can_approve_jo: true,
    can_approve_bkk: true,
    can_check_pjo: true,
    can_check_jo: true,
    can_check_bkk: true,
    can_manage_invoices: true,
    can_manage_users: true,
    can_create_pjo: true,
    can_fill_costs: true,
    can_estimate_costs: true,
  },
  director: {
    can_see_revenue: true,
    can_see_profit: true,
    can_see_actual_costs: true,
    can_approve_pjo: true,
    can_approve_jo: true,
    can_approve_bkk: true,
    can_check_pjo: true,
    can_check_jo: true,
    can_check_bkk: true,
    can_manage_invoices: true,
    can_manage_users: true,
    can_create_pjo: true,
    can_fill_costs: true,
    can_estimate_costs: true,
  },
  manager: {
    can_see_revenue: true,
    can_see_profit: true,
    can_see_actual_costs: true,
    can_approve_pjo: false,  // Can only CHECK, not approve
    can_approve_jo: false,
    can_approve_bkk: false,
    can_check_pjo: true,
    can_check_jo: true,
    can_check_bkk: true,
    can_manage_invoices: false,
    can_manage_users: false,
    can_create_pjo: true,
    can_fill_costs: true,
    can_estimate_costs: true,
  },
  sysadmin: {
    can_see_revenue: false,
    can_see_profit: false,
    can_see_actual_costs: false,
    can_approve_pjo: false,
    can_approve_jo: false,
    can_approve_bkk: false,
    can_check_pjo: false,
    can_check_jo: false,
    can_check_bkk: false,
    can_manage_invoices: false,
    can_manage_users: true,
    can_create_pjo: false,
    can_fill_costs: false,
    can_estimate_costs: false,
  },
  administration: {
    can_see_revenue: true,
    can_see_profit: false,
    can_see_actual_costs: true,
    can_approve_pjo: false,
    can_approve_jo: false,
    can_approve_bkk: false,
    can_check_pjo: false,
    can_check_jo: false,
    can_check_bkk: false,
    can_manage_invoices: true,
    can_manage_users: false,
    can_create_pjo: true,
    can_fill_costs: false,
    can_estimate_costs: false,
  },
  finance: {
    can_see_revenue: true,
    can_see_profit: true,
    can_see_actual_costs: true,
    can_approve_pjo: false,
    can_approve_jo: false,
    can_approve_bkk: false,
    can_check_pjo: false,
    can_check_jo: false,
    can_check_bkk: false,
    can_manage_invoices: true,
    can_manage_users: false,
    can_create_pjo: false,
    can_fill_costs: false,
    can_estimate_costs: false,
  },
  marketing: {
    can_see_revenue: true,
    can_see_profit: false,
    can_see_actual_costs: false,  // Only sees estimates
    can_approve_pjo: false,
    can_approve_jo: false,
    can_approve_bkk: false,
    can_check_pjo: false,
    can_check_jo: false,
    can_check_bkk: false,
    can_manage_invoices: false,
    can_manage_users: false,
    can_create_pjo: false,
    can_fill_costs: false,
    can_estimate_costs: true,
  },
  ops: {
    can_see_revenue: false,  // CRITICAL: Hidden
    can_see_profit: false,   // CRITICAL: Hidden
    can_see_actual_costs: true,
    can_approve_pjo: false,
    can_approve_jo: false,
    can_approve_bkk: false,
    can_check_pjo: false,
    can_check_jo: false,
    can_check_bkk: false,
    can_manage_invoices: false,
    can_manage_users: false,
    can_create_pjo: false,
    can_fill_costs: true,
    can_estimate_costs: false,
  },
  engineer: {
    can_see_revenue: false,
    can_see_profit: false,
    can_see_actual_costs: false,
    can_approve_pjo: false,
    can_approve_jo: false,
    can_approve_bkk: false,
    can_check_pjo: false,
    can_check_jo: false,
    can_check_bkk: false,
    can_manage_invoices: false,
    can_manage_users: false,
    can_create_pjo: false,
    can_fill_costs: false,
    can_estimate_costs: false,
  },
  hr: {
    can_see_revenue: false,
    can_see_profit: false,
    can_see_actual_costs: false,
    can_approve_pjo: false,
    can_approve_jo: false,
    can_approve_bkk: false,
    can_check_pjo: false,
    can_check_jo: false,
    can_check_bkk: false,
    can_manage_invoices: false,
    can_manage_users: false,
    can_create_pjo: false,
    can_fill_costs: false,
    can_estimate_costs: false,
  },
  hse: {
    can_see_revenue: false,
    can_see_profit: false,
    can_see_actual_costs: false,
    can_approve_pjo: false,
    can_approve_jo: false,
    can_approve_bkk: false,
    can_check_pjo: false,
    can_check_jo: false,
    can_check_bkk: false,
    can_manage_invoices: false,
    can_manage_users: false,
    can_create_pjo: false,
    can_fill_costs: false,
    can_estimate_costs: false,
  },
}

/**
 * Get default permissions for a role
 */
export function getDefaultPermissions(role: UserRole): UserPermissions {
  return DEFAULT_PERMISSIONS[role] || DEFAULT_PERMISSIONS.ops
}

/**
 * Get inherited roles for a manager based on department scope
 */
export function getInheritedRoles(profile: UserProfile): UserRole[] {
  if (profile.role !== 'manager' || !profile.department_scope?.length) {
    return []
  }
  
  const inheritedRoles: UserRole[] = []
  for (const dept of profile.department_scope) {
    const staffRoles = DEPARTMENT_STAFF_ROLES[dept]
    if (staffRoles) {
      inheritedRoles.push(...staffRoles)
    }
  }
  
  return [...new Set(inheritedRoles)]
}


/**
 * Feature access mapping based on permissions (11 roles)
 */
const FEATURE_PERMISSION_MAP: Record<FeatureKey, (profile: UserProfile) => boolean> = {
  // Dashboard features
  'dashboard.executive': (p) => ['owner', 'director'].includes(p.role),
  'dashboard.manager': (p) => p.role === 'manager',
  'dashboard.marketing': (p) => ['owner', 'director', 'manager', 'marketing'].includes(p.role),
  'dashboard.operations': (p) => ['owner', 'director', 'manager', 'ops'].includes(p.role),
  'dashboard.finance': (p) => ['owner', 'director', 'manager', 'finance', 'administration'].includes(p.role),
  'dashboard.hr': (p) => ['owner', 'director', 'manager', 'hr'].includes(p.role),
  'dashboard.hse': (p) => ['owner', 'director', 'manager', 'hse'].includes(p.role),
  'dashboard.engineering': (p) => ['owner', 'director', 'manager', 'engineer'].includes(p.role),
  'dashboard.full': (p) => p.role === 'owner' || p.role === 'director' || (p.can_see_revenue && p.can_see_profit),
  'dashboard.ops': (p) => p.can_fill_costs,
  
  // Workflow permissions
  'workflow.pjo.create': (p) => ['owner', 'director', 'manager', 'administration'].includes(p.role),
  'workflow.pjo.check': (p) => ['owner', 'director', 'manager'].includes(p.role),
  'workflow.pjo.approve': (p) => ['owner', 'director'].includes(p.role),
  'workflow.jo.check': (p) => ['owner', 'director', 'manager'].includes(p.role),
  'workflow.jo.approve': (p) => ['owner', 'director'].includes(p.role),
  'workflow.bkk.create': (p) => ['owner', 'director', 'manager', 'administration', 'finance'].includes(p.role),
  'workflow.bkk.check': (p) => ['owner', 'director', 'manager'].includes(p.role),
  'workflow.bkk.approve': (p) => ['owner', 'director'].includes(p.role),
  
  // Customer & Marketing
  'customers.crud': (p) => ['owner', 'director', 'manager', 'marketing'].includes(p.role),
  'customers.view': (p) => !['sysadmin'].includes(p.role),
  'customers.create': (p) => ['owner', 'director', 'manager', 'marketing'].includes(p.role),
  'customers.edit': (p) => ['owner', 'director', 'manager', 'marketing'].includes(p.role),
  'customers.delete': (p) => ['owner', 'director', 'sysadmin'].includes(p.role),
  
  // Quotations
  'quotations.view': (p) => ['owner', 'director', 'manager', 'marketing', 'engineer', 'administration'].includes(p.role),
  'quotations.create': (p) => ['owner', 'director', 'manager', 'marketing'].includes(p.role),
  'quotations.edit': (p) => ['owner', 'director', 'manager', 'marketing'].includes(p.role),
  'quotations.approve': (p) => ['owner', 'director', 'manager'].includes(p.role),
  'quotations.cost_estimation': (p) => ['owner', 'director', 'manager', 'marketing'].includes(p.role),
  'quotations.engineering_review': (p) => ['owner', 'director', 'manager', 'engineer'].includes(p.role),
  
  // Projects
  'projects.crud': (p) => ['owner', 'director', 'manager', 'marketing', 'engineer'].includes(p.role),
  'projects.view': (p) => !['sysadmin'].includes(p.role),
  
  // PJO
  'pjo.create': (p) => p.can_create_pjo,
  'pjo.view': (p) => ['owner', 'director', 'manager', 'administration', 'finance', 'ops'].includes(p.role),
  'pjo.edit': (p) => ['owner', 'director', 'manager', 'administration'].includes(p.role),
  'pjo.view_revenue': (p) => p.can_see_revenue,
  'pjo.view_costs': (p) => p.can_fill_costs || p.can_see_revenue,
  'pjo.check': (p) => p.can_check_pjo,
  'pjo.approve': (p) => p.can_approve_pjo,
  
  // Job Orders
  'jo.view': (p) => ['owner', 'director', 'manager', 'administration', 'finance', 'ops', 'marketing', 'engineer'].includes(p.role),
  'jo.view_full': (p) => p.can_see_revenue,
  'jo.view_revenue': (p) => p.can_see_revenue,
  'jo.view_costs': (p) => p.can_fill_costs || p.can_see_revenue,
  'jo.create': (p) => ['owner', 'director', 'manager'].includes(p.role),
  'jo.edit': (p) => ['owner', 'director', 'manager', 'ops'].includes(p.role),
  'jo.add_expense': (p) => ['owner', 'director', 'manager', 'ops'].includes(p.role),
  'jo.fill_costs': (p) => p.can_fill_costs,
  'jo.check': (p) => p.can_check_jo,
  'jo.approve': (p) => p.can_approve_jo,
  'jo.create_ba': (p) => ['owner', 'director', 'manager', 'ops'].includes(p.role),
  'jo.create_sj': (p) => ['owner', 'director', 'manager', 'ops'].includes(p.role),
  
  // Finance
  'invoices.crud': (p) => p.can_manage_invoices,
  'invoices.view': (p) => ['owner', 'director', 'manager', 'administration', 'finance'].includes(p.role),
  'invoices.create': (p) => ['owner', 'director', 'manager', 'administration', 'finance'].includes(p.role),
  'invoices.edit': (p) => ['owner', 'director', 'manager', 'administration', 'finance'].includes(p.role),
  'payments.view': (p) => ['owner', 'director', 'manager', 'finance'].includes(p.role),
  'payments.create': (p) => ['owner', 'director', 'manager', 'finance'].includes(p.role),
  'bkk.view': (p) => ['owner', 'director', 'manager', 'administration', 'finance'].includes(p.role),
  'bkk.create': (p) => ['owner', 'director', 'manager', 'administration', 'finance'].includes(p.role),
  'bkk.check': (p) => p.can_check_bkk,
  'bkk.approve': (p) => p.can_approve_bkk,
  'reports.pnl': (p) => p.can_see_revenue && p.can_see_profit,
  'reports.profit': (p) => ['owner', 'director', 'manager', 'finance'].includes(p.role),
  'reports.revenue': (p) => ['owner', 'director', 'manager', 'finance', 'marketing'].includes(p.role),
  
  // Equipment & Assets
  'assets.view': (p) => ['owner', 'director', 'manager', 'ops', 'administration', 'finance', 'hse', 'engineer'].includes(p.role),
  'assets.create': (p) => ['owner', 'director', 'manager'].includes(p.role),
  'assets.edit': (p) => ['owner', 'director', 'manager', 'ops'].includes(p.role),
  'assets.change_status': (p) => ['owner', 'director', 'manager', 'ops'].includes(p.role),
  'assets.view_financials': (p) => ['owner', 'director', 'manager', 'finance'].includes(p.role),
  'assets.dispose': (p) => ['owner', 'director'].includes(p.role),
  'assets.upload_documents': (p) => ['owner', 'director', 'manager', 'ops'].includes(p.role),
  'assets.nav': (p) => ['owner', 'director', 'manager', 'ops', 'finance'].includes(p.role),
  'maintenance.view': (p) => ['owner', 'director', 'manager', 'ops'].includes(p.role),
  'maintenance.create': (p) => ['owner', 'director', 'manager', 'ops'].includes(p.role),
  
  // HR Module
  'hr.employees.view': (p) => ['owner', 'director', 'manager', 'hr'].includes(p.role),
  'hr.employees.view_own': () => true,
  'hr.employees.create': (p) => ['owner', 'director', 'sysadmin', 'hr'].includes(p.role),
  'hr.employees.edit': (p) => ['owner', 'director', 'hr'].includes(p.role),
  'hr.employees.delete': (p) => ['owner', 'director', 'sysadmin'].includes(p.role),
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
  'hse.training.manage': (p) => ['owner', 'director', 'manager', 'hr', 'hse'].includes(p.role),
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
  
  // System Administration
  'admin.users.view': (p) => ['owner', 'director', 'sysadmin'].includes(p.role),
  'admin.users.create': (p) => ['owner', 'director', 'sysadmin'].includes(p.role),
  'admin.users.edit': (p) => ['owner', 'director', 'sysadmin'].includes(p.role),
  'admin.users.delete': (p) => ['owner', 'sysadmin'].includes(p.role),
  'admin.settings': (p) => ['owner', 'sysadmin'].includes(p.role),
  'admin.audit_logs': (p) => ['owner', 'director', 'sysadmin'].includes(p.role),
  'users.manage': (p) => p.can_manage_users,


  // Vendor permissions
  'vendors.view': () => true,
  'vendors.create': (p) => ['owner', 'director', 'manager', 'administration', 'ops'].includes(p.role),
  'vendors.edit': (p) => ['owner', 'director', 'manager'].includes(p.role),
  'vendors.delete': (p) => ['owner', 'director', 'sysadmin'].includes(p.role),
  'vendors.verify': (p) => ['owner', 'director', 'sysadmin'].includes(p.role),
  'vendors.set_preferred': (p) => ['owner', 'director', 'manager'].includes(p.role),
  'vendors.add_equipment': (p) => ['owner', 'director', 'manager', 'ops'].includes(p.role),
  'vendors.rate': (p) => ['owner', 'director', 'manager', 'finance', 'ops'].includes(p.role),
  'vendors.view_bank': (p) => ['owner', 'director', 'manager', 'finance'].includes(p.role),
  'vendors.nav': (p) => !['sysadmin', 'hr'].includes(p.role),
  
  // Vendor Invoice (AP) permissions
  'vendor_invoices.view': (p) => ['owner', 'director', 'manager', 'administration', 'finance'].includes(p.role),
  'vendor_invoices.create': (p) => ['owner', 'director', 'administration', 'finance'].includes(p.role),
  'vendor_invoices.edit': (p) => ['owner', 'director', 'administration', 'finance'].includes(p.role),
  'vendor_invoices.delete': (p) => ['owner', 'director', 'sysadmin'].includes(p.role),
  'vendor_invoices.verify': (p) => ['owner', 'director', 'administration', 'finance'].includes(p.role),
  'vendor_invoices.approve': (p) => ['owner', 'director', 'manager'].includes(p.role),
  'vendor_invoices.record_payment': (p) => ['owner', 'director', 'administration', 'finance'].includes(p.role),
  'vendor_invoices.nav': (p) => ['owner', 'director', 'manager', 'administration', 'finance'].includes(p.role),
  
  // Employee/HR permissions (legacy compatibility)
  'employees.view': (p) => ['owner', 'director', 'manager', 'hr'].includes(p.role),
  'employees.create': (p) => ['owner', 'director', 'sysadmin', 'hr'].includes(p.role),
  'employees.edit': (p) => ['owner', 'director', 'hr'].includes(p.role),
  'employees.delete': (p) => ['owner', 'director', 'sysadmin'].includes(p.role),
  'employees.view_salary': (p) => ['owner', 'director', 'hr', 'finance'].includes(p.role),
  'employees.edit_salary': (p) => ['owner', 'director', 'hr'].includes(p.role),
  'employees.nav': (p) => ['owner', 'director', 'manager', 'hr'].includes(p.role),
  
  // Attendance permissions
  'attendance.view_own': () => true,
  'attendance.clock': () => true,
  'attendance.view_all': (p) => ['owner', 'director', 'manager', 'hr'].includes(p.role),
  'attendance.edit': (p) => ['owner', 'director', 'hr'].includes(p.role),
  'attendance.manage_schedules': (p) => ['owner', 'director', 'hr'].includes(p.role),
  'attendance.manage_holidays': (p) => ['owner', 'director', 'hr'].includes(p.role),
  'attendance.view_reports': (p) => ['owner', 'director', 'manager', 'hr', 'finance'].includes(p.role),
  'attendance.nav': () => true,
  
  // Finance Dashboard Enhanced permissions
  'finance_dashboard.view': (p) => ['finance', 'owner', 'director', 'manager', 'administration'].includes(p.role),
  'finance_dashboard.view_ar_ap': (p) => ['finance', 'owner', 'director', 'manager', 'administration'].includes(p.role),
  'finance_dashboard.view_cash_position': (p) => ['finance', 'owner', 'director'].includes(p.role),
  'finance_dashboard.view_profit_margins': (p) => ['finance', 'owner', 'director'].includes(p.role),
  'finance_dashboard.refresh': (p) => ['finance', 'owner', 'director'].includes(p.role),
  'finance_dashboard.view_bkk_pending': (p) => ['finance', 'owner', 'director', 'manager', 'administration'].includes(p.role),
  
  // Sales/Engineering Dashboard permissions
  'sales_engineering_dashboard.view': (p) => ['marketing', 'owner', 'director', 'manager', 'engineer'].includes(p.role),
  'sales_engineering_dashboard.view_pipeline': (p) => ['marketing', 'owner', 'director', 'manager'].includes(p.role),
  'sales_engineering_dashboard.view_engineering': (p) => ['marketing', 'owner', 'director', 'manager', 'engineer'].includes(p.role),
  'sales_engineering_dashboard.refresh': (p) => ['marketing', 'owner', 'director', 'manager'].includes(p.role),
  
  // Training permissions
  'training.view': () => true,
  'training.view_own': () => true,
  'training.create_course': (p) => ['owner', 'director', 'hr', 'hse'].includes(p.role),
  'training.edit_course': (p) => ['owner', 'director', 'hr', 'hse'].includes(p.role),
  'training.create_record': (p) => ['owner', 'director', 'manager', 'hr', 'hse'].includes(p.role),
  'training.edit_record': (p) => ['owner', 'director', 'manager', 'hr', 'hse'].includes(p.role),
  'training.create_session': (p) => ['owner', 'director', 'manager', 'hr', 'hse'].includes(p.role),
  'training.manage_session': (p) => ['owner', 'director', 'manager', 'hr', 'hse'].includes(p.role),
  'training.view_compliance': (p) => ['owner', 'director', 'manager', 'hr', 'hse'].includes(p.role),
  'training.nav': () => true,
  
  // Audit permissions
  'audits.view': () => true,
  'audits.create': (p) => ['owner', 'director', 'manager', 'ops', 'hse'].includes(p.role),
  'audits.conduct': (p) => ['owner', 'director', 'manager', 'ops', 'hse'].includes(p.role),
  'audits.complete': (p) => ['owner', 'director', 'manager', 'ops', 'hse'].includes(p.role),
  'audits.manage_types': (p) => ['owner', 'director', 'sysadmin'].includes(p.role),
  'audits.create_finding': (p) => ['owner', 'director', 'manager', 'ops', 'hse'].includes(p.role),
  'audits.close_finding': (p) => ['owner', 'director', 'manager', 'ops', 'hse'].includes(p.role),
  'audits.verify_finding': (p) => ['owner', 'director', 'manager', 'hse'].includes(p.role),
  'audits.nav': () => true,
  
  // PIB (Customs Import) permissions
  'pib.view': (p) => ['owner', 'director', 'manager', 'ops', 'finance', 'administration'].includes(p.role),
  'pib.create': (p) => ['owner', 'director', 'manager', 'administration'].includes(p.role),
  'pib.edit': (p) => ['owner', 'director', 'manager', 'administration'].includes(p.role),
  'pib.delete': (p) => ['owner', 'director', 'sysadmin'].includes(p.role),
  'pib.view_duties': (p) => ['owner', 'director', 'manager', 'finance', 'administration'].includes(p.role),
  'pib.update_status': (p) => ['owner', 'director', 'manager', 'administration'].includes(p.role),
  'pib.nav': (p) => ['owner', 'director', 'manager', 'ops', 'finance', 'administration'].includes(p.role),
  
  // PEB (Customs Export) permissions
  'peb.view': (p) => ['owner', 'director', 'manager', 'ops', 'finance', 'administration'].includes(p.role),
  'peb.create': (p) => ['owner', 'director', 'manager', 'administration'].includes(p.role),
  'peb.edit': (p) => ['owner', 'director', 'manager', 'administration'].includes(p.role),
  'peb.delete': (p) => ['owner', 'director', 'sysadmin'].includes(p.role),
  'peb.update_status': (p) => ['owner', 'director', 'manager', 'administration'].includes(p.role),
  'peb.nav': (p) => ['owner', 'director', 'manager', 'ops', 'finance', 'administration'].includes(p.role),
}

/**
 * Check if a user profile can access a specific feature
 * Includes manager inheritance logic
 */
export function canAccessFeature(profile: UserProfile | null, feature: FeatureKey): boolean {
  if (!profile) return false
  
  const checker = FEATURE_PERMISSION_MAP[feature]
  if (!checker) return false
  
  // Direct role check
  if (checker(profile)) {
    return true
  }
  
  // Manager inheritance check
  if (profile.role === 'manager' && profile.department_scope?.length) {
    const inheritedRoles = getInheritedRoles(profile)
    
    for (const inheritedRole of inheritedRoles) {
      const virtualProfile = { ...profile, role: inheritedRole }
      if (checker(virtualProfile)) {
        return true
      }
    }
  }
  
  return false
}

/**
 * Check if profile has a specific permission
 */
export function hasPermission(
  profile: UserProfile | null,
  permission: keyof UserPermissions
): boolean {
  if (!profile) return false
  return profile[permission] ?? false
}

/**
 * Check if profile has one of the specified roles
 */
export function isRole(profile: UserProfile | null, role: UserRole | UserRole[]): boolean {
  if (!profile) return false
  const roles = Array.isArray(role) ? role : [role]
  return roles.includes(profile.role)
}

/**
 * Get dashboard type for a user based on their role and custom setting
 */
export function getDashboardType(profile: UserProfile | null): string {
  if (!profile) return 'default'
  if (profile.custom_dashboard && profile.custom_dashboard !== 'default') {
    return profile.custom_dashboard
  }
  
  // Map roles to dashboard types
  const roleDashboardMap: Record<UserRole, string> = {
    owner: 'executive',
    director: 'executive',
    manager: 'manager',
    sysadmin: 'sysadmin',
    administration: 'admin_finance',
    finance: 'admin_finance',
    marketing: 'marketing',
    ops: 'operations',
    engineer: 'engineering',
    hr: 'hr',
    hse: 'hse',
  }
  
  return roleDashboardMap[profile.role] || 'default'
}

/**
 * Check if email matches the owner email (case-insensitive)
 */
export function isOwnerEmail(email: string): boolean {
  return email.toLowerCase() === OWNER_EMAIL.toLowerCase()
}

/**
 * Get roles that can be assigned through the UI
 * Owner role cannot be assigned - it's auto-assigned based on email
 */
export function getAssignableRoles(): UserRole[] {
  return ['director', 'manager', 'sysadmin', 'administration', 'finance', 'marketing', 'ops', 'engineer', 'hr', 'hse']
}

/**
 * Check if a user can modify another user's role/permissions
 */
export function canModifyUser(actorRole: UserRole, targetRole: UserRole): boolean {
  if (targetRole === 'owner') return false
  return ['owner', 'director', 'sysadmin'].includes(actorRole)
}

/**
 * Check if a user profile is pending (pre-registered but not logged in)
 */
export function isPendingUser(profile: UserProfile): boolean {
  return profile.user_id === null
}

