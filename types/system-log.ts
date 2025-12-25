/**
 * System Log Types
 * 
 * Type definitions for the system logging functionality.
 * Tracks application events, errors, and debugging information.
 */

/**
 * Log levels in order of severity
 */
export type SystemLogLevel = 'error' | 'warn' | 'info' | 'debug';

/**
 * System log entry as stored in the database
 */
export interface SystemLogEntry {
  id: string;
  timestamp: string;
  
  // Log level and source
  level: SystemLogLevel;
  source: string;
  message: string;
  
  // Context information
  module: string | null;
  function_name: string | null;
  
  // Error details
  error_type: string | null;
  error_stack: string | null;
  
  // Request context
  request_id: string | null;
  user_id: string | null;
  
  // Additional data
  data: Record<string, unknown>;
}

/**
 * Input for creating a new system log entry
 */
export interface CreateSystemLogInput {
  // Required fields
  level: SystemLogLevel;
  source: string;
  message: string;
  
  // Optional context
  module?: string;
  function_name?: string;
  
  // Error details (for error logs)
  error_type?: string;
  error_stack?: string;
  
  // Request context
  request_id?: string;
  user_id?: string;
  
  // Additional data
  data?: Record<string, unknown>;
}

/**
 * Filters for querying system logs
 */
export interface SystemLogFilters {
  level?: SystemLogLevel | SystemLogLevel[];
  source?: string;
  module?: string;
  search?: string;
  user_id?: string;
  request_id?: string;
  start_date?: string;
  end_date?: string;
}

/**
 * Pagination options for system log queries
 */
export interface SystemLogPagination {
  page: number;
  page_size: number;
  sort_by?: keyof SystemLogEntry;
  sort_order?: 'asc' | 'desc';
}

/**
 * Paginated system log response
 */
export interface PaginatedSystemLogs {
  data: SystemLogEntry[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/**
 * System log statistics
 */
export interface SystemLogStats {
  total_entries: number;
  entries_by_level: Record<SystemLogLevel, number>;
  entries_by_source: Array<{
    source: string;
    count: number;
  }>;
  entries_by_module: Array<{
    module: string;
    count: number;
  }>;
  error_rate: number;
  recent_errors: SystemLogEntry[];
}

/**
 * Error context for logging
 */
export interface ErrorContext {
  error: Error;
  module?: string;
  function_name?: string;
  request_id?: string;
  user_id?: string;
  data?: Record<string, unknown>;
}

/**
 * Log context for non-error logs
 */
export interface LogContext {
  module?: string;
  function_name?: string;
  request_id?: string;
  user_id?: string;
  data?: Record<string, unknown>;
}

/**
 * System log export options
 */
export interface SystemLogExportOptions {
  format: 'csv' | 'json';
  filters?: SystemLogFilters;
  columns?: (keyof SystemLogEntry)[];
  include_stack_traces?: boolean;
}
