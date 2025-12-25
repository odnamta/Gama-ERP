/**
 * Audit Types
 * 
 * Consolidated type definitions for the System Audit & Logging module.
 * Includes audit logs, system logs, login history, and data access logs.
 */

// =============================================================================
// AUDIT LOG TYPES
// =============================================================================

/**
 * Audit action types
 */
export type AuditAction = 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'view' 
  | 'export' 
  | 'approve' 
  | 'reject' 
  | 'submit' 
  | 'cancel'
  | 'INSERT'
  | 'UPDATE'
  | 'DELETE';

/**
 * Audit status
 */
export type AuditStatus = 'success' | 'failure' | 'pending';

/**
 * Audit log entry as stored in the database
 */
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  
  // User information
  user_id: string | null;
  user_email: string | null;
  user_role: string | null;
  
  // Action details
  action: AuditAction | string;
  module: string;
  
  // Entity information
  entity_type: string;
  entity_id: string | null;
  entity_reference: string | null;
  description: string | null;
  
  // Change tracking
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  changed_fields: string[] | null;
  
  // Request context
  ip_address: string | null;
  user_agent: string | null;
  session_id: string | null;
  request_method: string | null;
  request_path: string | null;
  
  // Status
  status: AuditStatus | null;
  error_message: string | null;
  
  // Additional data
  metadata: Record<string, unknown>;
}

/**
 * Input for creating a new audit log entry
 */
export interface CreateAuditLogInput {
  // Required fields
  action: AuditAction | string;
  module: string;
  entity_type: string;
  
  // Optional user info (auto-captured if not provided)
  user_id?: string;
  user_email?: string;
  user_role?: string;
  
  // Entity details
  entity_id?: string;
  entity_reference?: string;
  description?: string;
  
  // Change tracking
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  changed_fields?: string[];
  
  // Request context
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  request_method?: string;
  request_path?: string;
  
  // Status
  status?: AuditStatus;
  error_message?: string;
  
  // Additional data
  metadata?: Record<string, unknown>;
}

/**
 * Filters for querying audit logs
 */
export interface AuditLogFilters {
  user_id?: string;
  user_email?: string;
  action?: AuditAction | AuditAction[] | string | string[];
  module?: string | string[];
  entity_type?: string | string[];
  entity_id?: string;
  status?: AuditStatus | AuditStatus[];
  search?: string;
  start_date?: string;
  end_date?: string;
}

/**
 * Pagination options for audit log queries
 */
export interface AuditLogPagination {
  page: number;
  page_size: number;
  sort_by?: keyof AuditLogEntry;
  sort_order?: 'asc' | 'desc';
}

/**
 * Paginated audit log response
 */
export interface PaginatedAuditLogs {
  data: AuditLogEntry[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/**
 * Entity audit history request
 */
export interface EntityAuditHistoryRequest {
  entity_type: string;
  entity_id: string;
  limit?: number;
}

/**
 * Audit log statistics
 */
export interface AuditLogStats {
  total_entries: number;
  entries_by_action: Record<string, number>;
  entries_by_module: Array<{
    module: string;
    count: number;
  }>;
  entries_by_entity_type: Array<{
    entity_type: string;
    count: number;
  }>;
  top_users: Array<{
    user_id: string;
    user_email: string | null;
    count: number;
  }>;
  failure_rate: number;
}

// =============================================================================
// RE-EXPORT EXISTING TYPES
// =============================================================================

// Re-export from individual type files for convenience
export type {
  LoginMethod,
  DeviceType,
  LoginStatus,
  LoginHistoryEntry,
  RecordLoginInput,
  RecordFailedLoginInput,
  LoginHistoryFilters,
  LoginHistoryPagination,
  PaginatedLoginHistory,
  SessionStatistics,
  ParsedUserAgent,
  LoginDetails,
  LoginHistoryExportOptions,
} from './login-history';

export type {
  DataAccessType,
  ExportFileFormat,
  DataAccessLogEntry,
  LogDataExportInput,
  LogDataAccessInput,
  DataAccessLogFilters,
  DataAccessLogPagination,
  PaginatedDataAccessLogs,
  DataAccessStats,
} from './data-access-log';

export type {
  SystemLogLevel,
  SystemLogEntry,
  CreateSystemLogInput,
  SystemLogFilters,
  SystemLogPagination,
  PaginatedSystemLogs,
  SystemLogStats,
  ErrorContext,
  LogContext,
  SystemLogExportOptions,
} from './system-log';

// =============================================================================
// RETENTION CONFIGURATION
// =============================================================================

/**
 * Log retention periods in days
 */
export interface RetentionPeriods {
  audit_logs: number;
  system_logs: number;
  login_history: number;
  data_access_logs: number;
}

/**
 * Retention configuration
 */
export interface RetentionConfig {
  periods: RetentionPeriods;
  archive_enabled: boolean;
  archive_location: string | null;
  auto_cleanup_enabled: boolean;
  last_cleanup_at: string | null;
  next_cleanup_at: string | null;
}

/**
 * Storage statistics for audit tables
 */
export interface AuditStorageStats {
  audit_logs: {
    count: number;
    size_bytes: number;
    oldest_entry: string | null;
    newest_entry: string | null;
  };
  system_logs: {
    count: number;
    size_bytes: number;
    oldest_entry: string | null;
    newest_entry: string | null;
  };
  login_history: {
    count: number;
    size_bytes: number;
    oldest_entry: string | null;
    newest_entry: string | null;
  };
  data_access_logs: {
    count: number;
    size_bytes: number;
    oldest_entry: string | null;
    newest_entry: string | null;
  };
  total_size_bytes: number;
}

/**
 * Archive request
 */
export interface ArchiveRequest {
  log_type: 'audit_logs' | 'system_logs' | 'login_history' | 'data_access_logs';
  before_date: string;
  delete_after_archive?: boolean;
}

/**
 * Archive result
 */
export interface ArchiveResult {
  success: boolean;
  records_archived: number;
  records_deleted: number;
  archive_path: string | null;
  error?: string;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Changed field with old and new values
 */
export interface ChangedField {
  field: string;
  old_value: unknown;
  new_value: unknown;
}

/**
 * Formatted audit log description
 */
export interface FormattedAuditDescription {
  summary: string;
  details: string | null;
  changed_fields_summary: string | null;
}

/**
 * Audit log export options
 */
export interface AuditLogExportOptions {
  format: 'csv' | 'json';
  filters?: AuditLogFilters;
  columns?: (keyof AuditLogEntry)[];
  include_values?: boolean;
}
