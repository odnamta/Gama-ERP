/**
 * Login History Types
 * 
 * Type definitions for user authentication tracking.
 * Records login/logout events, session duration, and device information.
 */

/**
 * Login methods supported by the system
 */
export type LoginMethod = 'password' | 'google' | 'magic_link';

/**
 * Device types parsed from user agent
 */
export type DeviceType = 'desktop' | 'mobile' | 'tablet';

/**
 * Login attempt status
 */
export type LoginStatus = 'success' | 'failed';

/**
 * Login history entry as stored in the database
 */
export interface LoginHistoryEntry {
  id: string;
  user_id: string;
  
  // Session timing
  login_at: string;
  logout_at: string | null;
  session_duration_minutes: number | null;
  
  // Authentication method
  login_method: LoginMethod;
  
  // Client information
  ip_address: string | null;
  user_agent: string | null;
  
  // Device details
  device_type: DeviceType | null;
  browser: string | null;
  os: string | null;
  
  // Location
  country: string | null;
  city: string | null;
  
  // Status
  status: LoginStatus;
  failure_reason: string | null;
}

/**
 * Input for recording a login event
 */
export interface RecordLoginInput {
  user_id: string;
  login_method?: LoginMethod;
  ip_address?: string;
  user_agent?: string;
  device_type?: DeviceType;
  browser?: string;
  os?: string;
  country?: string;
  city?: string;
}

/**
 * Input for recording a failed login attempt
 */
export interface RecordFailedLoginInput {
  user_id?: string;
  email?: string;
  failure_reason: string;
  login_method?: LoginMethod;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Filters for querying login history
 */
export interface LoginHistoryFilters {
  user_id?: string;
  status?: LoginStatus | LoginStatus[];
  login_method?: LoginMethod | LoginMethod[];
  device_type?: DeviceType | DeviceType[];
  start_date?: string;
  end_date?: string;
}

/**
 * Pagination options for login history queries
 */
export interface LoginHistoryPagination {
  page: number;
  page_size: number;
  sort_by?: keyof LoginHistoryEntry;
  sort_order?: 'asc' | 'desc';
}

/**
 * Paginated login history response
 */
export interface PaginatedLoginHistory {
  data: LoginHistoryEntry[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/**
 * Session statistics for a user
 */
export interface SessionStatistics {
  user_id: string;
  total_sessions: number;
  successful_logins: number;
  failed_logins: number;
  average_session_duration_minutes: number;
  total_session_time_minutes: number;
  last_login_at: string | null;
  last_logout_at: string | null;
  most_used_device: DeviceType | null;
  most_used_browser: string | null;
  login_methods_used: LoginMethod[];
}

/**
 * Parsed user agent information
 */
export interface ParsedUserAgent {
  device_type: DeviceType;
  browser: string;
  os: string;
}

/**
 * Login details for recording
 */
export interface LoginDetails {
  ip_address?: string;
  user_agent?: string;
  login_method?: LoginMethod;
}

/**
 * Login history export options
 */
export interface LoginHistoryExportOptions {
  format: 'csv' | 'json';
  filters?: LoginHistoryFilters;
  columns?: (keyof LoginHistoryEntry)[];
  include_failed?: boolean;
}
