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
 * Audit status types
 */
export type AuditStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'

/**
 * Audit statuses constant
 */
export const AUDIT_STATUSES: AuditStatus[] = ['scheduled', 'in_progress', 'completed', 'cancelled']

/**
 * Audit categories
 */
export const AUDIT_CATEGORIES = [
  'safety',
  'quality',
  'environmental',
  'compliance',
  'operational',
  'financial',
] as const

export type AuditCategory = typeof AUDIT_CATEGORIES[number]

/**
 * Checklist item types
 */
export const CHECKLIST_ITEM_TYPES = [
  'yes_no',
  'rating',
  'text',
  'number',
  'date',
] as const

export type ChecklistItemType = typeof CHECKLIST_ITEM_TYPES[number]

/**
 * Finding severities
 */
export const FINDING_SEVERITIES = [
  'critical',
  'major',
  'minor',
  'observation',
] as const

export type FindingSeverity = typeof FINDING_SEVERITIES[number]

/**
 * Risk levels
 */
export const RISK_LEVELS = [
  'high',
  'medium',
  'low',
] as const

export type RiskLevel = typeof RISK_LEVELS[number]

/**
 * Finding statuses
 */
export const FINDING_STATUSES = [
  'open',
  'in_progress',
  'resolved',
  'verified',
  'closed',
] as const

export type FindingStatus = typeof FINDING_STATUSES[number]

/**
 * Score thresholds for audit scoring
 */
export const SCORE_THRESHOLDS = {
  excellent: 90,
  good: 75,
  acceptable: 60,
  poor: 0,
} as const

/**
 * Days before due date to consider "due soon"
 */
export const DUE_SOON_DAYS = 7

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


/**
 * Retention periods for different log types
 */
export interface RetentionPeriods {
  audit_logs: number
  system_logs: number
  login_history: number
  data_access_logs: number
}

/**
 * Retention configuration
 */
export interface RetentionConfig {
  periods: RetentionPeriods
  archive_enabled: boolean
  archive_location: string | null
  auto_cleanup_enabled: boolean
  last_cleanup_at: string | null
  next_cleanup_at: string | null
}

/**
 * Storage statistics for audit tables
 */
export interface AuditStorageStats {
  audit_logs: {
    count: number
    size_bytes: number
    oldest_entry: string | null
    newest_entry: string | null
  }
  system_logs: {
    count: number
    size_bytes: number
    oldest_entry: string | null
    newest_entry: string | null
  }
  login_history: {
    count: number
    size_bytes: number
    oldest_entry: string | null
    newest_entry: string | null
  }
  data_access_logs: {
    count: number
    size_bytes: number
    oldest_entry: string | null
    newest_entry: string | null
  }
  total_size_bytes: number
}

/**
 * Archive request
 */
export interface ArchiveRequest {
  log_type: 'audit_logs' | 'system_logs' | 'login_history' | 'data_access_logs'
  before_date: string
  delete_after_archive?: boolean
}

/**
 * Archive result
 */
export interface ArchiveResult {
  success: boolean
  records_archived: number
  records_deleted: number
  archive_path: string | null
  error?: string
}
