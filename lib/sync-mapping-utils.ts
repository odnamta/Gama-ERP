// =====================================================
// v0.69: SYNC MAPPING UTILITY FUNCTIONS
// =====================================================

import {
  type SyncMapping,
  type CreateSyncMappingInput,
  type UpdateSyncMappingInput,
  type FieldMapping,
  type FilterCondition,
  type TransformFunction,
  type FilterOperator,
} from '@/types/integration';
import { validateSyncMappingInput } from '@/lib/integration-utils';

// =====================================================
// SYNC MAPPING CRUD OPERATIONS (Pure Functions)
// =====================================================

/**
 * Prepares a sync mapping for database insertion.
 * Returns the prepared data or validation errors.
 */
export function prepareSyncMappingForCreate(
  input: CreateSyncMappingInput
): { valid: true; data: Omit<SyncMapping, 'id' | 'created_at'> } | { valid: false; errors: string[] } {
  const validation = validateSyncMappingInput(input);
  if (!validation.valid) {
    return { valid: false, errors: validation.errors };
  }

  return {
    valid: true,
    data: {
      connection_id: input.connection_id,
      local_table: input.local_table.trim(),
      remote_entity: input.remote_entity.trim(),
      field_mappings: input.field_mappings.map(fm => ({
        local_field: fm.local_field.trim(),
        remote_field: fm.remote_field.trim(),
        ...(fm.transform && { transform: fm.transform }),
      })),
      sync_direction: input.sync_direction || 'push',
      sync_frequency: input.sync_frequency || 'realtime',
      filter_conditions: input.filter_conditions || null,
      is_active: input.is_active ?? true,
    },
  };
}

/**
 * Prepares a sync mapping update for database update.
 * Returns the prepared update data.
 */
export function prepareSyncMappingForUpdate(
  input: UpdateSyncMappingInput
): Record<string, unknown> {
  const updateData: Record<string, unknown> = {};

  if (input.local_table !== undefined) {
    updateData.local_table = input.local_table.trim();
  }
  if (input.remote_entity !== undefined) {
    updateData.remote_entity = input.remote_entity.trim();
  }
  if (input.field_mappings !== undefined) {
    updateData.field_mappings = input.field_mappings.map(fm => ({
      local_field: fm.local_field.trim(),
      remote_field: fm.remote_field.trim(),
      ...(fm.transform && { transform: fm.transform }),
    }));
  }
  if (input.sync_direction !== undefined) {
    updateData.sync_direction = input.sync_direction;
  }
  if (input.sync_frequency !== undefined) {
    updateData.sync_frequency = input.sync_frequency;
  }
  if (input.filter_conditions !== undefined) {
    updateData.filter_conditions = input.filter_conditions;
  }
  if (input.is_active !== undefined) {
    updateData.is_active = input.is_active;
  }

  return updateData;
}

// =====================================================
// FIELD MAPPING TRANSFORMATION FUNCTIONS
// =====================================================

/**
 * Applies a transform function to a value.
 * @param value - The value to transform
 * @param transform - The transform function to apply
 * @returns The transformed value
 */
export function applyTransform(value: unknown, transform: TransformFunction): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  switch (transform) {
    case 'date_format':
      // Convert to ISO date string format (YYYY-MM-DD)
      if (value instanceof Date) {
        return value.toISOString().split('T')[0];
      }
      if (typeof value === 'string') {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }
      return value;

    case 'currency_format':
      // Format as number with 2 decimal places
      if (typeof value === 'number') {
        return Number(value.toFixed(2));
      }
      if (typeof value === 'string') {
        const num = parseFloat(value);
        if (!isNaN(num)) {
          return Number(num.toFixed(2));
        }
      }
      return value;

    case 'uppercase':
      if (typeof value === 'string') {
        return value.toUpperCase();
      }
      return value;

    case 'lowercase':
      if (typeof value === 'string') {
        return value.toLowerCase();
      }
      return value;

    case 'custom':
      // Custom transforms are handled externally
      return value;

    default:
      return value;
  }
}

/**
 * Applies field mappings to transform a source record to target format.
 * @param sourceRecord - The source record to transform
 * @param fieldMappings - Array of field mappings to apply
 * @returns The transformed record with remote field names
 */
export function applyFieldMappings(
  sourceRecord: Record<string, unknown>,
  fieldMappings: FieldMapping[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const mapping of fieldMappings) {
    const localValue = getNestedValue(sourceRecord, mapping.local_field);
    
    let transformedValue = localValue;
    if (mapping.transform) {
      transformedValue = applyTransform(localValue, mapping.transform);
    }

    setNestedValue(result, mapping.remote_field, transformedValue);
  }

  return result;
}

/**
 * Gets a nested value from an object using dot notation.
 * @param obj - The object to get the value from
 * @param path - The dot-notation path (e.g., 'customer.address.city')
 * @returns The value at the path, or undefined if not found
 */
export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/**
 * Sets a nested value in an object using dot notation.
 * @param obj - The object to set the value in
 * @param path - The dot-notation path (e.g., 'customer.address.city')
 * @param value - The value to set
 */
export function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.');
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || typeof current[part] !== 'object' || current[part] === null) {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }

  current[parts[parts.length - 1]] = value;
}

// =====================================================
// FILTER CONDITION EVALUATION FUNCTIONS
// =====================================================

/**
 * Evaluates a single filter condition against a record.
 * @param record - The record to evaluate
 * @param condition - The filter condition to apply
 * @returns True if the record matches the condition
 */
export function evaluateFilterCondition(
  record: Record<string, unknown>,
  condition: FilterCondition
): boolean {
  const fieldValue = getNestedValue(record, condition.field);
  const filterValue = condition.value;

  return evaluateOperator(fieldValue, condition.operator, filterValue);
}

/**
 * Evaluates an operator comparison.
 * @param fieldValue - The value from the record
 * @param operator - The comparison operator
 * @param filterValue - The value to compare against
 * @returns True if the comparison passes
 */
export function evaluateOperator(
  fieldValue: unknown,
  operator: FilterOperator,
  filterValue: unknown
): boolean {
  switch (operator) {
    case 'eq':
      return fieldValue === filterValue;

    case 'neq':
      return fieldValue !== filterValue;

    case 'gt':
      if (typeof fieldValue === 'number' && typeof filterValue === 'number') {
        return fieldValue > filterValue;
      }
      if (typeof fieldValue === 'string' && typeof filterValue === 'string') {
        return fieldValue > filterValue;
      }
      if (fieldValue instanceof Date && filterValue instanceof Date) {
        return fieldValue.getTime() > filterValue.getTime();
      }
      return false;

    case 'lt':
      if (typeof fieldValue === 'number' && typeof filterValue === 'number') {
        return fieldValue < filterValue;
      }
      if (typeof fieldValue === 'string' && typeof filterValue === 'string') {
        return fieldValue < filterValue;
      }
      if (fieldValue instanceof Date && filterValue instanceof Date) {
        return fieldValue.getTime() < filterValue.getTime();
      }
      return false;

    case 'gte':
      if (typeof fieldValue === 'number' && typeof filterValue === 'number') {
        return fieldValue >= filterValue;
      }
      if (typeof fieldValue === 'string' && typeof filterValue === 'string') {
        return fieldValue >= filterValue;
      }
      if (fieldValue instanceof Date && filterValue instanceof Date) {
        return fieldValue.getTime() >= filterValue.getTime();
      }
      return false;

    case 'lte':
      if (typeof fieldValue === 'number' && typeof filterValue === 'number') {
        return fieldValue <= filterValue;
      }
      if (typeof fieldValue === 'string' && typeof filterValue === 'string') {
        return fieldValue <= filterValue;
      }
      if (fieldValue instanceof Date && filterValue instanceof Date) {
        return fieldValue.getTime() <= filterValue.getTime();
      }
      return false;

    case 'in':
      if (Array.isArray(filterValue)) {
        return filterValue.includes(fieldValue);
      }
      return false;

    case 'contains':
      if (typeof fieldValue === 'string' && typeof filterValue === 'string') {
        return fieldValue.toLowerCase().includes(filterValue.toLowerCase());
      }
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(filterValue);
      }
      return false;

    default:
      return false;
  }
}

/**
 * Evaluates all filter conditions against a record.
 * All conditions must pass (AND logic).
 * @param record - The record to evaluate
 * @param conditions - Array of filter conditions
 * @returns True if all conditions pass
 */
export function evaluateFilterConditions(
  record: Record<string, unknown>,
  conditions: FilterCondition[] | null
): boolean {
  // No conditions means all records pass
  if (!conditions || conditions.length === 0) {
    return true;
  }

  // All conditions must pass (AND logic)
  return conditions.every(condition => evaluateFilterCondition(record, condition));
}

/**
 * Filters an array of records based on filter conditions.
 * @param records - Array of records to filter
 * @param conditions - Array of filter conditions
 * @returns Filtered array of records
 */
export function filterRecords(
  records: Record<string, unknown>[],
  conditions: FilterCondition[] | null
): Record<string, unknown>[] {
  if (!conditions || conditions.length === 0) {
    return records;
  }

  return records.filter(record => evaluateFilterConditions(record, conditions));
}

// =====================================================
// SYNC MAPPING HELPER FUNCTIONS
// =====================================================

/**
 * Checks if a sync mapping should be included in sync operations.
 * @param mapping - The sync mapping to check
 * @returns True if the mapping is active and should be synced
 */
export function isMappingActive(mapping: SyncMapping): boolean {
  return mapping.is_active === true;
}

/**
 * Filters sync mappings to only include active ones.
 * @param mappings - Array of sync mappings
 * @returns Array of active sync mappings
 */
export function filterActiveMappings(mappings: SyncMapping[]): SyncMapping[] {
  return mappings.filter(isMappingActive);
}

/**
 * Transforms a batch of records using field mappings.
 * @param records - Array of source records
 * @param fieldMappings - Field mappings to apply
 * @returns Array of transformed records
 */
export function transformRecordBatch(
  records: Record<string, unknown>[],
  fieldMappings: FieldMapping[]
): Record<string, unknown>[] {
  return records.map(record => applyFieldMappings(record, fieldMappings));
}

/**
 * Processes records through a sync mapping (filter + transform).
 * @param records - Array of source records
 * @param mapping - The sync mapping to apply
 * @returns Array of filtered and transformed records
 */
export function processSyncMapping(
  records: Record<string, unknown>[],
  mapping: SyncMapping
): Record<string, unknown>[] {
  // First filter records based on conditions
  const filteredRecords = filterRecords(records, mapping.filter_conditions);
  
  // Then transform the filtered records
  return transformRecordBatch(filteredRecords, mapping.field_mappings);
}
