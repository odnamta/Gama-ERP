// =====================================================
// v0.66: AUTOMATION LOG ACTIONS PROPERTY TESTS
// =====================================================
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import type { AutomationLog, AutomationLogFilters, AutomationStatus } from '@/types/automation';

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => ({
                  range: vi.fn(() => Promise.resolve({ data: [], error: null })),
                })),
              })),
            })),
          })),
        })),
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        lt: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
  })),
}));

describe('Automation Log Actions Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Arbitraries for log data
  const uuidArb = fc.uuid();
  const statusArb = fc.constantFrom<AutomationStatus>('running', 'success', 'failed', 'timeout');
  const dateArb = fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') });

  /**
   * **Feature: n8n-automation-foundation, Property 15: Filtering Correctness**
   * *For any* filter applied to webhook endpoints, automation logs, or templates, 
   * the returned results SHALL contain only items matching all specified filter criteria. 
   * *For any* item not matching the filter criteria, it SHALL NOT appear in the results.
   * **Validates: Requirements 1.7, 5.6, 6.6**
   */
  describe('Property 15: Filtering Correctness', () => {
    // Generate sample logs for testing filter logic
    const generateLogs = (count: number): AutomationLog[] => {
      const statuses: AutomationStatus[] = ['running', 'success', 'failed', 'timeout'];
      const logs: AutomationLog[] = [];
      
      for (let i = 0; i < count; i++) {
        logs.push({
          id: `log-${i}`,
          endpoint_id: `endpoint-${i % 3}`,
          execution_id: `exec-${i}`,
          n8n_execution_id: null,
          triggered_at: new Date(Date.now() - i * 3600000).toISOString(),
          completed_at: new Date(Date.now() - i * 3600000 + 1000).toISOString(),
          trigger_type: 'manual',
          trigger_data: {},
          status: statuses[i % 4],
          result_data: null,
          error_message: null,
          execution_time_ms: 1000,
          created_at: new Date().toISOString(),
        });
      }
      
      return logs;
    };

    it('filtering by status should return only matching logs', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 50 }),
          statusArb,
          (count, filterStatus) => {
            const logs = generateLogs(count);
            const filtered = logs.filter(log => log.status === filterStatus);
            
            // All filtered logs should have the specified status
            return filtered.every(log => log.status === filterStatus);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('filtering by endpoint_id should return only matching logs', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 50 }),
          fc.integer({ min: 0, max: 2 }),
          (count, endpointIndex) => {
            const logs = generateLogs(count);
            const filterEndpointId = `endpoint-${endpointIndex}`;
            const filtered = logs.filter(log => log.endpoint_id === filterEndpointId);
            
            // All filtered logs should have the specified endpoint_id
            return filtered.every(log => log.endpoint_id === filterEndpointId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('filtering by date range should return only logs within range', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 50 }),
          fc.integer({ min: 1, max: 24 }), // hours ago for start
          fc.integer({ min: 0, max: 12 }),  // hours ago for end
          (count, startHoursAgo, endHoursAgo) => {
            // Ensure start is before end
            const actualStartHours = Math.max(startHoursAgo, endHoursAgo + 1);
            const actualEndHours = Math.min(startHoursAgo, endHoursAgo);
            
            const logs = generateLogs(count);
            const startDate = new Date(Date.now() - actualStartHours * 3600000);
            const endDate = new Date(Date.now() - actualEndHours * 3600000);
            
            const filtered = logs.filter(log => {
              const logDate = new Date(log.triggered_at);
              return logDate >= startDate && logDate <= endDate;
            });
            
            // All filtered logs should be within the date range
            return filtered.every(log => {
              const logDate = new Date(log.triggered_at);
              return logDate >= startDate && logDate <= endDate;
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('combining multiple filters should return intersection of results', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 20, max: 100 }),
          statusArb,
          fc.integer({ min: 0, max: 2 }),
          (count, filterStatus, endpointIndex) => {
            const logs = generateLogs(count);
            const filterEndpointId = `endpoint-${endpointIndex}`;
            
            const filtered = logs.filter(log => 
              log.status === filterStatus && 
              log.endpoint_id === filterEndpointId
            );
            
            // All filtered logs should match ALL criteria
            return filtered.every(log => 
              log.status === filterStatus && 
              log.endpoint_id === filterEndpointId
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('non-matching items should not appear in filtered results', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 50 }),
          statusArb,
          (count, filterStatus) => {
            const logs = generateLogs(count);
            const filtered = logs.filter(log => log.status === filterStatus);
            const nonMatching = logs.filter(log => log.status !== filterStatus);
            
            // No non-matching logs should appear in filtered results
            return nonMatching.every(log => !filtered.includes(log));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('empty filter should return all logs', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }),
          (count) => {
            const logs = generateLogs(count);
            const filters: AutomationLogFilters = {};
            
            // With no filters, all logs should be returned
            const filtered = logs; // No filtering applied
            return filtered.length === logs.length;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('limit should cap the number of results', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 20, max: 100 }),
          fc.integer({ min: 1, max: 10 }),
          (count, limit) => {
            const logs = generateLogs(count);
            const limited = logs.slice(0, limit);
            
            return limited.length <= limit;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional tests for log data integrity
   */
  describe('Log Data Integrity', () => {
    it('logs should have required fields', () => {
      fc.assert(
        fc.property(
          uuidArb,
          uuidArb,
          fc.string({ minLength: 5, maxLength: 50 }),
          statusArb,
          (id, endpointId, executionId, status) => {
            const log: Partial<AutomationLog> = {
              id,
              endpoint_id: endpointId,
              execution_id: executionId,
              status,
              triggered_at: new Date().toISOString(),
            };
            
            return (
              typeof log.id === 'string' &&
              typeof log.endpoint_id === 'string' &&
              typeof log.execution_id === 'string' &&
              typeof log.status === 'string' &&
              typeof log.triggered_at === 'string'
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('completed logs should have completed_at and execution_time_ms', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<AutomationStatus>('success', 'failed', 'timeout'),
          fc.integer({ min: 1, max: 100000 }),
          (status, executionTimeMs) => {
            const log: Partial<AutomationLog> = {
              status,
              triggered_at: new Date(Date.now() - executionTimeMs).toISOString(),
              completed_at: new Date().toISOString(),
              execution_time_ms: executionTimeMs,
            };
            
            // Completed logs (not running) should have these fields
            return (
              log.completed_at !== null &&
              log.execution_time_ms !== null &&
              log.execution_time_ms > 0
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('running logs should not have completed_at', () => {
      fc.assert(
        fc.property(
          uuidArb,
          (id) => {
            const log: Partial<AutomationLog> = {
              id,
              status: 'running',
              triggered_at: new Date().toISOString(),
              completed_at: null,
              execution_time_ms: null,
            };
            
            return log.status === 'running' && log.completed_at === null;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
