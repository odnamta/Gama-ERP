/**
 * Data Access Log Types
 * 
 * Type definitions for tracking data exports and sensitive data access.
 * Used for compliance monitoring and audit trails.
 */

/**
 * Types of data access
 */
export type DataAccessType = 'view' | 'export' | 'bulk_query' | 'download';

/**
 * Export file formats
 */
export type ExportFileFormat = 'csv' | 'xlsx' | 'pdf' | 'json';

/**
 * Data access log entry as stored in the database
 */
export interface DataAccessLogEntry {
  id: string;
  timestamp: string;
  user_id: string;
  
  // Data type and entity
  data_type: string;
  entity_type: string | null;
  entity_id: string | null;
  
  // Access details
  access_type: DataAccessType;
  reason: string | null;
  
  // Request context
  ip_address: string | null;
  
  // Export details
  records_count: number | null;
  file_format: ExportFileFormat | null;
}

/**
 * Input for logging data export
 */
export interface LogDataExportInput {
  user_id: string;
  data_type: string;
  file_format: ExportFileFormat;
  records_count: number;
  entity_type?: string;
  reason?: string;
  ip_address?: string;
}

/**
 * Input for logging data access
 */
export interface LogDataAccessInput {
  user_id: string;
  data_type: string;
  access_type: DataAccessType;
  entity_type?: string;
  entity_id?: string;
  reason?: string;
  ip_address?: string;
  records_count?: number;
}

/**
 * Filters for querying data access logs
 */
export interface DataAccessLogFilters {
  user_id?: string;
  data_type?: string;
  entity_type?: string;
  access_type?: DataAccessType | DataAccessType[];
  file_format?: ExportFileFormat | ExportFileFormat[];
  start_date?: string;
  end_date?: string;
}

/**
 * Pagination options for data access log queries
 */
export interface DataAccessLogPagination {
  page: number;
  page_size: number;
  sort_by?: keyof DataAccessLogEntry;
  sort_order?: 'asc' | 'desc';
}

/**
 * Paginated data access log response
 */
export interface PaginatedDataAccessLogs {
  data: DataAccessLogEntry[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/**
 * Data access statistics
 */
export interface DataAccessStats {
  total_accesses: number;
  total_exports: number;
  total_records_exported: number;
  accesses_by_type: Record<DataAccessType, number>;
  accesses_by_data_type: Array<{
    data_type: string;
    count: number;
  }>;
  exports_by_format: Record<ExportFileFormat, number>;
  top_users: Array<{
    user_id: string;
    count: number;
  }>;
}
