// lib/predictive-analytics-utils.ts
// Utility functions for AI Predictive Analytics

import {
  RiskLevel,
  ContributingFactor,
  RecommendedAction,
  ChurnRiskInput,
  PipelineItem,
  MonthlyRevenue,
  PaymentHistoryItem,
  ModelType,
} from '@/types/predictive-analytics';

// Valid model types
export const VALID_MODEL_TYPES: ModelType[] = [
  'revenue_forecast',
  'churn_risk',
  'payment_prediction',
  'maintenance_prediction',
];

// Valid risk levels for churn
export const VALID_CHURN_RISK_LEVELS: RiskLevel[] = ['low', 'medium', 'high', 'critical'];

// Valid risk levels for payment
export const VALID_PAYMENT_RISK_LEVELS: RiskLevel[] = ['low', 'medium', 'high', 'very_high'];

/**
 * Classify churn risk level based on score
 * - 0-25: low
 * - 26-50: medium
 * - 51-75: high
 * - 76-100: critical
 */
export function classifyChurnRiskLevel(score: number): RiskLevel {
  const clampedScore = Math.max(0, Math.min(100, score));
  if (clampedScore <= 25) return 'low';
  if (clampedScore <= 50) return 'medium';
  if (clampedScore <= 75) return 'high';
  return 'critical';
}

/**
 * Classify payment risk level based on score
 * - 0-25: low
 * - 26-50: medium
 * - 51-75: high
 * - 76-100: very_high
 */
export function classifyPaymentRiskLevel(score: number): RiskLevel {
  const clampedScore = Math.max(0, Math.min(100, score));
  if (clampedScore <= 25) return 'low';
  if (clampedScore <= 50) return 'medium';
  if (clampedScore <= 75) return 'high';
  return 'very_high';
}

/**
 * Get color for risk level display
 */
export function getRiskLevelColor(level: RiskLevel): string {
  switch (level) {
    case 'low':
      return 'text-green-600 bg-green-100';
    case 'medium':
      return 'text-yellow-600 bg-yellow-100';
    case 'high':
      return 'text-orange-600 bg-orange-100';
    case 'critical':
    case 'very_high':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

/**
 * Get emoji indicator for risk level
 */
export function getRiskLevelEmoji(level: RiskLevel): string {
  switch (level) {
    case 'low':
      return '🟢';
    case 'medium':
      return '🟡';
    case 'high':
      return '🟠';
    case 'critical':
    case 'very_high':
      return '🔴';
    default:
      return '⚪';
  }
}


/**
 * Calculate churn risk score based on customer metrics
 * Score ranges from 0 (no risk) to 100 (certain churn)
 */
export function calculateChurnRiskScore(params: ChurnRiskInput): {
  score: number;
  level: RiskLevel;
  factors: ContributingFactor[];
} {
  const { daysSinceLastJob, revenueTrend, engagementScore, paymentBehaviorScore } = params;
  
  const factors: ContributingFactor[] = [];
  let totalScore = 0;
  
  // Days since last job factor (0-30 points)
  // More days = higher risk
  let daysScore = 0;
  if (daysSinceLastJob > 180) {
    daysScore = 30;
    factors.push({
      factor: 'Days since last job',
      impact: 30,
      direction: 'negative',
      description: `No jobs in ${daysSinceLastJob} days`,
    });
  } else if (daysSinceLastJob > 90) {
    daysScore = 20;
    factors.push({
      factor: 'Days since last job',
      impact: 20,
      direction: 'negative',
      description: `No jobs in ${daysSinceLastJob} days`,
    });
  } else if (daysSinceLastJob > 30) {
    daysScore = 10;
    factors.push({
      factor: 'Days since last job',
      impact: 10,
      direction: 'negative',
      description: `No jobs in ${daysSinceLastJob} days`,
    });
  }
  totalScore += daysScore;
  
  // Revenue trend factor (0-25 points)
  let trendScore = 0;
  if (revenueTrend === 'decreasing') {
    trendScore = 25;
    factors.push({
      factor: 'Revenue trend',
      impact: 25,
      direction: 'negative',
      description: 'Revenue is decreasing',
    });
  } else if (revenueTrend === 'stable') {
    trendScore = 5;
  }
  totalScore += trendScore;
  
  // Engagement score factor (0-25 points)
  // Lower engagement = higher risk
  const engagementRisk = Math.max(0, Math.min(100, 100 - engagementScore));
  const engagementPoints = Math.round((engagementRisk / 100) * 25);
  if (engagementPoints > 15) {
    factors.push({
      factor: 'Engagement score',
      impact: engagementPoints,
      direction: 'negative',
      description: `Low engagement score: ${engagementScore}`,
    });
  }
  totalScore += engagementPoints;
  
  // Payment behavior factor (0-20 points)
  // Lower payment score = higher risk
  const paymentRisk = Math.max(0, Math.min(100, 100 - paymentBehaviorScore));
  const paymentPoints = Math.round((paymentRisk / 100) * 20);
  if (paymentPoints > 10) {
    factors.push({
      factor: 'Payment behavior',
      impact: paymentPoints,
      direction: 'negative',
      description: `Poor payment behavior score: ${paymentBehaviorScore}`,
    });
  }
  totalScore += paymentPoints;
  
  // Clamp final score to 0-100
  const finalScore = Math.max(0, Math.min(100, totalScore));
  
  return {
    score: finalScore,
    level: classifyChurnRiskLevel(finalScore),
    factors,
  };
}

/**
 * Calculate confidence level based on data quality
 * Returns a value between 0 and 100
 */
export function calculateConfidenceLevel(params: {
  dataPoints: number;
  dataRecency: number; // days since last data point
  historicalAccuracy: number; // 0-100
}): number {
  const { dataPoints, dataRecency, historicalAccuracy } = params;
  
  // Data points factor (0-40 points)
  // More data = higher confidence
  let dataPointsScore = 0;
  if (dataPoints >= 100) {
    dataPointsScore = 40;
  } else if (dataPoints >= 50) {
    dataPointsScore = 30;
  } else if (dataPoints >= 20) {
    dataPointsScore = 20;
  } else if (dataPoints >= 10) {
    dataPointsScore = 10;
  } else {
    dataPointsScore = Math.max(0, dataPoints);
  }
  
  // Data recency factor (0-30 points)
  // More recent = higher confidence
  let recencyScore = 0;
  if (dataRecency <= 7) {
    recencyScore = 30;
  } else if (dataRecency <= 30) {
    recencyScore = 25;
  } else if (dataRecency <= 90) {
    recencyScore = 15;
  } else if (dataRecency <= 180) {
    recencyScore = 5;
  }
  
  // Historical accuracy factor (0-30 points)
  const accuracyScore = Math.round((Math.max(0, Math.min(100, historicalAccuracy)) / 100) * 30);
  
  const totalScore = dataPointsScore + recencyScore + accuracyScore;
  
  // Clamp to 0-100
  return Math.max(0, Math.min(100, totalScore));
}


/**
 * Calculate revenue forecast with confidence intervals
 */
export function calculateRevenueForecast(params: {
  pipelineData: PipelineItem[];
  historicalRevenue: MonthlyRevenue[];
  targetMonth: Date;
}): {
  predicted_revenue: number;
  confidence_low: number;
  confidence_high: number;
  confidence_level: number;
  pipeline_revenue: number;
  recurring_revenue: number;
  new_business_revenue: number;
} {
  const { pipelineData, historicalRevenue } = params;
  
  // Calculate pipeline revenue (weighted by probability)
  let pipelineRevenue = 0;
  for (const item of pipelineData) {
    pipelineRevenue += item.value * (item.probability / 100);
  }
  
  // Calculate recurring revenue from historical average
  let recurringRevenue = 0;
  if (historicalRevenue.length > 0) {
    const totalHistorical = historicalRevenue.reduce((sum, m) => sum + m.revenue, 0);
    recurringRevenue = totalHistorical / historicalRevenue.length * 0.7; // 70% of average as recurring
  }
  
  // Estimate new business (10% growth assumption)
  const newBusinessRevenue = recurringRevenue * 0.1;
  
  // Total predicted revenue
  const predictedRevenue = pipelineRevenue + recurringRevenue + newBusinessRevenue;
  
  // Calculate confidence based on data quality
  const confidence = calculateConfidenceLevel({
    dataPoints: historicalRevenue.length + pipelineData.length,
    dataRecency: 7, // Assume recent data
    historicalAccuracy: 80, // Default assumption
  });
  
  // Calculate confidence range (wider range = lower confidence)
  const rangeMultiplier = (100 - confidence) / 100 * 0.3 + 0.1; // 10-40% range
  const confidenceLow = predictedRevenue * (1 - rangeMultiplier);
  const confidenceHigh = predictedRevenue * (1 + rangeMultiplier);
  
  return {
    predicted_revenue: Math.round(predictedRevenue),
    confidence_low: Math.round(confidenceLow),
    confidence_high: Math.round(confidenceHigh),
    confidence_level: confidence,
    pipeline_revenue: Math.round(pipelineRevenue),
    recurring_revenue: Math.round(recurringRevenue),
    new_business_revenue: Math.round(newBusinessRevenue),
  };
}

/**
 * Predict payment date based on customer history
 */
export function predictPaymentDate(params: {
  invoiceAmount: number;
  invoiceDueDate: Date;
  customerPaymentHistory: PaymentHistoryItem[];
}): {
  predictedDate: Date;
  confidence: number;
  daysToPayment: number;
} {
  const { invoiceDueDate, customerPaymentHistory } = params;
  
  // Calculate average days to payment from history
  let avgDaysToPayment = 30; // Default assumption
  if (customerPaymentHistory.length > 0) {
    const totalDays = customerPaymentHistory.reduce((sum, h) => sum + h.days_to_payment, 0);
    avgDaysToPayment = Math.round(totalDays / customerPaymentHistory.length);
  }
  
  // Calculate confidence based on history
  const confidence = calculateConfidenceLevel({
    dataPoints: customerPaymentHistory.length,
    dataRecency: 30,
    historicalAccuracy: 75,
  });
  
  // Predicted date is due date + average delay
  const predictedDate = new Date(invoiceDueDate);
  const daysFromDue = Math.max(0, avgDaysToPayment - 30); // Days after due date
  predictedDate.setDate(predictedDate.getDate() + daysFromDue);
  
  return {
    predictedDate,
    confidence,
    daysToPayment: avgDaysToPayment,
  };
}

/**
 * Calculate late payment risk
 */
export function calculateLatePaymentRisk(params: {
  predictedDate: Date;
  dueDate: Date;
  customerPaymentHistory: PaymentHistoryItem[];
}): {
  risk: RiskLevel;
  score: number;
  factors: ContributingFactor[];
} {
  const { predictedDate, dueDate, customerPaymentHistory } = params;
  const factors: ContributingFactor[] = [];
  let score = 0;
  
  // Days late factor (0-40 points)
  const daysLate = Math.max(0, Math.floor((predictedDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
  if (daysLate > 60) {
    score += 40;
    factors.push({
      factor: 'Predicted days late',
      impact: 40,
      direction: 'negative',
      description: `Expected ${daysLate} days late`,
    });
  } else if (daysLate > 30) {
    score += 30;
    factors.push({
      factor: 'Predicted days late',
      impact: 30,
      direction: 'negative',
      description: `Expected ${daysLate} days late`,
    });
  } else if (daysLate > 14) {
    score += 20;
    factors.push({
      factor: 'Predicted days late',
      impact: 20,
      direction: 'negative',
      description: `Expected ${daysLate} days late`,
    });
  } else if (daysLate > 0) {
    score += 10;
    factors.push({
      factor: 'Predicted days late',
      impact: 10,
      direction: 'negative',
      description: `Expected ${daysLate} days late`,
    });
  }
  
  // Historical late payment factor (0-40 points)
  if (customerPaymentHistory.length > 0) {
    const latePayments = customerPaymentHistory.filter(h => h.days_to_payment > 30).length;
    const lateRatio = latePayments / customerPaymentHistory.length;
    const historyScore = Math.round(lateRatio * 40);
    if (historyScore > 0) {
      score += historyScore;
      factors.push({
        factor: 'Payment history',
        impact: historyScore,
        direction: 'negative',
        description: `${Math.round(lateRatio * 100)}% of past payments were late`,
      });
    }
  } else {
    // No history = moderate risk
    score += 20;
    factors.push({
      factor: 'No payment history',
      impact: 20,
      direction: 'negative',
      description: 'New customer with no payment history',
    });
  }
  
  // Clamp score
  const finalScore = Math.max(0, Math.min(100, score));
  
  return {
    risk: classifyPaymentRiskLevel(finalScore),
    score: finalScore,
    factors,
  };
}


/**
 * Generate recommended actions for at-risk customers
 */
export function generateChurnRecommendations(
  riskScore: number,
  factors: ContributingFactor[]
): RecommendedAction[] {
  const recommendations: RecommendedAction[] = [];
  const riskLevel = classifyChurnRiskLevel(riskScore);
  
  // Only generate recommendations for high or critical risk
  if (riskLevel !== 'high' && riskLevel !== 'critical') {
    return recommendations;
  }
  
  // Add recommendations based on factors
  for (const factor of factors) {
    if (factor.factor === 'Days since last job') {
      recommendations.push({
        action: 'Schedule a follow-up call to discuss upcoming projects',
        priority: riskLevel === 'critical' ? 'high' : 'medium',
      });
    }
    if (factor.factor === 'Revenue trend') {
      recommendations.push({
        action: 'Review pricing and offer competitive rates',
        priority: 'high',
      });
    }
    if (factor.factor === 'Engagement score') {
      recommendations.push({
        action: 'Send personalized outreach and service updates',
        priority: 'medium',
      });
    }
    if (factor.factor === 'Payment behavior') {
      recommendations.push({
        action: 'Review payment terms and offer flexible options',
        priority: 'low',
      });
    }
  }
  
  // Always add a general recommendation for high/critical risk
  if (riskLevel === 'critical') {
    recommendations.unshift({
      action: 'Urgent: Schedule executive-level meeting immediately',
      priority: 'high',
    });
  }
  
  // Ensure at least one recommendation for high/critical risk
  if (recommendations.length === 0) {
    recommendations.push({
      action: 'Contact customer to assess relationship status',
      priority: riskLevel === 'critical' ? 'high' : 'medium',
    });
  }
  
  return recommendations;
}

/**
 * Calculate prediction error (absolute difference)
 */
export function calculatePredictionError(predicted: number, actual: number): number {
  return Math.abs(predicted - actual);
}

/**
 * Calculate payment accuracy in days
 */
export function calculatePaymentAccuracyDays(
  predictedDate: Date,
  actualDate: Date
): number {
  // Normalize dates to midnight to avoid time-of-day issues
  const predicted = new Date(predictedDate);
  predicted.setHours(0, 0, 0, 0);
  
  const actual = new Date(actualDate);
  actual.setHours(0, 0, 0, 0);
  
  const diffTime = actual.getTime() - predicted.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format currency for display (Indonesian Rupiah)
 */
export function formatPredictionCurrency(value: number): string {
  if (value >= 1_000_000_000) {
    return `Rp ${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `Rp ${(value / 1_000).toFixed(1)}K`;
  }
  return `Rp ${value.toLocaleString('id-ID')}`;
}

/**
 * Format confidence level for display
 */
export function formatConfidence(level: number): string {
  return `${Math.round(level)}%`;
}

/**
 * Validate model type
 */
export function isValidModelType(type: string): type is ModelType {
  return VALID_MODEL_TYPES.includes(type as ModelType);
}

/**
 * Validate model parameters
 */
export function validateModelParameters(
  modelType: ModelType,
  parameters: Record<string, unknown>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!isValidModelType(modelType)) {
    errors.push(`Invalid model type: ${modelType}. Must be one of: ${VALID_MODEL_TYPES.join(', ')}`);
  }
  
  if (typeof parameters !== 'object' || parameters === null) {
    errors.push('Parameters must be an object');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate contributing factor structure
 */
export function validateContributingFactor(factor: unknown): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (typeof factor !== 'object' || factor === null) {
    errors.push('Factor must be an object');
    return { valid: false, errors };
  }
  
  const f = factor as Record<string, unknown>;
  
  if (typeof f.factor !== 'string' || f.factor.length === 0) {
    errors.push('Factor must have a non-empty string "factor" field');
  }
  
  if (typeof f.impact !== 'number' || f.impact < -100 || f.impact > 100) {
    errors.push('Factor must have an "impact" number between -100 and 100');
  }
  
  if (!['positive', 'negative', 'neutral'].includes(f.direction as string)) {
    errors.push('Factor must have a "direction" of "positive", "negative", or "neutral"');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
