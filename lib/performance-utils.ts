/**
 * Performance Monitoring Utilities
 * Track slow queries and cache performance metrics
 * Requirements: 9.1, 9.2, 9.3
 */

/**
 * Slow query log entry interface
 * Requirement 9.1: Log queries that take longer than 1 second
 */
export interface SlowQueryLog {
  query: string;
  executionTime: number;
  timestamp: Date;
  table?: string;
  operation?: string;
}

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  slowQueryCount: number;
  averageSlowQueryTime: number;
  slowestQuery: SlowQueryLog | null;
  recentSlowQueries: SlowQueryLog[];
}

// Slow query threshold in milliseconds (1 second)
const SLOW_QUERY_THRESHOLD_MS = 1000;

// Maximum number of slow queries to keep in memory
const MAX_SLOW_QUERY_LOG_SIZE = 100;

// In-memory slow query log
const slowQueryLog: SlowQueryLog[] = [];

/**
 * Get the slow query threshold in milliseconds
 */
export function getSlowQueryThreshold(): number {
  return SLOW_QUERY_THRESHOLD_MS;
}

/**
 * Log a slow query if it exceeds the threshold
 * Requirement 9.1: Log queries that take longer than 1 second
 * Requirement 9.3: Log query text, execution time, and timestamp
 * 
 * @param query - The query text or description
 * @param executionTime - Execution time in milliseconds
 * @param table - Optional table name
 * @param operation - Optional operation type (select, insert, update, delete)
 * @returns True if the query was logged as slow, false otherwise
 */
export function logSlowQuery(
  query: string,
  executionTime: number,
  table?: string,
  operation?: string
): boolean {
  if (executionTime < SLOW_QUERY_THRESHOLD_MS) {
    return false;
  }

  const logEntry: SlowQueryLog = {
    query,
    executionTime,
    timestamp: new Date(),
    table,
    operation,
  };

  slowQueryLog.push(logEntry);

  // Keep log size bounded
  if (slowQueryLog.length > MAX_SLOW_QUERY_LOG_SIZE) {
    slowQueryLog.shift();
  }

  // Log to console for visibility
  console.warn(
    `[SLOW QUERY] ${executionTime}ms - ${table || 'unknown'}.${operation || 'query'}: ${query.substring(0, 100)}...`
  );

  return true;
}

/**
 * Get current performance metrics
 * Requirement 9.3: Provide function to retrieve performance statistics
 * 
 * @returns Performance metrics object
 */
export function getPerformanceMetrics(): PerformanceMetrics {
  if (slowQueryLog.length === 0) {
    return {
      slowQueryCount: 0,
      averageSlowQueryTime: 0,
      slowestQuery: null,
      recentSlowQueries: [],
    };
  }

  const totalTime = slowQueryLog.reduce((sum, log) => sum + log.executionTime, 0);
  const averageTime = totalTime / slowQueryLog.length;

  const slowestQuery = slowQueryLog.reduce(
    (slowest, current) =>
      current.executionTime > (slowest?.executionTime || 0) ? current : slowest,
    slowQueryLog[0]
  );

  // Return most recent 10 slow queries
  const recentSlowQueries = slowQueryLog.slice(-10).reverse();

  return {
    slowQueryCount: slowQueryLog.length,
    averageSlowQueryTime: averageTime,
    slowestQuery,
    recentSlowQueries,
  };
}

/**
 * Clear the slow query log (useful for testing)
 */
export function clearSlowQueryLog(): void {
  slowQueryLog.length = 0;
}

/**
 * Get the raw slow query log (for testing)
 */
export function getSlowQueryLog(): SlowQueryLog[] {
  return [...slowQueryLog];
}

/**
 * Query timing wrapper - wraps an async function and logs if slow
 * Requirement 9.1: Log queries that take longer than 1 second
 * 
 * @param queryDescription - Description of the query for logging
 * @param queryFn - Async function to execute and time
 * @param table - Optional table name
 * @param operation - Optional operation type
 * @returns Result of the query function with timing metadata
 */
export async function withQueryTiming<T>(
  queryDescription: string,
  queryFn: () => Promise<T>,
  table?: string,
  operation?: string
): Promise<{ result: T; executionTime: number; wasSlow: boolean }> {
  const startTime = performance.now();
  
  try {
    const result = await queryFn();
    const executionTime = performance.now() - startTime;
    const wasSlow = logSlowQuery(queryDescription, executionTime, table, operation);
    
    return { result, executionTime, wasSlow };
  } catch (error) {
    const executionTime = performance.now() - startTime;
    logSlowQuery(`[ERROR] ${queryDescription}`, executionTime, table, operation);
    throw error;
  }
}

/**
 * Check if a query time is considered slow
 * 
 * @param executionTime - Execution time in milliseconds
 * @returns True if the query is slow
 */
export function isSlowQuery(executionTime: number): boolean {
  return executionTime >= SLOW_QUERY_THRESHOLD_MS;
}

/**
 * Format execution time for display
 * 
 * @param executionTime - Execution time in milliseconds
 * @returns Formatted string (e.g., "1.23s" or "456ms")
 */
export function formatExecutionTime(executionTime: number): string {
  if (executionTime >= 1000) {
    return `${(executionTime / 1000).toFixed(2)}s`;
  }
  return `${Math.round(executionTime)}ms`;
}
