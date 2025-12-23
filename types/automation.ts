// =====================================================
// v0.66: n8n AUTOMATION TYPES
// =====================================================

export type TriggerType = 'database_event' | 'scheduled' | 'manual' | 'external';
export type TriggerEvent = 'INSERT' | 'UPDATE' | 'DELETE';
export type AutomationStatus = 'running' | 'success' | 'failed' | 'timeout';
export type QueueStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'retry';
export type TemplateCategory = 'notification' | 'document' | 'integration' | 'data_sync' | 'reporting';

export interface WebhookEndpoint {
  id: string;
  endpoint_code: string;
  endpoint_name: string;
  description: string | null;
  webhook_url: string | null;
  webhook_secret: string | null;
  n8n_workflow_id: string | null;
  n8n_workflow_name: string | null;
  trigger_type: TriggerType;
  trigger_table: string | null;
  trigger_event: TriggerEvent | null;
  trigger_conditions: Record<string, unknown> | null;
  cron_expression: string | null;
  requires_auth: boolean;
  allowed_ips: string[];
  is_active: boolean;
  last_triggered_at: string | null;
  trigger_count: number;
  created_at: string;
}

export interface AutomationLog {
  id: string;
  endpoint_id: string | null;
  execution_id: string | null;
  n8n_execution_id: string | null;
  triggered_at: string;
  completed_at: string | null;
  trigger_type: string | null;
  trigger_data: Record<string, unknown> | null;
  status: AutomationStatus;
  result_data: Record<string, unknown> | null;
  error_message: string | null;
  execution_time_ms: number | null;
  created_at: string;
}

export interface AutomationTemplate {
  id: string;
  template_code: string;
  template_name: string;
  description: string | null;
  category: TemplateCategory;
  workflow_json: Record<string, unknown> | null;
  required_credentials: string[];
  config_schema: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
}

export interface EventQueueItem {
  id: string;
  event_type: string;
  event_source: string;
  payload: Record<string, unknown>;
  status: QueueStatus;
  retry_count: number;
  max_retries: number;
  scheduled_for: string;
  processed_at: string | null;
  error_message: string | null;
  created_at: string;
}

export interface WebhookPayload {
  event_type: string;
  execution_id: string;
  timestamp: string;
  data: {
    table_name: string;
    operation: TriggerEvent;
    new_data: Record<string, unknown> | null;
    old_data: Record<string, unknown> | null;
  };
}

export interface TriggerConfig {
  type: TriggerType;
  table?: string;
  event?: TriggerEvent;
  conditions?: Record<string, unknown>;
  cronExpression?: string;
}

export interface AutomationStatsResponse {
  totalExecutions: number;
  successRate: number;
  avgExecutionTimeMs: number;
  byEndpoint: Array<{
    endpoint: string;
    endpointId: string;
    count: number;
    successRate: number;
  }>;
  period: {
    days: number;
    startDate: string;
    endDate: string;
  };
}

export interface EndpointMetrics {
  totalTriggers: number;
  successCount: number;
  failureCount: number;
  avgExecutionTime: number;
}

export interface QueueStats {
  pending: number;
  processing: number;
  failed: number;
  completed: number;
  retry: number;
}

// Input types for creating/updating
export interface CreateWebhookEndpointInput {
  endpointCode: string;
  endpointName: string;
  description?: string;
  triggerType: TriggerType;
  triggerTable?: string;
  triggerEvent?: TriggerEvent;
  triggerConditions?: Record<string, unknown>;
  cronExpression?: string;
  n8nWorkflowId?: string;
  n8nWorkflowName?: string;
  requiresAuth?: boolean;
  allowedIps?: string[];
}

export interface UpdateWebhookEndpointInput {
  endpointName?: string;
  description?: string;
  webhookUrl?: string;
  n8nWorkflowId?: string;
  n8nWorkflowName?: string;
  triggerConditions?: Record<string, unknown>;
  cronExpression?: string;
  requiresAuth?: boolean;
  allowedIps?: string[];
  isActive?: boolean;
}

export interface CreateAutomationTemplateInput {
  templateCode: string;
  templateName: string;
  description?: string;
  category: TemplateCategory;
  workflowJson?: Record<string, unknown>;
  requiredCredentials?: string[];
  configSchema?: Record<string, unknown>;
}

export interface AutomationLogFilters {
  endpointId?: string;
  status?: AutomationStatus;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface TemplateFilters {
  category?: TemplateCategory;
  isActive?: boolean;
}

export interface WebhookEndpointFilters {
  triggerType?: TriggerType;
  isActive?: boolean;
  triggerTable?: string;
}
