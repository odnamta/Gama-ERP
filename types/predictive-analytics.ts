// types/predictive-analytics.ts
// Type definitions for AI Predictive Analytics

// Model types
export type ModelType = 
  | 'revenue_forecast' 
  | 'churn_risk' 
  | 'payment_prediction' 
  | 'maintenance_prediction';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical' | 'very_high';
export type RevenueTrend = 'increasing' | 'stable' | 'decreasing';

// Prediction Model
export interface PredictionModel {
  id: string;
  model_code: string;
  model_name: string;
  description: string | null;
  model_type: ModelType;
  parameters: Record<string, unknown>;
  last_trained_at: string | null;
  training_data_range: {
    start_date: string;
    end_date: string;
  } | null;
  accuracy_metrics: {
    mean_absolute_error: number;
    accuracy_percentage: number;
    sample_size: number;
  } | null;
  is_active: boolean;
  created_at: string;
}

// Contributing Factor
export interface ContributingFactor {
  factor: string;
  impact: number; // -100 to 100
  direction: 'positive' | 'negative' | 'neutral';
  description?: string;
}

// AI Prediction
export interface AIPrediction {
  id: string;
  model_id: string;
  prediction_type: string;
  prediction_date: string;
  target_date: string | null;
  entity_type: 'company' | 'customer' | 'job' | 'asset' | 'employee' | null;
  entity_id: string | null;
  predicted_value: number | null;
  confidence_level: number; // 0-100
  prediction_range_low: number | null;
  prediction_range_high: number | null;
  risk_level: RiskLevel | null;
  risk_score: number | null; // 0-100
  contributing_factors: ContributingFactor[];
  actual_value: number | null;
  prediction_error: number | null;
  created_at: string;
}


// Revenue Forecast
export interface RevenueForecast {
  id: string;
  forecast_date: string;
  target_month: string;
  predicted_revenue: number;
  confidence_low: number | null;
  confidence_high: number | null;
  confidence_level: number | null;
  pipeline_revenue: number | null;
  recurring_revenue: number | null;
  new_business_revenue: number | null;
  actual_revenue: number | null;
  notes: string | null;
  created_at: string;
}

// Customer Churn Risk
export interface CustomerChurnRisk {
  id: string;
  customer_id: string;
  assessment_date: string;
  churn_risk_score: number; // 0-100
  risk_level: RiskLevel;
  days_since_last_job: number | null;
  revenue_trend: RevenueTrend | null;
  engagement_score: number | null;
  payment_behavior_score: number | null;
  contributing_factors: ContributingFactor[];
  recommended_actions: RecommendedAction[];
  action_taken: string | null;
  action_date: string | null;
  created_at: string;
  // Joined data
  customer?: {
    id: string;
    name: string;
    email: string | null;
  };
}

export interface RecommendedAction {
  action: string;
  priority: 'high' | 'medium' | 'low';
  due_date?: string;
}

// Payment Prediction
export interface PaymentPrediction {
  id: string;
  invoice_id: string;
  prediction_date: string;
  predicted_payment_date: string | null;
  confidence_level: number | null;
  days_to_payment_predicted: number | null;
  late_payment_risk: RiskLevel | null;
  risk_factors: ContributingFactor[];
  actual_payment_date: string | null;
  prediction_accuracy_days: number | null;
  created_at: string;
  // Joined data
  invoice?: {
    id: string;
    invoice_number: string;
    total_amount: number;
    due_date: string;
    customer_name: string;
  };
}

// Dashboard Summary Types
export interface RevenueForecastSummary {
  monthly: {
    target_month: string;
    predicted: number;
    range_low: number;
    range_high: number;
    confidence: number;
  };
  quarterly: {
    quarter: string;
    predicted: number;
    range_low: number;
    range_high: number;
    confidence: number;
  };
  annual: {
    year: number;
    predicted: number;
    range_low: number;
    range_high: number;
    confidence: number;
  };
  breakdown: {
    pipeline_confirmed: number;
    pipeline_probable: number;
    recurring_estimate: number;
    new_business_estimate: number;
  };
}

export interface ChurnRiskSummary {
  total_customers: number;
  at_risk_count: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  total_revenue_at_risk: number;
}

export interface ForecastChartData {
  month: string;
  predicted: number;
  confidence_low: number;
  confidence_high: number;
  actual?: number;
}

// Input types for calculations
export interface ChurnRiskInput {
  daysSinceLastJob: number;
  revenueTrend: RevenueTrend;
  engagementScore: number;
  paymentBehaviorScore: number;
}

export interface PipelineItem {
  id: string;
  value: number;
  probability: number; // 0-100
  expected_close_date: string;
  status: 'confirmed' | 'probable' | 'possible';
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
}

export interface PaymentHistoryItem {
  invoice_id: string;
  invoice_amount: number;
  due_date: string;
  payment_date: string;
  days_to_payment: number;
}
