/**
 * Integration Types
 * Types for the n8n External Integrations module (v0.69)
 * Supports synchronization with accounting software, GPS tracking, and cloud storage
 */

// =====================================================
// INTEGRATION TYPE ENUMS
// =====================================================

// Integration type enum - supported integration categories
export type IntegrationType = 
  | 'accounting' 
  | 'tracking' 
  | 'email' 
  | 'storage' 
  | 'messaging' 
  | 'custom'

// Valid integration types array for validation
export const VALID_INTEGRATION_TYPES: IntegrationType[] = [
  'accounting',
  'tracking',
  'email',
  'storage',
  'messaging',
  'custom'
]

// Provider enum - supported external service providers
export type Provider = 
  | 'accurate' 
  | 'jurnal' 
  | 'xero' 
  | 'google_sheets' 
  | 'whatsapp' 
  | 'telegram' 
  | 'slack' 
  | 'google_drive' 
  | 'dropbox'

// Valid providers array for validation
export const VALID_PROVIDERS: Provider[] = [
  'accurate',
  'jurnal',
  'xero',
  'google_sheets',
  'whatsapp',
  'telegram',
  'slack',
  'google_drive',
  'dropbox'
]

// Sync direction enum
export type SyncDirection = 'push' | 'pull' | 'bidirectional'

// Valid sync directions array for validation
export const VALID_SYNC_DIRECTIONS: SyncDirection[] = [
  'push',
  'pull',
  'bidirectional'
]

// Sync frequency enum
export type SyncFrequency = 'realtime' | 'hourly' | 'daily' | 'manual'

// Valid sync frequencies array for validation
export const VALID_SYNC_FREQUENCIES: SyncFrequency[] = [
  'realtime',
  'hourly',
  'daily',
  'manual'
]

// Sync status enum
export type SyncStatus = 'running' | 'completed' | 'failed' | 'partial'

// Valid sync statuses array for validation
export const VALID_SYNC_STATUSES: SyncStatus[] = [
  'running',
  'completed',
  'failed',
  'partial'
]

// Transform function types for field mappings
export type TransformFunction = 
  | 'date_format' 
  | 'currency_format' 
  | 'uppercase' 
  | 'lowercase' 
  | 'custom'

// Valid transform functions array for validation
export const VALID_TRANSFORM_FUNCTIONS: TransformFunction[] = [
  'date_format',
  'currency_format',
  'uppercase',
  'lowercase',
  'custom'
]

// Filter operators for sync mapping conditions
export type FilterOperator = 
  | 'eq' 
  | 'neq' 
  | 'gt' 
  | 'lt' 
  | 'gte' 
  | 'lte' 
  | 'in' 
  | 'contains'

// Valid filter operators array for validation
export const VALID_FILTER_OPERATORS: FilterOperator[] = [
  'eq',
  'neq',
  'gt',
  'lt',
  'gte',
  'lte',
  'in',
  'contains'
]


// =====================================================
// INTEGRATION CONNECTION INTERFACES
// =====================================================

// Encrypted credentials storage
export interface EncryptedCredentials {
  api_key?: string
  api_secret?: string
  username?: string
  password?: string
  client_id?: string
  client_secret?: string
  [key: string]: string | undefined
}

// Connection configuration options
export interface ConnectionConfig {
  base_url?: string
  sync_invoices?: boolean
  sync_payments?: boolean
  sync_customers?: boolean
  update_interval?: number
  folder_id?: string
  auto_backup?: boolean
  [key: string]: string | number | boolean | undefined
}

// Integration connection interface
export interface IntegrationConnection {
  id: string
  connection_code: string
  connection_name: string
  integration_type: IntegrationType
  provider: Provider
  credentials: EncryptedCredentials | null
  config: ConnectionConfig
  is_active: boolean
  last_sync_at: string | null
  last_error: string | null
  access_token: string | null
  refresh_token: string | null
  token_expires_at: string | null
  created_by: string | null
  created_at: string
}

// Connection creation input
export interface CreateConnectionInput {
  connection_code: string
  connection_name: string
  integration_type: IntegrationType
  provider: Provider
  credentials?: EncryptedCredentials | null
  config?: ConnectionConfig
  is_active?: boolean
  access_token?: string | null
  refresh_token?: string | null
  token_expires_at?: string | null
}

// Connection update input
export interface UpdateConnectionInput {
  connection_code?: string
  connection_name?: string
  integration_type?: IntegrationType
  provider?: Provider
  credentials?: EncryptedCredentials | null
  config?: ConnectionConfig
  is_active?: boolean
  last_sync_at?: string | null
  last_error?: string | null
  access_token?: string | null
  refresh_token?: string | null
  token_expires_at?: string | null
}

// Connection filter options
export interface ConnectionFilters {
  integration_type?: IntegrationType
  provider?: Provider
  is_active?: boolean
}

// Connection test result
export interface ConnectionTestResult {
  success: boolean
  message: string
  response_time_ms?: number
  error?: string
}

// =====================================================
// SYNC MAPPING INTERFACES
// =====================================================

// Field mapping configuration
export interface FieldMapping {
  local_field: string
  remote_field: string
  transform?: TransformFunction
}

// Filter condition for sync mapping
export interface FilterCondition {
  field: string
  operator: FilterOperator
  value: unknown
}

// Sync mapping interface
export interface SyncMapping {
  id: string
  connection_id: string
  local_table: string
  remote_entity: string
  field_mappings: FieldMapping[]
  sync_direction: SyncDirection
  sync_frequency: SyncFrequency
  filter_conditions: FilterCondition[] | null
  is_active: boolean
  created_at: string
}

// Sync mapping creation input
export interface CreateSyncMappingInput {
  connection_id: string
  local_table: string
  remote_entity: string
  field_mappings: FieldMapping[]
  sync_direction?: SyncDirection
  sync_frequency?: SyncFrequency
  filter_conditions?: FilterCondition[] | null
  is_active?: boolean
}

// Sync mapping update input
export interface UpdateSyncMappingInput {
  local_table?: string
  remote_entity?: string
  field_mappings?: FieldMapping[]
  sync_direction?: SyncDirection
  sync_frequency?: SyncFrequency
  filter_conditions?: FilterCondition[] | null
  is_active?: boolean
}

// =====================================================
// SYNC LOG INTERFACES
// =====================================================

// Sync error details
export interface SyncError {
  record_id: string
  error_code: string
  error_message: string
  timestamp: string
}

// Sync log interface
export interface SyncLog {
  id: string
  connection_id: string
  mapping_id: string | null
  sync_type: 'push' | 'pull' | 'full_sync'
  started_at: string
  completed_at: string | null
  records_processed: number
  records_created: number
  records_updated: number
  records_failed: number
  status: SyncStatus
  error_details: SyncError[] | null
  created_at: string
}

// Sync log creation input
export interface CreateSyncLogInput {
  connection_id: string
  mapping_id?: string | null
  sync_type: 'push' | 'pull' | 'full_sync'
}

// Sync log update input
export interface UpdateSyncLogInput {
  completed_at?: string | null
  records_processed?: number
  records_created?: number
  records_updated?: number
  records_failed?: number
  status?: SyncStatus
  error_details?: SyncError[] | null
}

// Sync log filter options
export interface SyncLogFilters {
  connection_id?: string
  status?: SyncStatus
  from_date?: string
  to_date?: string
}

// =====================================================
// EXTERNAL ID MAPPING INTERFACES
// =====================================================

// External ID mapping interface
export interface ExternalIdMapping {
  id: string
  connection_id: string
  local_table: string
  local_id: string
  external_id: string
  external_data: Record<string, unknown> | null
  synced_at: string
}

// External ID mapping creation input
export interface CreateExternalIdMappingInput {
  connection_id: string
  local_table: string
  local_id: string
  external_id: string
  external_data?: Record<string, unknown> | null
}

// External ID mapping update input
export interface UpdateExternalIdMappingInput {
  external_id?: string
  external_data?: Record<string, unknown> | null
}

// =====================================================
// SYNC RESULT INTERFACES
// =====================================================

// Sync operation result
export interface SyncResult {
  sync_log_id: string
  status: SyncStatus
  records_processed: number
  records_created: number
  records_updated: number
  records_failed: number
  error_details?: SyncError[]
}

// =====================================================
// VALIDATION RESULT INTERFACES
// =====================================================

// Validation result for connection input
export interface ConnectionValidationResult {
  valid: boolean
  errors: string[]
}

// Validation result for sync mapping input
export interface SyncMappingValidationResult {
  valid: boolean
  errors: string[]
}
