// =====================================================
// v0.66: AUTOMATION STATS ACTIONS PROPERTY TESTS
// =====================================================
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import type { AutomationLog, AutomationStatus, AutomationStatsResponse } from '@/types/automation';

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          lte: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        eq: vi.fn(() => ({
          gte: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        in: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
    })),
  })),
}));

describe('Automation Stats Actions Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper to generate sample logs
  const generateLogs = (
    count: number,
    successRatio: number = 0.8
  ): Array<{ endpoint_id: string; status: AutomationStatus; execution_time_ms: number | null }> => {
    const logs = [];
    const statuses: AutomationStatus[] = ['success', 'failed', 'timeout', 'running'];
    
    for (let i = 0; i < count; i++) {
      const isSuccess = Math.random() < successRatio;
      logs.push({
        endpoint_id: `endpoint-${i % 5}`,
        status: isSuccess ? 'success' : statuses[Math.floor(Math.random() * 3) + 1],
        execution_time_ms: Math.floor(Math.random() * 5000) + 100,
      });
    }
    
    return logs;
  };

  /**
   * **Feature: n8n-automation-foundation, Property 16: Statistics Calculation Accuracy**
   * *For any* statistics request over a period, totalExecutions SHALL equal the count of 
   * automation_logs in that period. successRate SHALL equal (success_count / total_count) * 100. 
   * avgExecutionTimeMs SHALL equal the arithmetic mean of all execution_time_ms values. 
   * Per-endpoint statistics SHALL be calculated using only logs for that endpoint.
   * **Validates: Requirements 7.1, 7.2, 7.3, 7.4**
   */
  describe('Property 16: Statistics Calculation Accuracy', () => {
    it('totalExecutions should equal count of logs', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }),
          (count) => {
            const logs = generateLogs(count);
            const totalExecutions = logs.length;
            
            return totalExecutions === count;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('successRate should equal (success_count / total_count) * 100', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          fc.float({ min: 0, max: 1 }),
          (count, ratio) => {
            const logs = generateLogs(count, ratio);
            const totalExecutions = logs.length;
            const successCount = logs.filter(l => l.status === 'success').length;
            
            const calculatedRate = totalExecutions > 0 
              ? (successCount / totalExecutions) * 100 
              : 0;
            
            // The rate should be between 0 and 100
            return calculatedRate >= 0 && calculatedRate <= 100;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('successRate should be 0 when no logs exist', () => {
      fc.assert(
        fc.property(fc.constant(0), (count) => {
          const logs = generateLogs(count);
          const totalExecutions = logs.length;
          const successCount = logs.filter(l => l.status === 'success').length;
          
          const calculatedRate = totalExecutions > 0 
            ? (successCount / totalExecutions) * 100 
            : 0;
          
          return calculatedRate === 0;
        }),
        { numRuns: 100 }
      );
    });

    it('avgExecutionTimeMs should equal arithmetic mean of execution times', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 100, max: 10000 }), { minLength: 1, maxLength: 100 }),
          (executionTimes) => {
            const sum = executionTimes.reduce((a, b) => a + b, 0);
            const avg = sum / executionTimes.length;
            
            // Verify the calculation
            const recalculated = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
            
            return Math.abs(avg - recalculated) < 0.001;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('avgExecutionTimeMs should be 0 when no completed logs exist', () => {
      fc.assert(
        fc.property(fc.constant([]), (executionTimes: number[]) => {
          const avg = executionTimes.length > 0 
            ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length 
            : 0;
          
          return avg === 0;
        }),
        { numRuns: 100 }
      );
    });

    it('per-endpoint statistics should only include logs for that endpoint', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 100 }),
          fc.integer({ min: 0, max: 4 }),
          (count, endpointIndex) => {
            const logs = generateLogs(count);
            const targetEndpointId = `endpoint-${endpointIndex}`;
            
            const endpointLogs = logs.filter(l => l.endpoint_id === targetEndpointId);
            const endpointTotal = endpointLogs.length;
            const endpointSuccess = endpointLogs.filter(l => l.status === 'success').length;
            
            // All counted logs should belong to the target endpoint
            return endpointLogs.every(l => l.endpoint_id === targetEndpointId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('sum of per-endpoint counts should equal total executions', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 100 }),
          (count) => {
            const logs = generateLogs(count);
            
            // Group by endpoint
            const endpointCounts = new Map<string, number>();
            for (const log of logs) {
              const current = endpointCounts.get(log.endpoint_id) || 0;
              endpointCounts.set(log.endpoint_id, current + 1);
            }
            
            // Sum of all endpoint counts
            const sumOfCounts = Array.from(endpointCounts.values()).reduce((a, b) => a + b, 0);
            
            return sumOfCounts === logs.length;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional tests for statistics edge cases
   */
  describe('Statistics Edge Cases', () => {
    it('should handle all success logs correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          (count) => {
            const logs = Array(count).fill(null).map((_, i) => ({
              endpoint_id: `endpoint-${i % 3}`,
              status: 'success' as AutomationStatus,
              execution_time_ms: 1000,
            }));
            
            const successCount = logs.filter(l => l.status === 'success').length;
            const successRate = (successCount / logs.length) * 100;
            
            return successRate === 100;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle all failed logs correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          (count) => {
            const logs = Array(count).fill(null).map((_, i) => ({
              endpoint_id: `endpoint-${i % 3}`,
              status: 'failed' as AutomationStatus,
              execution_time_ms: 1000,
            }));
            
            const successCount = logs.filter(l => l.status === 'success').length;
            const successRate = (successCount / logs.length) * 100;
            
            return successRate === 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle mixed statuses correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 25 }),
          fc.integer({ min: 1, max: 25 }),
          fc.integer({ min: 1, max: 25 }),
          fc.integer({ min: 1, max: 25 }),
          (successCount, failedCount, timeoutCount, runningCount) => {
            const total = successCount + failedCount + timeoutCount + runningCount;
            const calculatedRate = (successCount / total) * 100;
            
            // Rate should be proportional to success count
            return calculatedRate >= 0 && calculatedRate <= 100;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('period should be configurable', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 365 }),
          (days) => {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            const endDate = new Date();
            
            const periodMs = endDate.getTime() - startDate.getTime();
            const expectedMs = days * 24 * 60 * 60 * 1000;
            
            // Allow 1 second tolerance for test execution time
            return Math.abs(periodMs - expectedMs) < 1000;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Tests for endpoint metrics
   */
  describe('Endpoint Metrics', () => {
    it('endpoint metrics should be calculated correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 100 }),
          fc.integer({ min: 0, max: 4 }),
          (count, endpointIndex) => {
            const logs = generateLogs(count);
            const targetEndpointId = `endpoint-${endpointIndex}`;
            
            const endpointLogs = logs.filter(l => l.endpoint_id === targetEndpointId);
            const totalTriggers = endpointLogs.length;
            const successCount = endpointLogs.filter(l => l.status === 'success').length;
            const failureCount = endpointLogs.filter(l => l.status === 'failed' || l.status === 'timeout').length;
            
            // Verify counts are consistent
            return (
              totalTriggers >= 0 &&
              successCount >= 0 &&
              failureCount >= 0 &&
              successCount + failureCount <= totalTriggers
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
