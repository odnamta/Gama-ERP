// Audit Trail Types

import { UserRole } from './permissions'

/**
 * Audit action types
 */
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
  | 'role_change'
  | 'permission_change'

/**
 * Audit log entry interface
 */
export interface AuditLogEntry {
  id?: string
  userId: string
  userName: string
  userEmail: string
  userRole: UserRole
  action: AuditAction
  module: string
  recordId?: string
  recordType?: string
  recordNumber?: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
  changesSummary?: string
  ipAddress?: string
  userAgent?: string
  sessionId?: string
  workflowStatusFrom?: string
  workflowStatusTo?: string
  createdAt?: string
}

/**
 * Audit log filter options
 */
export interface AuditLogFilter {
  userId?: string
  recordId?: string
  module?: string
  action?: AuditAction
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}

/**
 * Audit log query result
 */
export interface AuditLogQueryResult {
  logs: AuditLogEntry[]
  total: number
  hasMore: boolean
}

/**
 * Module names for audit logging
 */
export type AuditModule = 
  | 'customers'
  | 'projects'
  | 'quotations'
  | 'pjo'
  | 'job_orders'
  | 'invoices'
  | 'payments'
  | 'bkk'
  | 'vendors'
  | 'vendor_invoices'
  | 'employees'
  | 'attendance'
  | 'leave'
  | 'payroll'
  | 'assets'
  | 'maintenance'
  | 'incidents'
  | 'audits'
  | 'training'
  | 'ppe'
  | 'surveys'
  | 'jmp'
  | 'drawings'
  | 'users'
  | 'settings'
  | 'auth'
