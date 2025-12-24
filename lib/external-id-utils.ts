// =====================================================
// v0.69: EXTERNAL ID MAPPING UTILITY FUNCTIONS
// Manages mapping between local and external system IDs
// =====================================================

import {
  type ExternalIdMapping,
  type CreateExternalIdMappingInput,
  type UpdateExternalIdMappingInput,
} from '@/types/integration';

// =====================================================
// VALIDATION FUNCTIONS
// =====================================================

/**
 * Validates external ID mapping input for creation.
 * @param input - The input to validate
 * @returns Validation result with errors if invalid
 */
export function validateExternalIdMappingInput(
  input: CreateExternalIdMappingInput
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.connection_id || input.connection_id.trim() === '') {
    errors.push('Connection ID is required');
  }

  if (!input.local_table || input.local_table.trim() === '') {
    errors.push('Local table is required');
  }

  if (!input.local_id || input.local_id.trim() === '') {
    errors.push('Local ID is required');
  }

  if (!input.external_id || input.external_id.trim() === '') {
    errors.push('External ID is required');
  }

  return { valid: errors.length === 0, errors };
}

// =====================================================
// EXTERNAL ID MAPPING CRUD OPERATIONS (Pure Functions)
// =====================================================

/**
 * Prepares an external ID mapping for database insertion.
 * @param input - The creation input
 * @returns Prepared data or validation errors
 */
export function prepareExternalIdMappingForCreate(
  input: CreateExternalIdMappingInput
): { valid: true; data: Omit<ExternalIdMapping, 'id' | 'synced_at'> } | { valid: false; errors: string[] } {
  const validation = validateExternalIdMappingInput(input);
  if (!validation.valid) {
    return { valid: false, errors: validation.errors };
  }

  return {
    valid: true,
    data: {
      connection_id: input.connection_id.trim(),
      local_table: input.local_table.trim(),
      local_id: input.local_id.trim(),
      external_id: input.external_id.trim(),
      external_data: input.external_data || null,
    },
  };
}

/**
 * Prepares an external ID mapping update for database update.
 * @param input - The update input
 * @returns Prepared update data
 */
export function prepareExternalIdMappingForUpdate(
  input: UpdateExternalIdMappingInput
): Record<string, unknown> {
  const updateData: Record<string, unknown> = {};

  if (input.external_id !== undefined) {
    updateData.external_id = input.external_id.trim();
  }

  if (input.external_data !== undefined) {
    updateData.external_data = input.external_data;
  }

  // Always update synced_at on update
  updateData.synced_at = new Date().toISOString();

  return updateData;
}

// =====================================================
// OPERATION DETERMINATION FUNCTIONS
// =====================================================

/**
 * Determines whether a sync operation should create or update a record.
 * @param existingMapping - The existing mapping if found, or null
 * @returns 'create' if no mapping exists, 'update' if mapping exists
 */
export function determineOperation(
  existingMapping: ExternalIdMapping | null
): 'create' | 'update' {
  return existingMapping ? 'update' : 'create';
}

/**
 * Determines the operation for a batch of records.
 * @param localIds - Array of local IDs to check
 * @param existingMappings - Map of local_id to ExternalIdMapping
 * @returns Array of { localId, operation } tuples
 */
export function determineOperationBatch(
  localIds: string[],
  existingMappings: Map<string, ExternalIdMapping>
): Array<{ localId: string; operation: 'create' | 'update'; existingMapping?: ExternalIdMapping }> {
  return localIds.map(localId => {
    const existing = existingMappings.get(localId);
    return {
      localId,
      operation: determineOperation(existing || null),
      existingMapping: existing,
    };
  });
}

// =====================================================
// EXTERNAL ID LOOKUP FUNCTIONS
// =====================================================

/**
 * Gets the external ID for a local record.
 * @param mapping - The external ID mapping
 * @returns The external ID or null if not found
 */
export function getExternalId(mapping: ExternalIdMapping | null): string | null {
  return mapping?.external_id || null;
}

/**
 * Gets the local ID for an external record.
 * @param mapping - The external ID mapping
 * @returns The local ID or null if not found
 */
export function getLocalId(mapping: ExternalIdMapping | null): string | null {
  return mapping?.local_id || null;
}

/**
 * Checks if a mapping exists for a local record.
 * @param mapping - The external ID mapping or null
 * @returns True if mapping exists
 */
export function hasExternalMapping(mapping: ExternalIdMapping | null): boolean {
  return mapping !== null && mapping.external_id !== null && mapping.external_id !== '';
}

/**
 * Checks if a mapping is stale (older than specified hours).
 * @param mapping - The external ID mapping
 * @param maxAgeHours - Maximum age in hours before considered stale
 * @returns True if mapping is stale or doesn't exist
 */
export function isMappingStale(
  mapping: ExternalIdMapping | null,
  maxAgeHours: number
): boolean {
  if (!mapping || !mapping.synced_at) {
    return true;
  }

  const syncedAt = new Date(mapping.synced_at);
  const now = new Date();
  const ageMs = now.getTime() - syncedAt.getTime();
  const ageHours = ageMs / (1000 * 60 * 60);

  return ageHours > maxAgeHours;
}

// =====================================================
// BATCH PROCESSING FUNCTIONS
// =====================================================

/**
 * Groups mappings by local table.
 * @param mappings - Array of external ID mappings
 * @returns Map of local_table to array of mappings
 */
export function groupMappingsByTable(
  mappings: ExternalIdMapping[]
): Map<string, ExternalIdMapping[]> {
  const grouped = new Map<string, ExternalIdMapping[]>();

  for (const mapping of mappings) {
    const existing = grouped.get(mapping.local_table) || [];
    existing.push(mapping);
    grouped.set(mapping.local_table, existing);
  }

  return grouped;
}

/**
 * Creates a lookup map from local_id to ExternalIdMapping.
 * @param mappings - Array of external ID mappings
 * @returns Map of local_id to ExternalIdMapping
 */
export function createMappingLookup(
  mappings: ExternalIdMapping[]
): Map<string, ExternalIdMapping> {
  const lookup = new Map<string, ExternalIdMapping>();

  for (const mapping of mappings) {
    lookup.set(mapping.local_id, mapping);
  }

  return lookup;
}

/**
 * Creates a reverse lookup map from external_id to ExternalIdMapping.
 * @param mappings - Array of external ID mappings
 * @returns Map of external_id to ExternalIdMapping
 */
export function createReverseMappingLookup(
  mappings: ExternalIdMapping[]
): Map<string, ExternalIdMapping> {
  const lookup = new Map<string, ExternalIdMapping>();

  for (const mapping of mappings) {
    lookup.set(mapping.external_id, mapping);
  }

  return lookup;
}

/**
 * Filters mappings to only include those for a specific connection.
 * @param mappings - Array of external ID mappings
 * @param connectionId - The connection ID to filter by
 * @returns Filtered array of mappings
 */
export function filterMappingsByConnection(
  mappings: ExternalIdMapping[],
  connectionId: string
): ExternalIdMapping[] {
  return mappings.filter(m => m.connection_id === connectionId);
}

/**
 * Filters mappings to only include those for a specific table.
 * @param mappings - Array of external ID mappings
 * @param localTable - The local table to filter by
 * @returns Filtered array of mappings
 */
export function filterMappingsByTable(
  mappings: ExternalIdMapping[],
  localTable: string
): ExternalIdMapping[] {
  return mappings.filter(m => m.local_table === localTable);
}

// =====================================================
// SYNC HELPER FUNCTIONS
// =====================================================

/**
 * Extracts external IDs from an array of mappings.
 * @param mappings - Array of external ID mappings
 * @returns Array of external IDs
 */
export function extractExternalIds(mappings: ExternalIdMapping[]): string[] {
  return mappings.map(m => m.external_id);
}

/**
 * Extracts local IDs from an array of mappings.
 * @param mappings - Array of external ID mappings
 * @returns Array of local IDs
 */
export function extractLocalIds(mappings: ExternalIdMapping[]): string[] {
  return mappings.map(m => m.local_id);
}

/**
 * Finds mappings that need to be synced (stale mappings).
 * @param mappings - Array of external ID mappings
 * @param maxAgeHours - Maximum age in hours before considered stale
 * @returns Array of stale mappings
 */
export function findStaleMappings(
  mappings: ExternalIdMapping[],
  maxAgeHours: number
): ExternalIdMapping[] {
  return mappings.filter(m => isMappingStale(m, maxAgeHours));
}

/**
 * Merges external data with existing data.
 * @param existingData - Existing external data or null
 * @param newData - New external data to merge
 * @returns Merged external data
 */
export function mergeExternalData(
  existingData: Record<string, unknown> | null,
  newData: Record<string, unknown>
): Record<string, unknown> {
  return {
    ...(existingData || {}),
    ...newData,
  };
}

/**
 * Validates that a mapping belongs to the expected connection and table.
 * @param mapping - The mapping to validate
 * @param connectionId - Expected connection ID
 * @param localTable - Expected local table
 * @returns True if mapping matches expected values
 */
export function validateMappingOwnership(
  mapping: ExternalIdMapping,
  connectionId: string,
  localTable: string
): boolean {
  return mapping.connection_id === connectionId && mapping.local_table === localTable;
}
