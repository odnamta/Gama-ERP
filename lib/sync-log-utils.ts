// =====================================================
// v0.69: SYNC LOG UTILITY FUNCTIONS
// Manages sync operation logging and audit trail
// =====================================================

import {
  type SyncLog,
  type CreateSyncLogInput,
  type UpdateSyncLogInput,
  type SyncLogFilters,
  type SyncStatus,
  type SyncError,
  VALID_SYNC_STATUSES,
} from '@/types/integration';

// =====================================================
// SYNC LOG STATE MACHINE
// =====================================================

/**
 * Valid state transitions for sync logs.
 * running -> completed | failed | partial
 * completed, failed, partial are terminal states
 */
const VALID_STATE_TRANSITIONS: Record<SyncStatus, SyncStatus[]> = {
  running: ['completed', 'failed', 'partial'],
  completed: [], // Terminal state
  failed: [], // Terminal state
  partial: [], // Terminal state
};

/**
 * Checks if a state transition is valid.
 * @param fromStatus - Current status
 * @param toStatus - Target status
 * @returns True if transition is valid
 */
export function isValidStateTransition(
  fromStatus: SyncStatus,
  toStatus: SyncStatus
): boolean {
  const validTargets = VALID_STATE_TRANSITIONS[fromStatus];
  return validTargets.includes(toStatus);
}

/**
 * Checks if a status is a terminal state.
 * @param status - The status to check
 * @returns True if status is terminal
 */
export function isTerminalState(status: SyncStatus): boolean {
  return VALID_STATE_TRANSITIONS[status].length === 0;
}

/**
 * Gets valid next states for a given status.
 * @param status - Current status
 * @returns Array of valid next states
 */
export function getValidNextStates(status: SyncStatus): SyncStatus[] {
  return VALID_STATE_TRANSITIONS[status];
}

// =====================================================
// SYNC LOG CRUD OPERATIONS (Pure Functions)
// =====================================================

/**
 * Validates sync log creation input.
 * @param input - The input to validate
 * @returns Validation result with errors if invalid
 */
export function validateSyncLogInput(
  input: CreateSyncLogInput
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.connection_id || input.connection_id.trim() === '') {
    errors.push('Connection ID is required');
  }

  if (!input.sync_type) {
    errors.push('Sync type is required');
  } else if (!['push', 'pull', 'full_sync'].includes(input.sync_type)) {
    errors.push('Invalid sync type');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Prepares a sync log for database insertion (starting a sync).
 * @param input - The creation input
 * @returns Prepared data or validation errors
 */
export function prepareSyncLogForCreate(
  input: CreateSyncLogInput
): { valid: true; data: Omit<SyncLog, 'id' | 'created_at'> } | { valid: false; errors: string[] } {
  const validation = validateSyncLogInput(input);
  if (!validation.valid) {
    return { valid: false, errors: validation.errors };
  }

  return {
    valid: true,
    data: {
      connection_id: input.connection_id.trim(),
      mapping_id: input.mapping_id || null,
      sync_type: input.sync_type,
      started_at: new Date().toISOString(),
      completed_at: null,
      records_processed: 0,
      records_created: 0,
      records_updated: 0,
      records_failed: 0,
      status: 'running',
      error_details: null,
    },
  };
}

/**
 * Prepares a sync log update for database update.
 * @param input - The update input
 * @param currentStatus - Current status of the sync log
 * @returns Prepared update data or validation errors
 */
export function prepareSyncLogForUpdate(
  input: UpdateSyncLogInput,
  currentStatus: SyncStatus
): { valid: true; data: Record<string, unknown> } | { valid: false; errors: string[] } {
  const errors: string[] = [];

  // Validate status transition if status is being updated
  if (input.status && !isValidStateTransition(currentStatus, input.status)) {
    errors.push(`Invalid status transition from ${currentStatus} to ${input.status}`);
  }

  // Cannot update a terminal state
  if (isTerminalState(currentStatus) && input.status) {
    errors.push(`Cannot update status of a completed sync log (current: ${currentStatus})`);
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const updateData: Record<string, unknown> = {};

  if (input.completed_at !== undefined) {
    updateData.completed_at = input.completed_at;
  }
  if (input.records_processed !== undefined) {
    updateData.records_processed = input.records_processed;
  }
  if (input.records_created !== undefined) {
    updateData.records_created = input.records_created;
  }
  if (input.records_updated !== undefined) {
    updateData.records_updated = input.records_updated;
  }
  if (input.records_failed !== undefined) {
    updateData.records_failed = input.records_failed;
  }
  if (input.status !== undefined) {
    updateData.status = input.status;
  }
  if (input.error_details !== undefined) {
    updateData.error_details = input.error_details;
  }

  return { valid: true, data: updateData };
}

// =====================================================
// SYNC LOG COMPLETION FUNCTIONS
// =====================================================

/**
 * Prepares data to mark a sync as completed successfully.
 * @param stats - Final sync statistics
 * @returns Update data for completion
 */
export function prepareSyncCompletion(stats: {
  records_processed: number;
  records_created: number;
  records_updated: number;
  records_failed: number;
}): UpdateSyncLogInput {
  const status: SyncStatus = stats.records_failed > 0 ? 'partial' : 'completed';
  
  return {
    completed_at: new Date().toISOString(),
    records_processed: stats.records_processed,
    records_created: stats.records_created,
    records_updated: stats.records_updated,
    records_failed: stats.records_failed,
    status,
  };
}

/**
 * Prepares data to mark a sync as failed.
 * @param errorDetails - Array of error details
 * @param partialStats - Optional partial statistics
 * @returns Update data for failure
 */
export function prepareSyncFailure(
  errorDetails: SyncError[],
  partialStats?: {
    records_processed?: number;
    records_created?: number;
    records_updated?: number;
    records_failed?: number;
  }
): UpdateSyncLogInput {
  return {
    completed_at: new Date().toISOString(),
    records_processed: partialStats?.records_processed ?? 0,
    records_created: partialStats?.records_created ?? 0,
    records_updated: partialStats?.records_updated ?? 0,
    records_failed: partialStats?.records_failed ?? 0,
    status: 'failed',
    error_details: errorDetails,
  };
}

/**
 * Prepares data to update sync progress (while running).
 * @param stats - Current progress statistics
 * @returns Update data for progress
 */
export function prepareSyncProgress(stats: {
  records_processed: number;
  records_created: number;
  records_updated: number;
  records_failed: number;
}): UpdateSyncLogInput {
  return {
    records_processed: stats.records_processed,
    records_created: stats.records_created,
    records_updated: stats.records_updated,
    records_failed: stats.records_failed,
  };
}

// =====================================================
// SYNC LOG QUERY HELPERS
// =====================================================

/**
 * Builds filter conditions for sync log queries.
 * @param filters - Filter options
 * @returns Array of filter conditions for query building
 */
export function buildSyncLogFilters(
  filters: SyncLogFilters
): Array<{ field: string; operator: string; value: unknown }> {
  const conditions: Array<{ field: string; operator: string; value: unknown }> = [];

  if (filters.connection_id) {
    conditions.push({ field: 'connection_id', operator: 'eq', value: filters.connection_id });
  }

  if (filters.status) {
    conditions.push({ field: 'status', operator: 'eq', value: filters.status });
  }

  if (filters.from_date) {
    conditions.push({ field: 'started_at', operator: 'gte', value: filters.from_date });
  }

  if (filters.to_date) {
    conditions.push({ field: 'started_at', operator: 'lte', value: filters.to_date });
  }

  return conditions;
}

/**
 * Filters sync logs in memory based on filter criteria.
 * @param logs - Array of sync logs
 * @param filters - Filter options
 * @returns Filtered array of sync logs
 */
export function filterSyncLogs(
  logs: SyncLog[],
  filters: SyncLogFilters
): SyncLog[] {
  return logs.filter(log => {
    if (filters.connection_id && log.connection_id !== filters.connection_id) {
      return false;
    }
    if (filters.status && log.status !== filters.status) {
      return false;
    }
    if (filters.from_date && log.started_at < filters.from_date) {
      return false;
    }
    if (filters.to_date && log.started_at > filters.to_date) {
      return false;
    }
    return true;
  });
}

// =====================================================
// SYNC LOG STATISTICS FUNCTIONS
// =====================================================

/**
 * Calculates aggregate statistics from sync logs.
 * @param logs - Array of sync logs
 * @returns Aggregate statistics
 */
export function calculateSyncStats(logs: SyncLog[]): {
  total_syncs: number;
  successful_syncs: number;
  failed_syncs: number;
  partial_syncs: number;
  total_records_processed: number;
  total_records_created: number;
  total_records_updated: number;
  total_records_failed: number;
  success_rate: number;
} {
  const stats = {
    total_syncs: logs.length,
    successful_syncs: 0,
    failed_syncs: 0,
    partial_syncs: 0,
    total_records_processed: 0,
    total_records_created: 0,
    total_records_updated: 0,
    total_records_failed: 0,
    success_rate: 0,
  };

  for (const log of logs) {
    if (log.status === 'completed') stats.successful_syncs++;
    if (log.status === 'failed') stats.failed_syncs++;
    if (log.status === 'partial') stats.partial_syncs++;
    
    stats.total_records_processed += log.records_processed;
    stats.total_records_created += log.records_created;
    stats.total_records_updated += log.records_updated;
    stats.total_records_failed += log.records_failed;
  }

  stats.success_rate = stats.total_syncs > 0
    ? (stats.successful_syncs / stats.total_syncs) * 100
    : 0;

  return stats;
}

/**
 * Gets the most recent sync log for a connection.
 * @param logs - Array of sync logs
 * @param connectionId - Connection ID to filter by
 * @returns Most recent sync log or null
 */
export function getMostRecentSync(
  logs: SyncLog[],
  connectionId: string
): SyncLog | null {
  const connectionLogs = logs
    .filter(log => log.connection_id === connectionId)
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());

  return connectionLogs[0] || null;
}

/**
 * Gets sync logs that are currently running.
 * @param logs - Array of sync logs
 * @returns Array of running sync logs
 */
export function getRunningsyncs(logs: SyncLog[]): SyncLog[] {
  return logs.filter(log => log.status === 'running');
}

/**
 * Gets sync logs that failed.
 * @param logs - Array of sync logs
 * @returns Array of failed sync logs
 */
export function getFailedSyncs(logs: SyncLog[]): SyncLog[] {
  return logs.filter(log => log.status === 'failed');
}

// =====================================================
// SYNC LOG COMPLETENESS VALIDATION
// =====================================================

/**
 * Validates that a sync log has all required fields for a completed sync.
 * @param log - The sync log to validate
 * @returns Validation result
 */
export function validateSyncLogCompleteness(
  log: SyncLog
): { complete: boolean; missing: string[] } {
  const missing: string[] = [];

  if (!log.id) missing.push('id');
  if (!log.connection_id) missing.push('connection_id');
  if (!log.sync_type) missing.push('sync_type');
  if (!log.started_at) missing.push('started_at');
  if (!VALID_SYNC_STATUSES.includes(log.status)) missing.push('valid status');

  // For terminal states, completed_at should be set
  if (isTerminalState(log.status) && !log.completed_at) {
    missing.push('completed_at (required for terminal state)');
  }

  // Record counts should be non-negative
  if (log.records_processed < 0) missing.push('valid records_processed');
  if (log.records_created < 0) missing.push('valid records_created');
  if (log.records_updated < 0) missing.push('valid records_updated');
  if (log.records_failed < 0) missing.push('valid records_failed');

  return { complete: missing.length === 0, missing };
}

/**
 * Validates record count consistency.
 * records_created + records_updated + records_failed should equal records_processed
 * @param log - The sync log to validate
 * @returns True if counts are consistent
 */
export function validateRecordCountConsistency(log: SyncLog): boolean {
  const sum = log.records_created + log.records_updated + log.records_failed;
  return sum === log.records_processed;
}

/**
 * Calculates sync duration in milliseconds.
 * @param log - The sync log
 * @returns Duration in ms, or null if not completed
 */
export function calculateSyncDuration(log: SyncLog): number | null {
  if (!log.completed_at) return null;
  
  const start = new Date(log.started_at).getTime();
  const end = new Date(log.completed_at).getTime();
  
  return end - start;
}

/**
 * Formats sync duration for display.
 * @param durationMs - Duration in milliseconds
 * @returns Formatted duration string
 */
export function formatSyncDuration(durationMs: number | null): string {
  if (durationMs === null) return 'In progress';
  
  if (durationMs < 1000) return `${durationMs}ms`;
  if (durationMs < 60000) return `${(durationMs / 1000).toFixed(1)}s`;
  if (durationMs < 3600000) return `${(durationMs / 60000).toFixed(1)}m`;
  return `${(durationMs / 3600000).toFixed(1)}h`;
}

// =====================================================
// ERROR HANDLING HELPERS
// =====================================================

/**
 * Creates a sync error object.
 * @param recordId - ID of the record that failed
 * @param errorCode - Error code
 * @param errorMessage - Error message
 * @returns SyncError object
 */
export function createSyncError(
  recordId: string,
  errorCode: string,
  errorMessage: string
): SyncError {
  return {
    record_id: recordId,
    error_code: errorCode,
    error_message: errorMessage,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Groups errors by error code.
 * @param errors - Array of sync errors
 * @returns Map of error_code to array of errors
 */
export function groupErrorsByCode(
  errors: SyncError[]
): Map<string, SyncError[]> {
  const grouped = new Map<string, SyncError[]>();

  for (const error of errors) {
    const existing = grouped.get(error.error_code) || [];
    existing.push(error);
    grouped.set(error.error_code, existing);
  }

  return grouped;
}

/**
 * Gets unique error codes from errors.
 * @param errors - Array of sync errors
 * @returns Array of unique error codes
 */
export function getUniqueErrorCodes(errors: SyncError[]): string[] {
  return [...new Set(errors.map(e => e.error_code))];
}
