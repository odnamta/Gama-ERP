# Implementation Plan: AI Predictive Analytics

## Overview

This implementation plan covers the development of AI-powered predictive analytics for the Gama ERP system, including revenue forecasting, customer churn risk assessment, payment prediction, and a unified dashboard interface.

## Tasks

- [x] 1. Set up database schema and types
  - [x] 1.1 Create database migration for prediction tables
    - Create prediction_models, ai_predictions, revenue_forecast, customer_churn_risk, and payment_predictions tables
    - Add indexes for performance optimization
    - Insert default prediction models
    - _Requirements: 1.1, 1.2, 5.1, 5.2_

  - [x] 1.2 Create TypeScript type definitions
    - Create types/predictive-analytics.ts with all interfaces
    - Define ModelType, RiskLevel, RevenueTrend enums
    - Define PredictionModel, AIPrediction, RevenueForecast, CustomerChurnRisk, PaymentPrediction interfaces
    - _Requirements: 1.1, 5.1_

- [x] 2. Implement core utility functions
  - [x] 2.1 Implement risk classification utilities
    - Create lib/predictive-analytics-utils.ts
    - Implement classifyRiskLevel function for churn risk (0-25 low, 26-50 medium, 51-75 high, 76-100 critical)
    - Implement classifyPaymentRisk function for payment risk levels
    - Implement getRiskLevelColor for UI display
    - _Requirements: 3.2, 4.3_

  - [x] 2.2 Write property test for risk level classification
    - **Property 2: Churn Risk Level Classification**
    - **Validates: Requirements 3.2**

  - [x] 2.3 Implement churn risk score calculation
    - Implement calculateChurnRiskScore function
    - Calculate score based on days_since_last_job, revenue_trend, engagement_score, payment_behavior_score
    - Ensure score is clamped to 0-100 range
    - Generate contributing factors array
    - _Requirements: 3.1, 3.3_

  - [x] 2.4 Write property test for churn risk score bounds
    - **Property 1: Churn Risk Score Bounds**
    - **Validates: Requirements 3.1**

  - [x] 2.5 Implement confidence level calculation
    - Implement calculateConfidenceLevel function
    - Calculate based on data points, data recency, and historical accuracy
    - Ensure result is clamped to 0-100 range
    - _Requirements: 2.4_

  - [x] 2.6 Write property test for confidence level bounds
    - **Property 4: Confidence Level Bounds**
    - **Validates: Requirements 2.4**

  - [x] 2.7 Implement revenue forecast calculation
    - Implement calculateRevenueForecast function
    - Calculate predicted_revenue with confidence_low and confidence_high bounds
    - Break down into pipeline_revenue, recurring_revenue, new_business_revenue
    - Ensure range consistency (low <= predicted <= high)
    - _Requirements: 2.1, 2.2_

  - [x] 2.8 Write property tests for revenue forecast
    - **Property 3: Prediction Range Consistency**
    - **Property 5: Revenue Forecast Component Sum**
    - **Validates: Requirements 2.1, 2.2, 5.3**

  - [x] 2.9 Implement payment prediction calculation
    - Implement predictPaymentDate function
    - Calculate predicted date based on customer payment history
    - Implement calculateLatePaymentRisk function
    - Generate risk factors array
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 2.10 Write property test for payment risk level validity
    - **Property 7: Payment Risk Level Validity**
    - **Validates: Requirements 4.3**

  - [x] 2.11 Implement recommendation generation
    - Implement generateChurnRecommendations function
    - Generate non-empty recommendations for high/critical risk customers
    - _Requirements: 3.4_

  - [x] 2.12 Write property test for high risk recommendations
    - **Property 6: High Risk Generates Recommendations**
    - **Validates: Requirements 3.4**

  - [x] 2.13 Implement error and accuracy calculations
    - Implement calculatePredictionError function (|predicted - actual|)
    - Implement calculatePaymentAccuracyDays function
    - _Requirements: 4.5, 5.6, 7.1_

  - [x] 2.14 Write property tests for error calculations
    - **Property 8: Prediction Error Calculation**
    - **Property 9: Payment Accuracy Days Calculation**
    - **Validates: Requirements 4.5, 5.6, 7.1**

  - [x] 2.15 Implement validation utilities
    - Implement validateModelParameters function
    - Implement validateContributingFactor function
    - _Requirements: 1.3, 5.5_

  - [x] 2.16 Write property tests for validation
    - **Property 10: Model Type Validation**
    - **Property 11: Contributing Factor Structure**
    - **Validates: Requirements 1.3, 5.5**

- [x] 3. Checkpoint - Ensure all utility tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement server actions
  - [x] 4.1 Create prediction actions file
    - Create lib/predictive-analytics-actions.ts
    - Set up Supabase client imports
    - _Requirements: 1.1_

  - [x] 4.2 Implement revenue forecast actions
    - Implement generateRevenueForecast action
    - Implement getRevenueForecastSummary action
    - Implement getForecastChartData action
    - _Requirements: 2.1, 2.3, 2.6_

  - [x] 4.3 Implement churn risk actions
    - Implement assessCustomerChurnRisk action
    - Implement getCustomersAtRisk action with sorting by risk score
    - Implement getChurnRiskSummary action
    - Implement recordChurnAction action
    - _Requirements: 3.1, 3.5, 3.6_

  - [x] 4.4 Write property test for churn risk sorting
    - **Property 12: Churn Risk Data Sorted by Score**
    - **Validates: Requirements 3.6**

  - [x] 4.5 Implement payment prediction actions
    - Implement generatePaymentPrediction action
    - Implement getPaymentPredictions action
    - _Requirements: 4.1, 4.6_

  - [x] 4.6 Implement prediction update actions
    - Implement updatePredictionActual action
    - Implement updateForecastActual action
    - Implement updatePaymentActual action
    - _Requirements: 2.5, 4.5, 5.6_

- [x] 5. Checkpoint - Ensure all action tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement UI components
  - [x] 6.1 Create shared UI components
    - Create components/predictive-analytics/risk-badge.tsx
    - Create components/predictive-analytics/confidence-indicator.tsx
    - Create components/predictive-analytics/trend-indicator.tsx
    - _Requirements: 3.2, 4.3_

  - [x] 6.2 Create forecast chart component
    - Create components/predictive-analytics/forecast-chart.tsx
    - Display 6-month forecast with confidence bands
    - Show historical comparison line
    - _Requirements: 2.6_

  - [x] 6.3 Create forecast summary cards
    - Create components/predictive-analytics/forecast-summary-cards.tsx
    - Display monthly, quarterly, and annual forecast cards
    - Show confidence levels and ranges
    - _Requirements: 2.3, 6.3_

  - [x] 6.4 Create revenue forecast tab
    - Create components/predictive-analytics/revenue-forecast-tab.tsx
    - Integrate forecast chart and summary cards
    - Display forecast breakdown
    - _Requirements: 6.2, 6.3_

  - [x] 6.5 Create churn risk table
    - Create components/predictive-analytics/churn-risk-table.tsx
    - Display sortable table with risk scores, last job date, YTD revenue
    - Show key risk factors and action buttons
    - _Requirements: 3.6, 6.4_

  - [x] 6.6 Create customer risk tab
    - Create components/predictive-analytics/customer-risk-tab.tsx
    - Integrate churn risk table
    - Display risk summary statistics
    - _Requirements: 6.4_

  - [x] 6.7 Create payment prediction table
    - Create components/predictive-analytics/payment-prediction-table.tsx
    - Display invoices with predicted payment dates
    - Show late payment risk indicators
    - _Requirements: 4.6, 6.5_

  - [x] 6.8 Create payment prediction tab
    - Create components/predictive-analytics/payment-prediction-tab.tsx
    - Integrate payment prediction table
    - _Requirements: 6.5_

  - [x] 6.9 Create main predictive dashboard
    - Create components/predictive-analytics/predictive-dashboard.tsx
    - Implement tabbed navigation for all prediction types
    - Add refresh and settings controls
    - _Requirements: 6.1, 6.6_

- [x] 7. Create dashboard page
  - [x] 7.1 Create predictions page route
    - Create app/(main)/dashboard/executive/predictions/page.tsx
    - Integrate predictive dashboard component
    - Add page metadata and loading states
    - _Requirements: 6.1_

  - [x] 7.2 Add navigation link
    - Update navigation to include predictions page link
    - Add appropriate icon and label
    - _Requirements: 6.1_

- [x] 8. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation uses fast-check for property-based testing
