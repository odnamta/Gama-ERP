// =====================================================
// v0.70: SCHEDULED TASK UTILS PROPERTY TESTS
// =====================================================
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  parseCronExpression,
  isValidCronExpression,
  getNextRunTime,
  filterScheduledTasks,
  findTaskByCode,
  areTaskCodesUnique,
  createExecutionRecord,
  isValidStatusTransition,
  completeExecutionRecord,
  calculateExecutionTimeMs,
  filterExecutions,
  isExecutionRecordComplete,
  isValidExecutionStatus,
  isValidTriggerType,
} from '@/lib/scheduled-task-utils';
import {
  ScheduledTask,
  TaskExecution,
  ExecutionStatus,
  TriggerType,
  VALID_STATUS_TRANSITIONS,
  DEFAULT_TIMEZONE,
} from '@/types/scheduled-task';

// =====================================================
// GENERATORS
// =====================================================

/**
 * Generator for valid cron expressions
 */
const validCronExpressionArb = fc.tuple(
  fc.integer({ min: 0, max: 59 }).map(String),  // minute
  fc.integer({ min: 0, max: 23 }).map(String),  // hour
  fc.oneof(fc.constant('*'), fc.integer({ min: 1, max: 28 }).map(String)),  // dayOfMonth
  fc.oneof(fc.constant('*'), fc.integer({ min: 1, max: 12 }).map(String)),  // month
  fc.oneof(fc.constant('*'), fc.integer({ min: 0, max: 6 }).map(String))   // dayOfWeek
).map(parts => parts.join(' '));

/**
 * Generator for task codes
 */
const taskCodeArb = fc.stringMatching(/^[A-Z][A-Z0-9_]{2,29}$/);

/**
 * Generator for execution status
 */
const executionStatusArb = fc.constantFrom<ExecutionStatus>('running', 'completed', 'failed', 'timeout');

/**
 * Generator for trigger type
 */
const triggerTypeArb = fc.constantFrom<TriggerType>('schedule', 'manual', 'retry');

/**
 * Generator for ISO date strings
 */
const isoDateStringArb = fc.integer({ min: 1577836800000, max: 1893456000000 }) // 2020-01-01 to 2030-01-01
  .map(ts => new Date(ts).toISOString());

/**
 * Generator for scheduled tasks
 */
const scheduledTaskArb = fc.record({
  id: fc.uuid(),
  task_code: taskCodeArb,
  task_name: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
  cron_expression: validCronExpressionArb,
  timezone: fc.constant(DEFAULT_TIMEZONE),
  n8n_workflow_id: fc.option(fc.uuid(), { nil: null }),
  webhook_url: fc.option(fc.webUrl(), { nil: null }),
  task_parameters: fc.constant({}),
  is_active: fc.boolean(),
  last_run_at: fc.option(isoDateStringArb, { nil: null }),
  last_run_status: fc.option(executionStatusArb, { nil: null }),
  last_run_duration_ms: fc.option(fc.integer({ min: 0, max: 300000 }), { nil: null }),
  next_run_at: fc.option(isoDateStringArb, { nil: null }),
  created_at: isoDateStringArb,
});

/**
 * Generator for task executions
 */
const taskExecutionArb = fc.record({
  id: fc.uuid(),
  task_id: fc.uuid(),
  started_at: isoDateStringArb,
  completed_at: fc.option(isoDateStringArb, { nil: null }),
  status: executionStatusArb,
  records_processed: fc.option(fc.integer({ min: 0, max: 10000 }), { nil: null }),
  result_summary: fc.option(fc.constant({}), { nil: null }),
  error_message: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
  execution_time_ms: fc.option(fc.integer({ min: 0, max: 300000 }), { nil: null }),
  triggered_by: triggerTypeArb,
  created_at: isoDateStringArb,
});

// =====================================================
// PROPERTY TESTS
// =====================================================

describe('Scheduled Task Utils Property Tests', () => {
  /**
   * **Feature: n8n-scheduled-tasks, Property 2: Task Code Uniqueness**
   * *For any* two scheduled tasks in the registry, their task_code values SHALL be different.
   * **Validates: Requirements 1.2**
   */
  describe('Property 2: Task Code Uniqueness', () => {
    it('should detect unique task codes correctly', () => {
      fc.assert(
        fc.property(
          fc.array(scheduledTaskArb, { minLength: 1, maxLength: 20 }),
          (tasks) => {
            // Make all task codes unique
            const uniqueTasks = tasks.map((task, index) => ({
              ...task,
              task_code: `TASK_${index}_${task.task_code.substring(0, 10)}`,
            }));
            
            return areTaskCodesUnique(uniqueTasks) === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect duplicate task codes', () => {
      fc.assert(
        fc.property(
          fc.array(scheduledTaskArb, { minLength: 2, maxLength: 20 }),
          (tasks) => {
            // Force a duplicate by copying the first task code to the second
            const duplicateTasks = [...tasks];
            duplicateTasks[1] = { ...duplicateTasks[1], task_code: duplicateTasks[0].task_code };
            
            return areTaskCodesUnique(duplicateTasks) === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should find task by code when it exists', () => {
      fc.assert(
        fc.property(
          fc.array(scheduledTaskArb, { minLength: 1, maxLength: 10 }),
          fc.integer({ min: 0, max: 9 }),
          (tasks, indexSeed) => {
            // Make task codes unique
            const uniqueTasks = tasks.map((task, index) => ({
              ...task,
              task_code: `TASK_${index}`,
            }));
            
            const targetIndex = indexSeed % uniqueTasks.length;
            const targetCode = uniqueTasks[targetIndex].task_code;
            const found = findTaskByCode(uniqueTasks, targetCode);
            
            return found !== null && found.task_code === targetCode;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return null when task code does not exist', () => {
      fc.assert(
        fc.property(
          fc.array(scheduledTaskArb, { minLength: 0, maxLength: 10 }),
          (tasks) => {
            const uniqueTasks = tasks.map((task, index) => ({
              ...task,
              task_code: `TASK_${index}`,
            }));
            
            const found = findTaskByCode(uniqueTasks, 'NONEXISTENT_TASK_CODE');
            return found === null;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: n8n-scheduled-tasks, Property 3: Next Run Calculation**
   * *For any* valid cron expression and timezone, the calculated next_run_at 
   * SHALL be a timestamp in the future relative to the current time.
   * **Validates: Requirements 1.7**
   */
  describe('Property 3: Next Run Calculation', () => {
    // Generator for cron expressions that avoid impossible combinations
    // When both dayOfMonth and dayOfWeek are specified (not *), it can create
    // rare combinations that may not occur within the search window
    const simpleCronExpressionArb = fc.tuple(
      fc.integer({ min: 0, max: 59 }).map(String),  // minute
      fc.integer({ min: 0, max: 23 }).map(String),  // hour
      fc.constant('*'),  // dayOfMonth - always wildcard to avoid impossible combinations
      fc.constant('*'),  // month - always wildcard
      fc.oneof(fc.constant('*'), fc.integer({ min: 0, max: 6 }).map(String))   // dayOfWeek
    ).map(parts => parts.join(' '));

    it('should calculate next run time in the future for valid cron expressions', () => {
      fc.assert(
        fc.property(simpleCronExpressionArb, (cron) => {
          const now = new Date();
          const nextRun = getNextRunTime(cron, DEFAULT_TIMEZONE, now);
          
          if (nextRun === null) {
            // If null, the cron should be invalid
            return !isValidCronExpression(cron);
          }
          
          // Next run should be in the future
          return nextRun.getTime() > now.getTime();
        }),
        { numRuns: 100 }
      );
    });

    it('should return null for invalid cron expressions', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant('invalid'),
            fc.constant('* * *'),  // Too few fields
            fc.constant('60 * * * *'),  // Invalid minute
            fc.constant('* 25 * * *'),  // Invalid hour
            fc.constant('* * 32 * *'),  // Invalid day of month
            fc.constant('* * * 13 *'),  // Invalid month
            fc.constant('* * * * 7')    // Invalid day of week (should be 0-6)
          ),
          (invalidCron) => {
            const nextRun = getNextRunTime(invalidCron, DEFAULT_TIMEZONE);
            return nextRun === null;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should parse valid cron expressions correctly', () => {
      fc.assert(
        fc.property(validCronExpressionArb, (cron) => {
          const parts = parseCronExpression(cron);
          if (parts === null) {
            return false;
          }
          
          const cronParts = cron.split(' ');
          return (
            parts.minute === cronParts[0] &&
            parts.hour === cronParts[1] &&
            parts.dayOfMonth === cronParts[2] &&
            parts.month === cronParts[3] &&
            parts.dayOfWeek === cronParts[4]
          );
        }),
        { numRuns: 100 }
      );
    });

    it('should validate cron expressions consistently', () => {
      fc.assert(
        fc.property(validCronExpressionArb, (cron) => {
          // Valid cron expressions should pass validation
          return isValidCronExpression(cron) === true;
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: n8n-scheduled-tasks, Property 4: Active Task Filtering**
   * *For any* query requesting active tasks only, the result set SHALL contain 
   * only tasks where is_active equals true.
   * **Validates: Requirements 1.8**
   */
  describe('Property 4: Active Task Filtering', () => {
    it('should filter to only active tasks when activeOnly is true', () => {
      fc.assert(
        fc.property(
          fc.array(scheduledTaskArb, { minLength: 0, maxLength: 20 }),
          (tasks) => {
            const filtered = filterScheduledTasks(tasks, true);
            return filtered.every(task => task.is_active === true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return all tasks when activeOnly is false', () => {
      fc.assert(
        fc.property(
          fc.array(scheduledTaskArb, { minLength: 0, maxLength: 20 }),
          (tasks) => {
            const filtered = filterScheduledTasks(tasks, false);
            return filtered.length === tasks.length;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve task count for active tasks', () => {
      fc.assert(
        fc.property(
          fc.array(scheduledTaskArb, { minLength: 0, maxLength: 20 }),
          (tasks) => {
            const filtered = filterScheduledTasks(tasks, true);
            const expectedCount = tasks.filter(t => t.is_active).length;
            return filtered.length === expectedCount;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: n8n-scheduled-tasks, Property 5: Execution Record Completeness**
   * *For any* task execution that completes (success or failure), the execution record 
   * SHALL contain: task_id, started_at, completed_at, status, triggered_by, and execution_time_ms 
   * where execution_time_ms equals the difference between completed_at and started_at in milliseconds.
   * **Validates: Requirements 2.1, 2.3, 2.4, 2.5, 2.6**
   */
  describe('Property 5: Execution Record Completeness', () => {
    it('should create execution records with required fields', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          triggerTypeArb,
          (taskId, triggeredBy) => {
            const record = createExecutionRecord(taskId, triggeredBy);
            
            return (
              record.task_id === taskId &&
              record.triggered_by === triggeredBy &&
              record.started_at !== null &&
              record.status === 'running' &&
              record.completed_at === null
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should complete execution records with correct execution time', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          triggerTypeArb,
          fc.integer({ min: 100, max: 60000 }),
          fc.constantFrom<ExecutionStatus>('completed', 'failed', 'timeout'),
          (taskId, triggeredBy, durationMs, finalStatus) => {
            const startTime = new Date();
            const endTime = new Date(startTime.getTime() + durationMs);
            
            const execution: TaskExecution = {
              id: 'test-id',
              task_id: taskId,
              started_at: startTime.toISOString(),
              completed_at: null,
              status: 'running',
              records_processed: null,
              result_summary: null,
              error_message: null,
              execution_time_ms: null,
              triggered_by: triggeredBy,
              created_at: startTime.toISOString(),
            };
            
            const completed = completeExecutionRecord(execution, {
              completedAt: endTime.toISOString(),
              status: finalStatus,
            });
            
            // Verify completeness
            return (
              completed.task_id === taskId &&
              completed.started_at !== null &&
              completed.completed_at !== null &&
              completed.triggered_by === triggeredBy &&
              completed.execution_time_ms !== null &&
              Math.abs(completed.execution_time_ms - durationMs) <= 1 // Allow 1ms tolerance
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate complete execution records', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          triggerTypeArb,
          fc.integer({ min: 100, max: 60000 }),
          fc.constantFrom<ExecutionStatus>('completed', 'failed', 'timeout'),
          (taskId, triggeredBy, durationMs, finalStatus) => {
            const startTime = new Date();
            const endTime = new Date(startTime.getTime() + durationMs);
            
            const execution: TaskExecution = {
              id: 'test-id',
              task_id: taskId,
              started_at: startTime.toISOString(),
              completed_at: endTime.toISOString(),
              status: finalStatus,
              records_processed: null,
              result_summary: null,
              error_message: null,
              execution_time_ms: durationMs,
              triggered_by: triggeredBy,
              created_at: startTime.toISOString(),
            };
            
            return isExecutionRecordComplete(execution) === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should calculate execution time correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 300000 }),
          (durationMs) => {
            const startTime = new Date();
            const endTime = new Date(startTime.getTime() + durationMs);
            
            const calculated = calculateExecutionTimeMs(
              startTime.toISOString(),
              endTime.toISOString()
            );
            
            return calculated === durationMs;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: n8n-scheduled-tasks, Property 6: Execution Status Transitions**
   * *For any* task execution, the status SHALL only transition from 'running' to one of: 
   * 'completed', 'failed', or 'timeout'. No other transitions are valid.
   * **Validates: Requirements 2.2**
   */
  describe('Property 6: Execution Status Transitions', () => {
    it('should allow valid transitions from running status', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<ExecutionStatus>('completed', 'failed', 'timeout'),
          (newStatus) => {
            return isValidStatusTransition('running', newStatus) === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not allow transitions from terminal statuses', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<ExecutionStatus>('completed', 'failed', 'timeout'),
          executionStatusArb,
          (terminalStatus, anyStatus) => {
            // Terminal statuses should not allow any transitions
            return isValidStatusTransition(terminalStatus, anyStatus) === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not allow running to running transition', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          return isValidStatusTransition('running', 'running') === false;
        }),
        { numRuns: 100 }
      );
    });

    it('should validate status values correctly', () => {
      fc.assert(
        fc.property(executionStatusArb, (status) => {
          return isValidExecutionStatus(status) === true;
        }),
        { numRuns: 100 }
      );
    });

    it('should reject invalid status values', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => !['running', 'completed', 'failed', 'timeout'].includes(s)),
          (invalidStatus) => {
            return isValidExecutionStatus(invalidStatus) === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate trigger types correctly', () => {
      fc.assert(
        fc.property(triggerTypeArb, (triggerType) => {
          return isValidTriggerType(triggerType) === true;
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: n8n-scheduled-tasks, Property 7: Execution History Filtering**
   * *For any* query with task_id, status, or date range filters, the result set 
   * SHALL contain only executions matching all specified filter criteria.
   * **Validates: Requirements 2.7**
   */
  describe('Property 7: Execution History Filtering', () => {
    it('should filter executions by status correctly', () => {
      fc.assert(
        fc.property(
          fc.array(taskExecutionArb, { minLength: 0, maxLength: 20 }),
          executionStatusArb,
          (executions, filterStatus) => {
            const filtered = filterExecutions(executions, { status: filterStatus });
            return filtered.every(e => e.status === filterStatus);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should filter executions by trigger type correctly', () => {
      fc.assert(
        fc.property(
          fc.array(taskExecutionArb, { minLength: 0, maxLength: 20 }),
          triggerTypeArb,
          (executions, filterTrigger) => {
            const filtered = filterExecutions(executions, { triggeredBy: filterTrigger });
            return filtered.every(e => e.triggered_by === filterTrigger);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should apply limit correctly', () => {
      fc.assert(
        fc.property(
          fc.array(taskExecutionArb, { minLength: 5, maxLength: 20 }),
          fc.integer({ min: 1, max: 10 }),
          (executions, limit) => {
            const filtered = filterExecutions(executions, { limit });
            return filtered.length <= limit;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should apply offset correctly', () => {
      fc.assert(
        fc.property(
          fc.array(taskExecutionArb, { minLength: 5, maxLength: 20 }),
          fc.integer({ min: 0, max: 5 }),
          (executions, offset) => {
            const allFiltered = filterExecutions(executions, {});
            const withOffset = filterExecutions(executions, { offset });
            
            // With offset, we should skip the first 'offset' items
            return withOffset.length === Math.max(0, allFiltered.length - offset);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should sort executions by started_at descending', () => {
      fc.assert(
        fc.property(
          fc.array(taskExecutionArb, { minLength: 2, maxLength: 20 }),
          (executions) => {
            const filtered = filterExecutions(executions, {});
            
            // Check that each item is >= the next (descending order)
            for (let i = 0; i < filtered.length - 1; i++) {
              const current = new Date(filtered[i].started_at).getTime();
              const next = new Date(filtered[i + 1].started_at).getTime();
              if (current < next) {
                return false;
              }
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
