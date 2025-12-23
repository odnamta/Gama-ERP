// =====================================================
// v0.63: AI INSIGHTS - NATURAL LANGUAGE QUERIES TYPES
// =====================================================

export type ResponseType = 'text' | 'table' | 'chart' | 'number' | 'error';
export type TemplateCategory = 'financial' | 'sales' | 'operations' | 'hse';

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'area';
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  title?: string;
}

export interface AIQueryResponse {
  responseType: ResponseType;
  responseText: string;
  data?: unknown;
  chartConfig?: ChartConfig;
  suggestions?: string[];
  executionTimeMs?: number;
}

export interface AIQueryHistory {
  id: string;
  user_id: string;
  natural_query: string;
  generated_sql: string | null;
  response_type: ResponseType | null;
  response_data: unknown;
  response_text: string | null;
  was_helpful: boolean | null;
  feedback_notes: string | null;
  execution_time_ms: number | null;
  created_at: string;
}

export interface TemplateParameter {
  name: string;
  type: 'date' | 'string' | 'number';
  extractPattern: string;
}

export interface AIQueryTemplate {
  id: string;
  template_name: string;
  template_category: TemplateCategory;
  sample_questions: string[];
  sql_template: string;
  parameters: TemplateParameter[];
  response_format: ResponseType;
  response_template: string | null;
  is_active: boolean;
  created_at: string;
}

export interface TemplateMatch {
  template: AIQueryTemplate;
  parameters: Record<string, unknown>;
  sql: string;
  similarity: number;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedSQL?: string;
}

export interface QueryHistoryInput {
  user_id: string;
  natural_query: string;
  generated_sql: string | null;
  response_type: ResponseType;
  response_data: unknown;
  response_text: string;
  execution_time_ms: number;
}

// Quick question presets
export const QUICK_QUESTIONS = [
  { label: 'Revenue this month', query: 'What is the revenue this month?' },
  { label: 'Active jobs', query: 'How many jobs are active?' },
  { label: 'Top customers', query: 'Who are our top customers?' },
  { label: 'Overdue invoices', query: 'Show overdue invoices' },
  { label: 'Equipment utilization', query: 'Equipment utilization rate' },
] as const;

// Allowed roles for AI Insights access
export const AI_INSIGHTS_ALLOWED_ROLES = ['owner', 'manager', 'finance'] as const;
export type AIInsightsAllowedRole = typeof AI_INSIGHTS_ALLOWED_ROLES[number];
