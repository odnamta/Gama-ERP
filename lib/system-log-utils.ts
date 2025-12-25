/**
 * System Log Utility Functions
 * v0.76: System Audit & Logging Module
 * 
 * Provides utility functions for system logging, including:
 * - Logging errors with stack trace capture
 * - Logging warnings, info, and debug messages
 * - Querying system logs with filters
 * - Log statistics and aggregation
 */

import {
  SystemLogEntry,
  CreateSystemLogInput,
  SystemLogFilters,
  SystemLogPagination,
  PaginatedSystemLogs,
  SystemLogLevel,
  SystemLogStats,
  ErrorContext,
  LogContext,
} from '@/types/system-log';

// =====================================================
// Constants
// =====================================================

/**
 * Default pagination settings
 */
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;

/**
 * Log level severity order (lower = more severe)
 */
export const LOG_LEVEL_SEVERITY: Record<SystemLogLevel, number> = {
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
};

/**
 * Log level labels for display
 */
export const LOG_LEVEL_LABELS: Record<SystemLogLevel, string> = {
  error: 'Error',
  warn: 'Warning',
  info: 'Info',
  debug: 'Debug',
};

/**
 * Log level colors for UI
 */
export const LOG_LEVEL_COLORS: Record<SystemLogLevel, string> = {
  error: 'bg-red-100 text-red-800 border-red-200',
  warn: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  info: 'bg-blue-100 text-blue-800 border-blue-200',
  debug: 'bg-gray-100 text-gray-800 border-gray-200',
};

// =====================================================
// Log Entry Creation
// =====================================================

/**
 * Creates a system log input for an error.
 * 
 * Property 4: System Log Error Capture
 * For any error logged via the system logging utility, the resulting log entry 
 * SHALL contain the error type (from error.name), the error message (from error.message), 
 * and the stack trace (from error.stack) when available.
 * 
 * @param source - The source module/component logging the error
 * @param error - The Error object to log
 * @param context - Additional context for the log entry
 * @returns CreateSystemLogInput ready for database insertion
 */
export function createErrorLogInput(
  source: string,
  error: Error,
  context?: Omit<ErrorContext, 'error'>
): CreateSystemLogInput {
  return {
    level: 'error',
    source,
    message: error.message,
    module: context?.module,
    function_name: context?.function_name,
    error_type: error.name,
    error_stack: error.stack,
    request_id: context?.request_id,
    user_id: context?.user_id,
    data: context?.data ?? {},
  };
}

/**
 * Creates a system log input for a warning.
 * 
 * Property 5: System Log Level Support
 * For any of the four log levels (error, warn, info, debug), the system logging 
 * utility SHALL accept and store the log entry with the correct level value.
 * 
 * @param source - The source module/component logging the warning
 * @param message - The warning message
 * @param context - Additional context for the log entry
 * @returns CreateSystemLogInput ready for database insertion
 */
export function createWarnLogInput(
  source: string,
  message: string,
  context?: LogContext
): CreateSystemLogInput {
  return {
    level: 'warn',
    source,
    message,
    module: context?.module,
    function_name: context?.function_name,
    request_id: context?.request_id,
    user_id: context?.user_id,
    data: context?.data ?? {},
  };
}

/**
 * Creates a system log input for an info message.
 * 
 * @param source - The source module/component logging the info
 * @param message - The info message
 * @param context - Additional context for the log entry
 * @returns CreateSystemLogInput ready for database insertion
 */
export function createInfoLogInput(
  source: string,
  message: string,
  context?: LogContext
): CreateSystemLogInput {
  return {
    level: 'info',
    source,
    message,
    module: context?.module,
    function_name: context?.function_name,
    request_id: context?.request_id,
    user_id: context?.user_id,
    data: context?.data ?? {},
  };
}

/**
 * Creates a system log input for a debug message.
 * 
 * @param source - The source module/component logging the debug info
 * @param message - The debug message
 * @param context - Additional context for the log entry
 * @returns CreateSystemLogInput ready for database insertion
 */
export function createDebugLogInput(
  source: string,
  message: string,
  context?: LogContext
): CreateSystemLogInput {
  return {
    level: 'debug',
    source,
    message,
    module: context?.module,
    function_name: context?.function_name,
    request_id: context?.request_id,
    user_id: context?.user_id,
    data: context?.data ?? {},
  };
}

/**
 * Creates a generic system log input with specified level.
 * 
 * @param level - The log level
 * @param source - The source module/component
 * @param message - The log message
 * @param context - Additional context for the log entry
 * @returns CreateSystemLogInput ready for database insertion
 */
export function createLogInput(
  level: SystemLogLevel,
  source: string,
  message: string,
  context?: LogContext
): CreateSystemLogInput {
  return {
    level,
    source,
    message,
    module: context?.module,
    function_name: context?.function_name,
    request_id: context?.request_id,
    user_id: context?.user_id,
    data: context?.data ?? {},
  };
}

// =====================================================
// Log Filtering
// =====================================================

/**
 * Filters system log entries based on provided criteria.
 * 
 * Property 12: System Log Filter Correctness
 * For any combination of system log filters (level, source, module, search term, 
 * date range), all returned entries SHALL match ALL specified filter criteria, 
 * and text search SHALL match entries where the message contains the search term.
 * 
 * @param entries - Array of system log entries to filter
 * @param filters - Filter criteria
 * @returns Filtered array of system log entries
 */
export function filterSystemLogs(
  entries: SystemLogEntry[],
  filters: SystemLogFilters
): SystemLogEntry[] {
  return entries.filter((entry) => {
    // Filter by level (single or array)
    if (filters.level) {
      const levels = Array.isArray(filters.level) ? filters.level : [filters.level];
      if (!levels.includes(entry.level)) {
        return false;
      }
    }

    // Filter by source (case-insensitive partial match)
    if (filters.source) {
      if (!entry.source.toLowerCase().includes(filters.source.toLowerCase())) {
        return false;
      }
    }

    // Filter by module (case-insensitive partial match)
    if (filters.module) {
      if (!entry.module) return false;
      if (!entry.module.toLowerCase().includes(filters.module.toLowerCase())) {
        return false;
      }
    }

    // Filter by user_id
    if (filters.user_id && entry.user_id !== filters.user_id) {
      return false;
    }

    // Filter by request_id
    if (filters.request_id && entry.request_id !== filters.request_id) {
      return false;
    }

    // Filter by search term (searches in message)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (!entry.message.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    // Filter by date range
    if (filters.start_date) {
      const entryDate = new Date(entry.timestamp);
      const startDate = new Date(filters.start_date);
      startDate.setHours(0, 0, 0, 0);
      if (entryDate < startDate) {
        return false;
      }
    }

    if (filters.end_date) {
      const entryDate = new Date(entry.timestamp);
      const endDate = new Date(filters.end_date);
      endDate.setHours(23, 59, 59, 999);
      if (entryDate > endDate) {
        return false;
      }
    }

    return true;
  });
}

// =====================================================
// Log Sorting
// =====================================================

/**
 * Sorts system log entries by specified field.
 * 
 * Property 13: Query Results Timestamp Ordering
 * For any query result from system_logs, the entries SHALL be sorted by 
 * timestamp in descending order (most recent first).
 * 
 * @param entries - Array of system log entries to sort
 * @param sortBy - Field to sort by (default: timestamp)
 * @param sortOrder - Sort order (default: desc)
 * @returns Sorted array of system log entries
 */
export function sortSystemLogs(
  entries: SystemLogEntry[],
  sortBy: keyof SystemLogEntry = 'timestamp',
  sortOrder: 'asc' | 'desc' = 'desc'
): SystemLogEntry[] {
  return [...entries].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];

    if (aVal === null || aVal === undefined) return sortOrder === 'asc' ? -1 : 1;
    if (bVal === null || bVal === undefined) return sortOrder === 'asc' ? 1 : -1;

    let comparison = 0;
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      comparison = aVal.localeCompare(bVal);
    } else if (aVal < bVal) {
      comparison = -1;
    } else if (aVal > bVal) {
      comparison = 1;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });
}

/**
 * Sorts system log entries by severity (most severe first)
 */
export function sortByLevel(entries: SystemLogEntry[]): SystemLogEntry[] {
  return [...entries].sort((a, b) => {
    const aSeverity = LOG_LEVEL_SEVERITY[a.level];
    const bSeverity = LOG_LEVEL_SEVERITY[b.level];
    return aSeverity - bSeverity;
  });
}

// =====================================================
// Log Pagination
// =====================================================

/**
 * Paginates system log entries.
 * 
 * @param entries - Array of system log entries to paginate
 * @param pagination - Pagination options
 * @returns Paginated result with metadata
 */
export function paginateSystemLogs(
  entries: SystemLogEntry[],
  pagination: SystemLogPagination
): PaginatedSystemLogs {
  const { page, page_size, sort_by = 'timestamp', sort_order = 'desc' } = pagination;

  // Validate pagination
  const validPageSize = Math.min(Math.max(1, page_size), MAX_PAGE_SIZE);
  const validPage = Math.max(1, page);

  // Sort entries
  const sorted = sortSystemLogs(entries, sort_by, sort_order);

  // Calculate pagination
  const total = sorted.length;
  const total_pages = Math.ceil(total / validPageSize);
  const offset = (validPage - 1) * validPageSize;

  // Slice for current page
  const data = sorted.slice(offset, offset + validPageSize);

  return {
    data,
    total,
    page: validPage,
    page_size: validPageSize,
    total_pages,
  };
}

// =====================================================
// Log Statistics
// =====================================================

/**
 * Calculates statistics for system logs.
 * 
 * @param entries - Array of system log entries
 * @returns Statistics object with counts and aggregations
 */
export function calculateLogStats(entries: SystemLogEntry[]): SystemLogStats {
  // Count by level
  const entries_by_level: Record<SystemLogLevel, number> = {
    error: 0,
    warn: 0,
    info: 0,
    debug: 0,
  };

  // Count by source
  const sourceMap = new Map<string, number>();

  // Count by module
  const moduleMap = new Map<string, number>();

  for (const entry of entries) {
    // Count by level
    entries_by_level[entry.level]++;

    // Count by source
    sourceMap.set(entry.source, (sourceMap.get(entry.source) || 0) + 1);

    // Count by module
    if (entry.module) {
      moduleMap.set(entry.module, (moduleMap.get(entry.module) || 0) + 1);
    }
  }

  // Convert maps to sorted arrays
  const entries_by_source = Array.from(sourceMap.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);

  const entries_by_module = Array.from(moduleMap.entries())
    .map(([module, count]) => ({ module, count }))
    .sort((a, b) => b.count - a.count);

  // Calculate error rate
  const error_rate = entries.length > 0
    ? (entries_by_level.error / entries.length) * 100
    : 0;

  // Get recent errors (last 10)
  const recent_errors = entries
    .filter((e) => e.level === 'error')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  return {
    total_entries: entries.length,
    entries_by_level,
    entries_by_source,
    entries_by_module,
    error_rate,
    recent_errors,
  };
}

/**
 * Counts system logs by level.
 */
export function countByLevel(entries: SystemLogEntry[]): Record<SystemLogLevel, number> {
  const counts: Record<SystemLogLevel, number> = {
    error: 0,
    warn: 0,
    info: 0,
    debug: 0,
  };

  for (const entry of entries) {
    counts[entry.level]++;
  }

  return counts;
}

/**
 * Counts system logs by source.
 */
export function countBySource(entries: SystemLogEntry[]): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const entry of entries) {
    counts[entry.source] = (counts[entry.source] || 0) + 1;
  }

  return counts;
}

/**
 * Counts system logs by module.
 */
export function countByModule(entries: SystemLogEntry[]): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const entry of entries) {
    if (entry.module) {
      counts[entry.module] = (counts[entry.module] || 0) + 1;
    }
  }

  return counts;
}

/**
 * Calculates error rate from system logs.
 */
export function calculateErrorRate(entries: SystemLogEntry[]): number {
  if (entries.length === 0) return 0;
  const errors = entries.filter((e) => e.level === 'error').length;
  return (errors / entries.length) * 100;
}

// =====================================================
// Formatting Functions
// =====================================================

/**
 * Formats log level for display.
 */
export function formatLogLevel(level: SystemLogLevel): string {
  return LOG_LEVEL_LABELS[level];
}

/**
 * Gets log level badge color class.
 */
export function getLogLevelColor(level: SystemLogLevel): string {
  return LOG_LEVEL_COLORS[level];
}

/**
 * Formats timestamp for display.
 */
export function formatLogTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/**
 * Formats stack trace for display (truncates if too long).
 */
export function formatStackTrace(stack: string | null, maxLines: number = 10): string | null {
  if (!stack) return null;

  const lines = stack.split('\n');
  if (lines.length <= maxLines) return stack;

  return lines.slice(0, maxLines).join('\n') + `\n... (${lines.length - maxLines} more lines)`;
}

// =====================================================
// Validation Functions
// =====================================================

/**
 * Validates if a string is a valid log level.
 */
export function isValidLogLevel(level: string): level is SystemLogLevel {
  return ['error', 'warn', 'info', 'debug'].includes(level);
}

/**
 * Validates system log input.
 */
export function validateLogInput(input: Partial<CreateSystemLogInput>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!input.level) {
    errors.push('Level is required');
  } else if (!isValidLogLevel(input.level)) {
    errors.push('Invalid log level');
  }

  if (!input.source || input.source.trim() === '') {
    errors.push('Source is required');
  }

  if (!input.message || input.message.trim() === '') {
    errors.push('Message is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// =====================================================
// Export Helpers
// =====================================================

/**
 * Formats system log entry for CSV export.
 */
export function formatForCsvExport(entry: SystemLogEntry): Record<string, string> {
  return {
    timestamp: entry.timestamp,
    level: formatLogLevel(entry.level),
    source: entry.source,
    message: entry.message,
    module: entry.module || '',
    function_name: entry.function_name || '',
    error_type: entry.error_type || '',
    request_id: entry.request_id || '',
    user_id: entry.user_id || '',
  };
}

/**
 * Exports system logs to CSV format.
 */
export function exportToCsv(entries: SystemLogEntry[]): string {
  const headers = [
    'Timestamp',
    'Level',
    'Source',
    'Message',
    'Module',
    'Function',
    'Error Type',
    'Request ID',
    'User ID',
  ];

  const rows = entries.map((entry) => {
    const formatted = formatForCsvExport(entry);
    return [
      formatted.timestamp,
      formatted.level,
      formatted.source,
      formatted.message,
      formatted.module,
      formatted.function_name,
      formatted.error_type,
      formatted.request_id,
      formatted.user_id,
    ].map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

// =====================================================
// Error Extraction Helpers
// =====================================================

/**
 * Extracts error details from an Error object.
 * 
 * Property 4: System Log Error Capture
 * For any error logged via the system logging utility, the resulting log entry 
 * SHALL contain the error type (from error.name), the error message (from error.message), 
 * and the stack trace (from error.stack) when available.
 */
export function extractErrorDetails(error: Error): {
  error_type: string;
  message: string;
  error_stack: string | null;
} {
  return {
    error_type: error.name,
    message: error.message,
    error_stack: error.stack || null,
  };
}

/**
 * Creates an error from unknown caught value.
 */
export function normalizeError(caught: unknown): Error {
  if (caught instanceof Error) {
    return caught;
  }

  if (typeof caught === 'string') {
    return new Error(caught);
  }

  if (typeof caught === 'object' && caught !== null) {
    const obj = caught as Record<string, unknown>;
    const message = obj.message ? String(obj.message) : JSON.stringify(caught);
    const error = new Error(message);
    if (obj.name) error.name = String(obj.name);
    return error;
  }

  return new Error(String(caught));
}

// =====================================================
// Query Helpers
// =====================================================

/**
 * Gets logs for a specific request ID (for request tracing).
 */
export function getLogsByRequestId(
  entries: SystemLogEntry[],
  requestId: string
): SystemLogEntry[] {
  return entries
    .filter((e) => e.request_id === requestId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

/**
 * Gets error logs only.
 */
export function getErrorLogs(entries: SystemLogEntry[]): SystemLogEntry[] {
  return entries.filter((e) => e.level === 'error');
}

/**
 * Gets logs at or above a certain severity level.
 */
export function getLogsAtOrAboveLevel(
  entries: SystemLogEntry[],
  minLevel: SystemLogLevel
): SystemLogEntry[] {
  const minSeverity = LOG_LEVEL_SEVERITY[minLevel];
  return entries.filter((e) => LOG_LEVEL_SEVERITY[e.level] <= minSeverity);
}
