// =====================================================
// v0.69: EXTERNAL INTEGRATION UTILITY FUNCTIONS
// =====================================================

import {
  IntegrationType,
  Provider,
  SyncDirection,
  SyncFrequency,
  SyncStatus,
  TransformFunction,
  FilterOperator,
  VALID_INTEGRATION_TYPES,
  VALID_PROVIDERS,
  VALID_SYNC_DIRECTIONS,
  VALID_SYNC_FREQUENCIES,
  VALID_SYNC_STATUSES,
  VALID_TRANSFORM_FUNCTIONS,
  VALID_FILTER_OPERATORS,
  FieldMapping,
  FilterCondition,
  CreateConnectionInput,
  CreateSyncMappingInput,
  ConnectionValidationResult,
  SyncMappingValidationResult,
} from '@/types/integration';

// =====================================================
// ENUM VALIDATION FUNCTIONS
// =====================================================

/**
 * Validates that an integration type is valid.
 * @param integrationType - The integration type to validate
 * @returns True if valid, false otherwise
 */
export function validateIntegrationType(integrationType: string): integrationType is IntegrationType {
  return VALID_INTEGRATION_TYPES.includes(integrationType as IntegrationType);
}

/**
 * Validates that a provider is valid.
 * @param provider - The provider to validate
 * @returns True if valid, false otherwise
 */
export function validateProvider(provider: string): provider is Provider {
  return VALID_PROVIDERS.includes(provider as Provider);
}

/**
 * Validates that a sync direction is valid.
 * @param syncDirection - The sync direction to validate
 * @returns True if valid, false otherwise
 */
export function validateSyncDirection(syncDirection: string): syncDirection is SyncDirection {
  return VALID_SYNC_DIRECTIONS.includes(syncDirection as SyncDirection);
}

/**
 * Validates that a sync frequency is valid.
 * @param syncFrequency - The sync frequency to validate
 * @returns True if valid, false otherwise
 */
export function validateSyncFrequency(syncFrequency: string): syncFrequency is SyncFrequency {
  return VALID_SYNC_FREQUENCIES.includes(syncFrequency as SyncFrequency);
}

/**
 * Validates that a sync status is valid.
 * @param syncStatus - The sync status to validate
 * @returns True if valid, false otherwise
 */
export function validateSyncStatus(syncStatus: string): syncStatus is SyncStatus {
  return VALID_SYNC_STATUSES.includes(syncStatus as SyncStatus);
}

/**
 * Validates that a transform function is valid.
 * @param transformFunction - The transform function to validate
 * @returns True if valid, false otherwise
 */
export function validateTransformFunction(transformFunction: string): transformFunction is TransformFunction {
  return VALID_TRANSFORM_FUNCTIONS.includes(transformFunction as TransformFunction);
}

/**
 * Validates that a filter operator is valid.
 * @param filterOperator - The filter operator to validate
 * @returns True if valid, false otherwise
 */
export function validateFilterOperator(filterOperator: string): filterOperator is FilterOperator {
  return VALID_FILTER_OPERATORS.includes(filterOperator as FilterOperator);
}


// =====================================================
// CONNECTION VALIDATION FUNCTIONS
// =====================================================

/**
 * Validates a connection code format.
 * Must be non-empty, alphanumeric with underscores, max 50 chars.
 * @param connectionCode - The connection code to validate
 * @returns True if valid, false otherwise
 */
export function validateConnectionCode(connectionCode: string): boolean {
  if (!connectionCode || connectionCode.trim().length === 0) {
    return false;
  }
  if (connectionCode.length > 50) {
    return false;
  }
  // Allow alphanumeric, underscores, and hyphens
  return /^[a-zA-Z0-9_-]+$/.test(connectionCode);
}

/**
 * Validates a connection name.
 * Must be non-empty, max 100 chars.
 * @param connectionName - The connection name to validate
 * @returns True if valid, false otherwise
 */
export function validateConnectionName(connectionName: string): boolean {
  if (!connectionName || connectionName.trim().length === 0) {
    return false;
  }
  return connectionName.length <= 100;
}

/**
 * Validates a complete connection input.
 * @param input - The connection input to validate
 * @returns Validation result with errors if any
 */
export function validateConnectionInput(input: CreateConnectionInput): ConnectionValidationResult {
  const errors: string[] = [];

  // Validate connection_code
  if (!input.connection_code) {
    errors.push('connection_code is required');
  } else if (!validateConnectionCode(input.connection_code)) {
    errors.push('connection_code must be alphanumeric with underscores/hyphens, max 50 chars');
  }

  // Validate connection_name
  if (!input.connection_name) {
    errors.push('connection_name is required');
  } else if (!validateConnectionName(input.connection_name)) {
    errors.push('connection_name must be non-empty, max 100 chars');
  }

  // Validate integration_type
  if (!input.integration_type) {
    errors.push('integration_type is required');
  } else if (!validateIntegrationType(input.integration_type)) {
    errors.push(`integration_type must be one of: ${VALID_INTEGRATION_TYPES.join(', ')}`);
  }

  // Validate provider
  if (!input.provider) {
    errors.push('provider is required');
  } else if (!validateProvider(input.provider)) {
    errors.push(`provider must be one of: ${VALID_PROVIDERS.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// =====================================================
// SYNC MAPPING VALIDATION FUNCTIONS
// =====================================================

/**
 * Validates a field mapping object.
 * @param fieldMapping - The field mapping to validate
 * @returns True if valid, false otherwise
 */
export function validateFieldMapping(fieldMapping: FieldMapping): boolean {
  if (!fieldMapping.local_field || fieldMapping.local_field.trim().length === 0) {
    return false;
  }
  if (!fieldMapping.remote_field || fieldMapping.remote_field.trim().length === 0) {
    return false;
  }
  if (fieldMapping.transform && !validateTransformFunction(fieldMapping.transform)) {
    return false;
  }
  return true;
}

/**
 * Validates a filter condition object.
 * @param filterCondition - The filter condition to validate
 * @returns True if valid, false otherwise
 */
export function validateFilterCondition(filterCondition: FilterCondition): boolean {
  if (!filterCondition.field || filterCondition.field.trim().length === 0) {
    return false;
  }
  if (!validateFilterOperator(filterCondition.operator)) {
    return false;
  }
  // Value can be any type, including null/undefined for some operators
  return true;
}

/**
 * Validates a complete sync mapping input.
 * @param input - The sync mapping input to validate
 * @returns Validation result with errors if any
 */
export function validateSyncMappingInput(input: CreateSyncMappingInput): SyncMappingValidationResult {
  const errors: string[] = [];

  // Validate connection_id
  if (!input.connection_id) {
    errors.push('connection_id is required');
  }

  // Validate local_table
  if (!input.local_table || input.local_table.trim().length === 0) {
    errors.push('local_table is required');
  }

  // Validate remote_entity
  if (!input.remote_entity || input.remote_entity.trim().length === 0) {
    errors.push('remote_entity is required');
  }

  // Validate field_mappings
  if (!input.field_mappings || !Array.isArray(input.field_mappings)) {
    errors.push('field_mappings is required and must be an array');
  } else if (input.field_mappings.length === 0) {
    errors.push('field_mappings must have at least one mapping');
  } else {
    input.field_mappings.forEach((mapping, index) => {
      if (!validateFieldMapping(mapping)) {
        errors.push(`field_mappings[${index}] is invalid`);
      }
    });
  }

  // Validate sync_direction if provided
  if (input.sync_direction && !validateSyncDirection(input.sync_direction)) {
    errors.push(`sync_direction must be one of: ${VALID_SYNC_DIRECTIONS.join(', ')}`);
  }

  // Validate sync_frequency if provided
  if (input.sync_frequency && !validateSyncFrequency(input.sync_frequency)) {
    errors.push(`sync_frequency must be one of: ${VALID_SYNC_FREQUENCIES.join(', ')}`);
  }

  // Validate filter_conditions if provided
  if (input.filter_conditions && Array.isArray(input.filter_conditions)) {
    input.filter_conditions.forEach((condition, index) => {
      if (!validateFilterCondition(condition)) {
        errors.push(`filter_conditions[${index}] is invalid`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Generates a unique connection code based on provider and timestamp.
 * @param provider - The provider name
 * @returns A unique connection code
 */
export function generateConnectionCode(provider: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `${provider.toUpperCase()}_${timestamp}_${random}`;
}

/**
 * Checks if a connection's OAuth token is expired.
 * @param tokenExpiresAt - The token expiration timestamp
 * @returns True if expired or about to expire (within 5 minutes)
 */
export function isTokenExpired(tokenExpiresAt: string | null): boolean {
  if (!tokenExpiresAt) {
    return true;
  }
  const expiresAt = new Date(tokenExpiresAt).getTime();
  const now = Date.now();
  const bufferMs = 5 * 60 * 1000; // 5 minutes buffer
  return expiresAt <= now + bufferMs;
}

/**
 * Calculates retry delay using exponential backoff.
 * @param retryCount - The current retry attempt (0-based)
 * @param baseDelayMs - Base delay in milliseconds (default: 1000)
 * @param maxDelayMs - Maximum delay in milliseconds (default: 30000)
 * @returns Delay in milliseconds
 */
export function calculateRetryDelay(
  retryCount: number,
  baseDelayMs: number = 1000,
  maxDelayMs: number = 30000
): number {
  const count = Math.max(0, retryCount);
  const delay = baseDelayMs * Math.pow(2, count);
  return Math.min(delay, maxDelayMs);
}

/**
 * Formats a sync status for display.
 * @param status - The sync status
 * @returns Human-readable status string
 */
export function formatSyncStatus(status: SyncStatus): string {
  const statusMap: Record<SyncStatus, string> = {
    running: 'Running',
    completed: 'Completed',
    failed: 'Failed',
    partial: 'Partial Success',
  };
  return statusMap[status] || status;
}

/**
 * Gets the appropriate status color class for a sync status.
 * @param status - The sync status
 * @returns Tailwind color class
 */
export function getSyncStatusColor(status: SyncStatus): string {
  const colorMap: Record<SyncStatus, string> = {
    running: 'text-blue-600 bg-blue-100',
    completed: 'text-green-600 bg-green-100',
    failed: 'text-red-600 bg-red-100',
    partial: 'text-yellow-600 bg-yellow-100',
  };
  return colorMap[status] || 'text-gray-600 bg-gray-100';
}

/**
 * Formats an integration type for display.
 * @param integrationType - The integration type
 * @returns Human-readable type string
 */
export function formatIntegrationType(integrationType: IntegrationType): string {
  const typeMap: Record<IntegrationType, string> = {
    accounting: 'Accounting',
    tracking: 'GPS Tracking',
    email: 'Email',
    storage: 'Cloud Storage',
    messaging: 'Messaging',
    custom: 'Custom',
  };
  return typeMap[integrationType] || integrationType;
}

/**
 * Formats a provider name for display.
 * @param provider - The provider
 * @returns Human-readable provider name
 */
export function formatProvider(provider: Provider): string {
  const providerMap: Record<Provider, string> = {
    accurate: 'Accurate Online',
    jurnal: 'Jurnal.id',
    xero: 'Xero',
    google_sheets: 'Google Sheets',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    slack: 'Slack',
    google_drive: 'Google Drive',
    dropbox: 'Dropbox',
  };
  return providerMap[provider] || provider;
}
