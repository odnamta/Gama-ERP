/**
 * Cached Query Functions
 * Pre-cached common queries for performance optimization
 * Requirements: 6.1, 6.2, 6.3
 */

import { createClient } from '@/lib/supabase/client';
import { withCache, invalidateCache } from '@/lib/cache-utils';

// Cache TTL constants (in seconds)
const CUSTOMER_LIST_TTL = 600; // 10 minutes (Requirement 6.1)
const EMPLOYEE_LIST_TTL = 600; // 10 minutes (Requirement 6.2)
const DASHBOARD_STATS_TTL = 60; // 1 minute (Requirement 6.3)

// Cache key prefixes
export const CACHE_KEYS = {
  CUSTOMERS: 'customers',
  EMPLOYEES: 'employees',
  DASHBOARD: 'dashboard',
} as const;

/**
 * Customer list item type
 */
export interface CachedCustomer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
}

/**
 * Employee list item type
 */
export interface CachedEmployee {
  id: string;
  employee_code: string;
  full_name: string;
  email: string | null;
  status: string | null;
  department_id: string | null;
  position_id: string | null;
}

/**
 * Dashboard stats type (matches get_dashboard_stats function return)
 */
export interface DashboardStats {
  active_jobs: number;
  revenue_mtd: number;
  profit_mtd: number;
  pending_invoices: number;
  ar_outstanding: number;
}

/**
 * Get cached list of active customers
 * Requirement 6.1: Cache active customer list with 10-minute TTL
 * 
 * @returns Array of active customers
 */
export async function getCachedCustomerList(): Promise<CachedCustomer[]> {
  return withCache(
    `${CACHE_KEYS.CUSTOMERS}-list`,
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, email, phone, is_active')
        .eq('is_active', true)
        .order('name');

      if (error) {
        throw error;
      }

      return data || [];
    },
    CUSTOMER_LIST_TTL
  );
}

/**
 * Get cached list of active employees
 * Requirement 6.2: Cache active employee list with 10-minute TTL
 * 
 * @returns Array of active employees
 */
export async function getCachedEmployeeList(): Promise<CachedEmployee[]> {
  return withCache(
    `${CACHE_KEYS.EMPLOYEES}-list`,
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('employees')
        .select('id, employee_code, full_name, email, status, department_id, position_id')
        .eq('status', 'active')
        .order('full_name');

      if (error) {
        throw error;
      }

      return data || [];
    },
    EMPLOYEE_LIST_TTL
  );
}

/**
 * Get cached dashboard statistics
 * Requirement 6.3: Cache dashboard statistics with 1-minute TTL
 * Uses the get_dashboard_stats database function for optimized single-query fetch
 * 
 * @returns Dashboard statistics object
 */
export async function getCachedDashboardStats(): Promise<DashboardStats> {
  return withCache(
    `${CACHE_KEYS.DASHBOARD}-stats`,
    async () => {
      const supabase = createClient();
      // Use type assertion since get_dashboard_stats is a custom function
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_dashboard_stats');

      if (error) {
        throw error;
      }

      // Handle case where function returns array with single row
      const stats = Array.isArray(data) ? data[0] : data;

      return {
        active_jobs: Number(stats?.active_jobs || 0),
        revenue_mtd: Number(stats?.revenue_mtd || 0),
        profit_mtd: Number(stats?.profit_mtd || 0),
        pending_invoices: Number(stats?.pending_invoices || 0),
        ar_outstanding: Number(stats?.ar_outstanding || 0),
      };
    },
    DASHBOARD_STATS_TTL
  );
}

/**
 * Invalidate customer cache
 * Requirement 6.4: Invalidate when customer is created/updated/deleted
 */
export function invalidateCustomerCache(): number {
  return invalidateCache(`${CACHE_KEYS.CUSTOMERS}-*`);
}

/**
 * Invalidate employee cache
 * Requirement 6.5: Invalidate when employee is created/updated/deleted
 */
export function invalidateEmployeeCache(): number {
  return invalidateCache(`${CACHE_KEYS.EMPLOYEES}-*`);
}

/**
 * Invalidate dashboard stats cache
 * Requirement 6.6: Invalidate when job order or invoice status changes
 */
export function invalidateDashboardCache(): number {
  return invalidateCache(`${CACHE_KEYS.DASHBOARD}-*`);
}

/**
 * Invalidate all caches (useful for testing or manual refresh)
 */
export function invalidateAllCaches(): number {
  return invalidateCache();
}
