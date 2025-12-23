// __tests__/predictive-analytics-utils.property.test.ts
// Property-based tests for AI Predictive Analytics utilities

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  classifyChurnRiskLevel,
  classifyPaymentRiskLevel,
  calculateChurnRiskScore,
  calculateConfidenceLevel,
  calculateRevenueForecast,
  calculateLatePaymentRisk,
  generateChurnRecommendations,
  calculatePredictionError,
  calculatePaymentAccuracyDays,
  isValidModelType,
  validateContributingFactor,
  VALID_MODEL_TYPES,
  VALID_CHURN_RISK_LEVELS,
  VALID_PAYMENT_RISK_LEVELS,
} from '@/lib/predictive-analytics-utils';
import { RevenueTrend } from '@/types/predictive-analytics';

describe('Predictive Analytics Utils - Property Tests', () => {
  /**
   * Feature: ai-predictive-analytics, Property 1: Churn Risk Score Bounds
   * For any customer metrics input, the calculated churn_risk_score SHALL be between 0 and 100 inclusive.
   * Validates: Requirements 3.1
   */
  describe('Property 1: Churn Risk Score Bounds', () => {
    it('should always return a score between 0 and 100', () => {
      const revenueTrendArb = fc.constantFrom<RevenueTrend>('increasing', 'stable', 'decreasing');
      
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }), // daysSinceLastJob
          revenueTrendArb,
          fc.integer({ min: 0, max: 100 }), // engagementScore
          fc.integer({ min: 0, max: 100 }), // paymentBehaviorScore
          (daysSinceLastJob, revenueTrend, engagementScore, paymentBehaviorScore) => {
            const result = calculateChurnRiskScore({
              daysSinceLastJob,
              revenueTrend,
              engagementScore,
              paymentBehaviorScore,
            });
            
            expect(result.score).toBeGreaterThanOrEqual(0);
            expect(result.score).toBeLessThanOrEqual(100);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: ai-predictive-analytics, Property 2: Churn Risk Level Classification
   * For any churn risk score, classifyChurnRiskLevel SHALL return the correct level.
   * Validates: Requirements 3.2
   */
  describe('Property 2: Churn Risk Level Classification', () => {
    it('should classify scores 0-25 as low', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 25 }),
          (score) => {
            expect(classifyChurnRiskLevel(score)).toBe('low');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should classify scores 26-50 as medium', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 26, max: 50 }),
          (score) => {
            expect(classifyChurnRiskLevel(score)).toBe('medium');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should classify scores 51-75 as high', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 51, max: 75 }),
          (score) => {
            expect(classifyChurnRiskLevel(score)).toBe('high');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should classify scores 76-100 as critical', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 76, max: 100 }),
          (score) => {
            expect(classifyChurnRiskLevel(score)).toBe('critical');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always return a valid churn risk level', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -100, max: 200 }),
          (score) => {
            const level = classifyChurnRiskLevel(score);
            expect(VALID_CHURN_RISK_LEVELS).toContain(level);
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * Feature: ai-predictive-analytics, Property 3: Prediction Range Consistency
   * For any prediction with confidence bounds, prediction_range_low <= predicted_value <= prediction_range_high.
   * Validates: Requirements 2.1, 5.3
   */
  describe('Property 3: Prediction Range Consistency', () => {
    it('should always have confidence_low <= predicted <= confidence_high', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              value: fc.integer({ min: 0, max: 10_000_000_000 }),
              probability: fc.integer({ min: 0, max: 100 }),
              expected_close_date: fc.constant('2025-06-15T00:00:00.000Z'),
              status: fc.constantFrom('confirmed', 'probable', 'possible') as fc.Arbitrary<'confirmed' | 'probable' | 'possible'>,
            }),
            { minLength: 0, maxLength: 10 }
          ),
          fc.array(
            fc.record({
              month: fc.constantFrom('2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06'),
              revenue: fc.integer({ min: 0, max: 10_000_000_000 }),
            }),
            { minLength: 0, maxLength: 12 }
          ),
          fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }),
          (pipelineData, historicalRevenue, targetMonth) => {
            const result = calculateRevenueForecast({
              pipelineData,
              historicalRevenue,
              targetMonth,
            });
            
            expect(result.confidence_low).toBeLessThanOrEqual(result.predicted_revenue);
            expect(result.predicted_revenue).toBeLessThanOrEqual(result.confidence_high);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: ai-predictive-analytics, Property 4: Confidence Level Bounds
   * For any confidence level calculation, the result SHALL be between 0 and 100 inclusive.
   * Validates: Requirements 2.4
   */
  describe('Property 4: Confidence Level Bounds', () => {
    it('should always return confidence between 0 and 100', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }), // dataPoints
          fc.integer({ min: 0, max: 365 }), // dataRecency
          fc.integer({ min: 0, max: 100 }), // historicalAccuracy
          (dataPoints, dataRecency, historicalAccuracy) => {
            const confidence = calculateConfidenceLevel({
              dataPoints,
              dataRecency,
              historicalAccuracy,
            });
            
            expect(confidence).toBeGreaterThanOrEqual(0);
            expect(confidence).toBeLessThanOrEqual(100);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: ai-predictive-analytics, Property 5: Revenue Forecast Component Sum
   * For any revenue forecast, pipeline + recurring + new_business approximately equals predicted_revenue.
   * Validates: Requirements 2.2
   */
  describe('Property 5: Revenue Forecast Component Sum', () => {
    it('should have component sum approximately equal to predicted revenue', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              value: fc.integer({ min: 0, max: 1_000_000_000 }),
              probability: fc.integer({ min: 0, max: 100 }),
              expected_close_date: fc.constant('2025-06-15T00:00:00.000Z'),
              status: fc.constantFrom('confirmed', 'probable', 'possible') as fc.Arbitrary<'confirmed' | 'probable' | 'possible'>,
            }),
            { minLength: 0, maxLength: 10 }
          ),
          fc.array(
            fc.record({
              month: fc.constantFrom('2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06'),
              revenue: fc.integer({ min: 0, max: 1_000_000_000 }),
            }),
            { minLength: 0, maxLength: 12 }
          ),
          fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }),
          (pipelineData, historicalRevenue, targetMonth) => {
            const result = calculateRevenueForecast({
              pipelineData,
              historicalRevenue,
              targetMonth,
            });
            
            const componentSum = result.pipeline_revenue + result.recurring_revenue + result.new_business_revenue;
            // Allow for rounding differences (within 1% or 1000)
            const tolerance = Math.max(result.predicted_revenue * 0.01, 1000);
            expect(Math.abs(componentSum - result.predicted_revenue)).toBeLessThanOrEqual(tolerance);
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * Feature: ai-predictive-analytics, Property 6: High Risk Generates Recommendations
   * For any churn risk assessment with risk_level 'high' or 'critical', recommended_actions SHALL be non-empty.
   * Validates: Requirements 3.4
   */
  describe('Property 6: High Risk Generates Recommendations', () => {
    it('should generate non-empty recommendations for high risk scores', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 51, max: 75 }), // high risk range
          (score) => {
            const factors = [
              { factor: 'Days since last job', impact: 20, direction: 'negative' as const },
            ];
            const recommendations = generateChurnRecommendations(score, factors);
            expect(recommendations.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate non-empty recommendations for critical risk scores', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 76, max: 100 }), // critical risk range
          (score) => {
            const factors = [
              { factor: 'Revenue trend', impact: 25, direction: 'negative' as const },
            ];
            const recommendations = generateChurnRecommendations(score, factors);
            expect(recommendations.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return empty recommendations for low/medium risk', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 50 }), // low/medium risk range
          (score) => {
            const factors = [
              { factor: 'Days since last job', impact: 10, direction: 'negative' as const },
            ];
            const recommendations = generateChurnRecommendations(score, factors);
            expect(recommendations.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: ai-predictive-analytics, Property 7: Payment Risk Level Validity
   * For any payment prediction, late_payment_risk SHALL be one of: 'low', 'medium', 'high', or 'very_high'.
   * Validates: Requirements 4.3
   */
  describe('Property 7: Payment Risk Level Validity', () => {
    const paymentHistoryArb = fc.array(
      fc.record({
        invoice_id: fc.uuid(),
        invoice_amount: fc.integer({ min: 0, max: 1_000_000_000 }),
        due_date: fc.constant('2025-01-15T00:00:00.000Z'),
        payment_date: fc.constant('2025-02-15T00:00:00.000Z'),
        days_to_payment: fc.integer({ min: 0, max: 365 }),
      }),
      { minLength: 0, maxLength: 10 }
    );

    it('should always return a valid payment risk level', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }),
          fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }),
          paymentHistoryArb,
          (predictedDate, dueDate, history) => {
            const result = calculateLatePaymentRisk({
              predictedDate,
              dueDate,
              customerPaymentHistory: history,
            });
            
            expect(VALID_PAYMENT_RISK_LEVELS).toContain(result.risk);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return score between 0 and 100', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }),
          fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }),
          paymentHistoryArb,
          (predictedDate, dueDate, history) => {
            const result = calculateLatePaymentRisk({
              predictedDate,
              dueDate,
              customerPaymentHistory: history,
            });
            
            expect(result.score).toBeGreaterThanOrEqual(0);
            expect(result.score).toBeLessThanOrEqual(100);
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * Feature: ai-predictive-analytics, Property 8: Prediction Error Calculation
   * For any prediction where both predicted_value and actual_value are set,
   * prediction_error SHALL equal |predicted_value - actual_value|.
   * Validates: Requirements 5.6, 7.1
   */
  describe('Property 8: Prediction Error Calculation', () => {
    it('should calculate error as absolute difference', () => {
      fc.assert(
        fc.property(
          fc.float({ min: -1_000_000_000, max: 1_000_000_000, noNaN: true }),
          fc.float({ min: -1_000_000_000, max: 1_000_000_000, noNaN: true }),
          (predicted, actual) => {
            const error = calculatePredictionError(predicted, actual);
            expect(error).toBe(Math.abs(predicted - actual));
            expect(error).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 0 when predicted equals actual', () => {
      fc.assert(
        fc.property(
          fc.float({ min: -1_000_000_000, max: 1_000_000_000, noNaN: true }),
          (value) => {
            const error = calculatePredictionError(value, value);
            expect(error).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: ai-predictive-analytics, Property 9: Payment Accuracy Days Calculation
   * For any payment prediction where both predicted_payment_date and actual_payment_date are set,
   * prediction_accuracy_days SHALL equal the difference in days between the two dates.
   * Validates: Requirements 4.5
   */
  describe('Property 9: Payment Accuracy Days Calculation', () => {
    it('should calculate days difference correctly', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          (predictedDate, actualDate) => {
            const days = calculatePaymentAccuracyDays(predictedDate, actualDate);
            
            // Normalize dates for comparison
            const predicted = new Date(predictedDate);
            predicted.setHours(0, 0, 0, 0);
            const actual = new Date(actualDate);
            actual.setHours(0, 0, 0, 0);
            
            const expectedDays = Math.round(
              (actual.getTime() - predicted.getTime()) / (1000 * 60 * 60 * 24)
            );
            expect(days).toBe(expectedDays);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 0 when dates are the same day', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          (date) => {
            // Create two dates on the same day
            const date1 = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 10, 0, 0);
            const date2 = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 15, 0, 0);
            const days = calculatePaymentAccuracyDays(date1, date2);
            expect(days).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: ai-predictive-analytics, Property 10: Model Type Validation
   * For any prediction model, model_type SHALL be one of the valid types.
   * Validates: Requirements 1.3
   */
  describe('Property 10: Model Type Validation', () => {
    it('should accept all valid model types', () => {
      for (const modelType of VALID_MODEL_TYPES) {
        expect(isValidModelType(modelType)).toBe(true);
      }
    });

    it('should reject invalid model types', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => !VALID_MODEL_TYPES.includes(s as any)),
          (invalidType) => {
            expect(isValidModelType(invalidType)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: ai-predictive-analytics, Property 11: Contributing Factor Structure
   * For any contributing factor, it SHALL have factor name, impact (-100 to 100), and direction.
   * Validates: Requirements 5.5
   */
  describe('Property 11: Contributing Factor Structure', () => {
    it('should validate correct factor structure', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.integer({ min: -100, max: 100 }),
          fc.constantFrom('positive', 'negative', 'neutral'),
          (factor, impact, direction) => {
            const result = validateContributingFactor({ factor, impact, direction });
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject factors with impact outside -100 to 100', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.oneof(
            fc.integer({ min: -1000, max: -101 }),
            fc.integer({ min: 101, max: 1000 })
          ),
          fc.constantFrom('positive', 'negative', 'neutral'),
          (factor, impact, direction) => {
            const result = validateContributingFactor({ factor, impact, direction });
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject factors with invalid direction', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.integer({ min: -100, max: 100 }),
          fc.string().filter(s => !['positive', 'negative', 'neutral'].includes(s)),
          (factor, impact, direction) => {
            const result = validateContributingFactor({ factor, impact, direction });
            expect(result.valid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
