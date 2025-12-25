// =====================================================
// v0.70: n8n SCHEDULED TASKS TYPES
// =====================================================

/**
 * Execution status for scheduled tasks
 */
export type ExecutionStatus = 'running' | 'completed' | 'failed' | 'timeout';

/**
 * How a task execution was initiated
 */
export type TriggerType = 'schedule' | 'manual' | 'retry';

/**
 * Scheduled task configuration stored in the registry
 */
export interface ScheduledTask {
  id: string;
  task_code: string;
  task_name: string;
  description: string | null;
  cron_expression: string;
  timezone: string;
  n8n_workflow_id: string | null;
  webhook_url: string | null;
  task_parameters: Record<string, unknown>;
  is_active: boolean;
  last_run_at: string | null;
  last_run_status: ExecutionStatus | null;
  last_run_duration_ms: number | null;
  next_run_at: string | null;
  created_at: string;
}

/**
 * Record of a single task execution
 */
export interface TaskExecution {
  id: string;
  task_id: string;
  started_at: string;
  completed_at: string | null;
  status: ExecutionStatus;
  records_processed: number | null;
  result_summary: Record<string, unknown> | null;
  error_message: string | null;
  execution_time_ms: number | null;
  triggered_by: TriggerType;
  created_at: string;
}

/**
 * Parsed cron expression parts
 */
export interface CronParts {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
}

/**
 * Filters for querying task executions
 */
export interface ExecutionFilters {
  status?: ExecutionStatus;
  triggeredBy?: TriggerType;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

/**
 * Filters for querying scheduled tasks
 */
export interface ScheduledTaskFilters {
  isActive?: boolean;
  taskCode?: string;
}

/**
 * Input for creating a new scheduled task
 */
export interface CreateScheduledTaskInput {
  taskCode: string;
  taskName: string;
  description?: string;
  cronExpression: string;
  timezone?: string;
  n8nWorkflowId?: string;
  webhookUrl?: string;
  taskParameters?: Record<string, unknown>;
  isActive?: boolean;
}

/**
 * Input for updating a scheduled task
 */
export interface UpdateScheduledTaskInput {
  taskName?: string;
  description?: string;
  cronExpression?: string;
  timezone?: string;
  n8nWorkflowId?: string;
  webhookUrl?: string;
  taskParameters?: Record<string, unknown>;
  isActive?: boolean;
}

/**
 * Input for updating task execution
 */
export interface UpdateTaskExecutionInput {
  completedAt?: string;
  status?: ExecutionStatus;
  recordsProcessed?: number;
  resultSummary?: Record<string, unknown>;
  errorMessage?: string;
  executionTimeMs?: number;
}

/**
 * Result of a manual task trigger
 */
export interface ManualTriggerResult {
  executionId: string;
  taskCode: string;
  startedAt: string;
}

/**
 * Valid status transitions for task executions
 */
export const VALID_STATUS_TRANSITIONS: Record<ExecutionStatus, ExecutionStatus[]> = {
  running: ['completed', 'failed', 'timeout'],
  completed: [],
  failed: [],
  timeout: [],
};

/**
 * Default timezone for scheduled tasks
 */
export const DEFAULT_TIMEZONE = 'Asia/Jakarta';

/**
 * Task execution timeout in milliseconds (5 minutes)
 */
export const TASK_TIMEOUT_MS = 5 * 60 * 1000;
