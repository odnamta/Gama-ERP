/**
 * Data Access Log Utility Functions
 * v0.76: System Audit & Logging Module
 * 
 * Provides utility functions for data access logging, including:
 * - Logging data exports with format and record count
 * - Logging sensitive data access
 * - Querying data access logs with filters
 * - Data access statistics and aggregation
 */

import {
  DataAccessLogEntry,
  LogDataExportInput,
  LogDataAccessInput,
  DataAccessLogFilters,
  DataAccessLogPagination,
  PaginatedDataAccessLogs,
  DataAccessType,
  ExportFileFormat,
  DataAccessStats,
} from '@/types/data-access-log';

// =====================================================
// Constants
// =====================================================

/**
 * Default pagination settings
 */
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;

/**
 * Access type labels for display
 */
export const ACCESS_TYPE_LABELS: Record<DataAccessType, string> = {
  view: 'View',
  export: 'Export',
  bulk_query: 'Bulk Query',
  download: 'Download',
};

/**
 * File format labels for display
 */
export const FILE_FORMAT_LABELS: Record<ExportFileFormat, string> = {
  csv: 'CSV',
  xlsx: 'Excel',
  pdf: 'PDF',
  json: 'JSON',
};

/**
 * Access type colors for UI
 */
export const ACCESS_TYPE_COLORS: Record<DataAccessType, string> = {
  view: 'bg-blue-100 text-blue-800 border-blue-200',
  export: 'bg-green-100 text-green-800 border-green-200',
  bulk_query: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  download: 'bg-purple-100 text-purple-800 border-purple-200',
};

// =====================================================
// Log Entry Creation
// =====================================================

/**
 * Creates a data export log input.
 * 
 * Property 9: Data Export Logging
 * For any data export operation, the data_access_log entry SHALL contain 
 * the data_type, file_format, and records_count, and access_type SHALL be 'export'.
 * Validates: Requirements 4.1
 * 
 * @param input - Export log input parameters
 * @returns DataAccessLogEntry ready for database insertion (without id/timestamp)
 */
export function createDataExportLogInput(
  input: LogDataExportInput
): Omit<DataAccessLogEntry, 'id' | 'timestamp'> {
  return {
    user_id: input.user_id,
    data_type: input.data_type,
    entity_type: input.entity_type ?? null,
    entity_id: null,
    access_type: 'export',
    reason: input.reason ?? null,
    ip_address: input.ip_address ?? null,
    records_count: input.records_count,
    file_format: input.file_format,
  };
}

/**
 * Creates a data access log input.
 * 
 * @param input - Access log input parameters
 * @returns DataAccessLogEntry ready for database insertion (without id/timestamp)
 */
export function createDataAccessLogInput(
  input: LogDataAccessInput
): Omit<DataAccessLogEntry, 'id' | 'timestamp'> {
  return {
    user_id: input.user_id,
    data_type: input.data_type,
    entity_type: input.entity_type ?? null,
    entity_id: input.entity_id ?? null,
    access_type: input.access_type,
    reason: input.reason ?? null,
    ip_address: input.ip_address ?? null,
    records_count: input.records_count ?? null,
    file_format: null,
  };
}

// =====================================================
// Log Filtering
// =====================================================

/**
 * Filters data access log entries based on provided criteria.
 * 
 * @param entries - Array of data access log entries to filter
 * @param filters - Filter criteria
 * @returns Filtered array of data access log entries
 */
export function filterDataAccessLogs(
  entries: DataAccessLogEntry[],
  filters: DataAccessLogFilters
): DataAccessLogEntry[] {
  return entries.filter((entry) => {
    // Filter by user_id
    if (filters.user_id && entry.user_id !== filters.user_id) {
      return false;
    }

    // Filter by data_type (case-insensitive partial match)
    if (filters.data_type) {
      if (!entry.data_type.toLowerCase().includes(filters.data_type.toLowerCase())) {
        return false;
      }
    }

    // Filter by entity_type (case-insensitive partial match)
    if (filters.entity_type) {
      if (!entry.entity_type) return false;
      if (!entry.entity_type.toLowerCase().includes(filters.entity_type.toLowerCase())) {
        return false;
      }
    }

    // Filter by access_type (single or array)
    if (filters.access_type) {
      const accessTypes = Array.isArray(filters.access_type) 
        ? filters.access_type 
        : [filters.access_type];
      if (!accessTypes.includes(entry.access_type)) {
        return false;
      }
    }

    // Filter by file_format (single or array)
    if (filters.file_format) {
      const formats = Array.isArray(filters.file_format) 
        ? filters.file_format 
        : [filters.file_format];
      if (!entry.file_format || !formats.includes(entry.file_format)) {
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
 * Sorts data access log entries by specified field.
 * 
 * @param entries - Array of data access log entries to sort
 * @param sortBy - Field to sort by (default: timestamp)
 * @param sortOrder - Sort order (default: desc)
 * @returns Sorted array of data access log entries
 */
export function sortDataAccessLogs(
  entries: DataAccessLogEntry[],
  sortBy: keyof DataAccessLogEntry = 'timestamp',
  sortOrder: 'asc' | 'desc' = 'desc'
): DataAccessLogEntry[] {
  return [...entries].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];

    if (aVal === null || aVal === undefined) return sortOrder === 'asc' ? -1 : 1;
    if (bVal === null || bVal === undefined) return sortOrder === 'asc' ? 1 : -1;

    let comparison = 0;
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      comparison = aVal.localeCompare(bVal);
    } else if (typeof aVal === 'number' && typeof bVal === 'number') {
      comparison = aVal - bVal;
    } else if (aVal < bVal) {
      comparison = -1;
    } else if (aVal > bVal) {
      comparison = 1;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });
}

// =====================================================
// Log Pagination
// =====================================================

/**
 * Paginates data access log entries.
 * 
 * @param entries - Array of data access log entries to paginate
 * @param pagination - Pagination options
 * @returns Paginated result with metadata
 */
export function paginateDataAccessLogs(
  entries: DataAccessLogEntry[],
  pagination: DataAccessLogPagination
): PaginatedDataAccessLogs {
  const { page, page_size, sort_by = 'timestamp', sort_order = 'desc' } = pagination;

  // Validate pagination
  const validPageSize = Math.min(Math.max(1, page_size), MAX_PAGE_SIZE);
  const validPage = Math.max(1, page);

  // Sort entries
  const sorted = sortDataAccessLogs(entries, sort_by, sort_order);

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
 * Calculates statistics for data access logs.
 * 
 * @param entries - Array of data access log entries
 * @returns Statistics object with counts and aggregations
 */
export function calculateDataAccessStats(entries: DataAccessLogEntry[]): DataAccessStats {
  // Count by access type
  const accesses_by_type: Record<DataAccessType, number> = {
    view: 0,
    export: 0,
    bulk_query: 0,
    download: 0,
  };

  // Count exports by format
  const exports_by_format: Record<ExportFileFormat, number> = {
    csv: 0,
    xlsx: 0,
    pdf: 0,
    json: 0,
  };

  // Count by data type
  const dataTypeMap = new Map<string, number>();

  // Count by user
  const userMap = new Map<string, number>();

  // Total records exported
  let total_records_exported = 0;
  let total_exports = 0;

  for (const entry of entries) {
    // Count by access type
    accesses_by_type[entry.access_type]++;

    // Count exports
    if (entry.access_type === 'export') {
      total_exports++;
      if (entry.records_count) {
        total_records_exported += entry.records_count;
      }
      if (entry.file_format) {
        exports_by_format[entry.file_format]++;
      }
    }

    // Count by data type
    dataTypeMap.set(entry.data_type, (dataTypeMap.get(entry.data_type) || 0) + 1);

    // Count by user
    userMap.set(entry.user_id, (userMap.get(entry.user_id) || 0) + 1);
  }

  // Convert maps to sorted arrays
  const accesses_by_data_type = Array.from(dataTypeMap.entries())
    .map(([data_type, count]) => ({ data_type, count }))
    .sort((a, b) => b.count - a.count);

  const top_users = Array.from(userMap.entries())
    .map(([user_id, count]) => ({ user_id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    total_accesses: entries.length,
    total_exports,
    total_records_exported,
    accesses_by_type,
    accesses_by_data_type,
    exports_by_format,
    top_users,
  };
}

/**
 * Counts data access logs by access type.
 */
export function countByAccessType(entries: DataAccessLogEntry[]): Record<DataAccessType, number> {
  const counts: Record<DataAccessType, number> = {
    view: 0,
    export: 0,
    bulk_query: 0,
    download: 0,
  };

  for (const entry of entries) {
    counts[entry.access_type]++;
  }

  return counts;
}

/**
 * Counts data access logs by data type.
 */
export function countByDataType(entries: DataAccessLogEntry[]): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const entry of entries) {
    counts[entry.data_type] = (counts[entry.data_type] || 0) + 1;
  }

  return counts;
}

/**
 * Counts exports by file format.
 */
export function countExportsByFormat(entries: DataAccessLogEntry[]): Record<ExportFileFormat, number> {
  const counts: Record<ExportFileFormat, number> = {
    csv: 0,
    xlsx: 0,
    pdf: 0,
    json: 0,
  };

  for (const entry of entries) {
    if (entry.access_type === 'export' && entry.file_format) {
      counts[entry.file_format]++;
    }
  }

  return counts;
}

/**
 * Calculates total records exported.
 */
export function calculateTotalRecordsExported(entries: DataAccessLogEntry[]): number {
  return entries
    .filter((e) => e.access_type === 'export' && e.records_count !== null)
    .reduce((sum, e) => sum + (e.records_count || 0), 0);
}

// =====================================================
// Formatting Functions
// =====================================================

/**
 * Formats access type for display.
 */
export function formatAccessType(accessType: DataAccessType): string {
  return ACCESS_TYPE_LABELS[accessType];
}

/**
 * Gets access type badge color class.
 */
export function getAccessTypeColor(accessType: DataAccessType): string {
  return ACCESS_TYPE_COLORS[accessType];
}

/**
 * Formats file format for display.
 */
export function formatFileFormat(format: ExportFileFormat): string {
  return FILE_FORMAT_LABELS[format];
}

/**
 * Formats timestamp for display.
 */
export function formatAccessTimestamp(timestamp: string): string {
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
 * Formats records count for display.
 */
export function formatRecordsCount(count: number | null): string {
  if (count === null) return '-';
  return count.toLocaleString();
}

// =====================================================
// Validation Functions
// =====================================================

/**
 * Validates if a string is a valid access type.
 */
export function isValidAccessType(type: string): type is DataAccessType {
  return ['view', 'export', 'bulk_query', 'download'].includes(type);
}

/**
 * Validates if a string is a valid file format.
 */
export function isValidFileFormat(format: string): format is ExportFileFormat {
  return ['csv', 'xlsx', 'pdf', 'json'].includes(format);
}

/**
 * Validates data export log input.
 * 
 * Property 9: Data Export Logging
 * For any data export operation, the data_access_log entry SHALL contain 
 * the data_type, file_format, and records_count, and access_type SHALL be 'export'.
 */
export function validateExportLogInput(input: Partial<LogDataExportInput>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!input.user_id || input.user_id.trim() === '') {
    errors.push('User ID is required');
  }

  if (!input.data_type || input.data_type.trim() === '') {
    errors.push('Data type is required');
  }

  if (!input.file_format) {
    errors.push('File format is required');
  } else if (!isValidFileFormat(input.file_format)) {
    errors.push('Invalid file format');
  }

  if (input.records_count === undefined || input.records_count === null) {
    errors.push('Records count is required');
  } else if (input.records_count < 0) {
    errors.push('Records count must be non-negative');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates data access log input.
 */
export function validateAccessLogInput(input: Partial<LogDataAccessInput>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!input.user_id || input.user_id.trim() === '') {
    errors.push('User ID is required');
  }

  if (!input.data_type || input.data_type.trim() === '') {
    errors.push('Data type is required');
  }

  if (!input.access_type) {
    errors.push('Access type is required');
  } else if (!isValidAccessType(input.access_type)) {
    errors.push('Invalid access type');
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
 * Formats data access log entry for CSV export.
 */
export function formatForCsvExport(entry: DataAccessLogEntry): Record<string, string> {
  return {
    timestamp: entry.timestamp,
    user_id: entry.user_id,
    data_type: entry.data_type,
    entity_type: entry.entity_type || '',
    entity_id: entry.entity_id || '',
    access_type: formatAccessType(entry.access_type),
    reason: entry.reason || '',
    ip_address: entry.ip_address || '',
    records_count: entry.records_count?.toString() || '',
    file_format: entry.file_format ? formatFileFormat(entry.file_format) : '',
  };
}

/**
 * Exports data access logs to CSV format.
 */
export function exportToCsv(entries: DataAccessLogEntry[]): string {
  const headers = [
    'Timestamp',
    'User ID',
    'Data Type',
    'Entity Type',
    'Entity ID',
    'Access Type',
    'Reason',
    'IP Address',
    'Records Count',
    'File Format',
  ];

  const rows = entries.map((entry) => {
    const formatted = formatForCsvExport(entry);
    return [
      formatted.timestamp,
      formatted.user_id,
      formatted.data_type,
      formatted.entity_type,
      formatted.entity_id,
      formatted.access_type,
      formatted.reason,
      formatted.ip_address,
      formatted.records_count,
      formatted.file_format,
    ].map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

// =====================================================
// Query Helpers
// =====================================================

/**
 * Gets export logs only.
 */
export function getExportLogs(entries: DataAccessLogEntry[]): DataAccessLogEntry[] {
  return entries.filter((e) => e.access_type === 'export');
}

/**
 * Gets logs for a specific user.
 */
export function getLogsByUser(
  entries: DataAccessLogEntry[],
  userId: string
): DataAccessLogEntry[] {
  return entries.filter((e) => e.user_id === userId);
}

/**
 * Gets logs for a specific data type.
 */
export function getLogsByDataType(
  entries: DataAccessLogEntry[],
  dataType: string
): DataAccessLogEntry[] {
  return entries.filter((e) => e.data_type === dataType);
}

/**
 * Gets logs for a specific entity.
 */
export function getLogsByEntity(
  entries: DataAccessLogEntry[],
  entityType: string,
  entityId: string
): DataAccessLogEntry[] {
  return entries.filter(
    (e) => e.entity_type === entityType && e.entity_id === entityId
  );
}
