// =====================================================
// v0.66: n8n AUTOMATION UTILITY FUNCTIONS
// =====================================================

/**
 * Generates a unique execution ID for tracking webhook executions.
 * Format: exec_{timestamp}_{random}
 * @returns A unique execution ID string
 */
export function generateExecutionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `exec_${timestamp}_${random}`;
}

/**
 * Generates a secure webhook secret token.
 * Uses crypto-safe random generation with 32 bytes of entropy.
 * @returns A secure secret token string (64 hex characters)
 */
export function generateWebhookSecret(): string {
  const array = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Builds the webhook URL for an endpoint code.
 * @param endpointCode - The endpoint code (e.g., 'JO_CREATED')
 * @returns The full webhook URL
 */
export function buildWebhookUrl(endpointCode: string): string {
  const baseUrl = process.env.N8N_WEBHOOK_URL || process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'http://localhost:5678';
  return `${baseUrl}/webhook/${endpointCode.toLowerCase()}`;
}

/**
 * Calculates the retry delay using exponential backoff.
 * Formula: 2^retryCount minutes (in milliseconds)
 * @param retryCount - The current retry attempt number (0-based)
 * @returns Delay in milliseconds
 */
export function calculateRetryDelay(retryCount: number): number {
  // Ensure retryCount is non-negative
  const count = Math.max(0, retryCount);
  // Cap at 10 to prevent extremely long delays (max ~17 hours)
  const cappedCount = Math.min(count, 10);
  // 2^n minutes in milliseconds
  return Math.pow(2, cappedCount) * 60 * 1000;
}

/**
 * Calculates the next scheduled time for a retry.
 * @param retryCount - The current retry attempt number
 * @returns ISO string of the next scheduled time
 */
export function calculateNextRetryTime(retryCount: number): string {
  const delay = calculateRetryDelay(retryCount);
  return new Date(Date.now() + delay).toISOString();
}

/**
 * Validates that a trigger type is valid.
 * @param triggerType - The trigger type to validate
 * @returns True if valid, false otherwise
 */
export function isValidTriggerType(triggerType: string): boolean {
  const validTypes = ['database_event', 'scheduled', 'manual', 'external'];
  return validTypes.includes(triggerType);
}

/**
 * Validates that a trigger event is valid.
 * @param triggerEvent - The trigger event to validate
 * @returns True if valid, false otherwise
 */
export function isValidTriggerEvent(triggerEvent: string): boolean {
  const validEvents = ['INSERT', 'UPDATE', 'DELETE'];
  return validEvents.includes(triggerEvent);
}

/**
 * Validates that a template category is valid.
 * @param category - The category to validate
 * @returns True if valid, false otherwise
 */
export function isValidTemplateCategory(category: string): boolean {
  const validCategories = ['notification', 'document', 'integration', 'data_sync', 'reporting'];
  return validCategories.includes(category);
}

/**
 * Validates that an automation status is valid.
 * @param status - The status to validate
 * @returns True if valid, false otherwise
 */
export function isValidAutomationStatus(status: string): boolean {
  const validStatuses = ['running', 'success', 'failed', 'timeout'];
  return validStatuses.includes(status);
}

/**
 * Validates that a queue status is valid.
 * @param status - The status to validate
 * @returns True if valid, false otherwise
 */
export function isValidQueueStatus(status: string): boolean {
  const validStatuses = ['pending', 'processing', 'completed', 'failed', 'retry'];
  return validStatuses.includes(status);
}

/**
 * Calculates execution time in milliseconds between two timestamps.
 * @param startTime - Start timestamp (ISO string or Date)
 * @param endTime - End timestamp (ISO string or Date)
 * @returns Execution time in milliseconds
 */
export function calculateExecutionTime(startTime: string | Date, endTime: string | Date): number {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  return Math.max(0, end - start);
}

/**
 * Formats execution time for display.
 * @param ms - Execution time in milliseconds
 * @returns Formatted string (e.g., "1.5s", "250ms")
 */
export function formatExecutionTime(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Checks if an endpoint should be triggered based on conditions.
 * @param conditions - The trigger conditions from the endpoint
 * @param data - The data to check against conditions
 * @returns True if conditions are met or no conditions exist
 */
export function checkTriggerConditions(
  conditions: Record<string, unknown> | null,
  data: Record<string, unknown>
): boolean {
  if (!conditions || Object.keys(conditions).length === 0) {
    return true;
  }

  // Simple equality check for each condition
  for (const [key, value] of Object.entries(conditions)) {
    if (data[key] !== value) {
      return false;
    }
  }

  return true;
}
