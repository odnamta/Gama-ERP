# Implementation Plan: AI Insights - Natural Language Queries

## Overview

This implementation plan covers the AI Insights feature enabling executives to query business data using natural language. The approach prioritizes safety (SQL validation) first, then core query processing, followed by UI components.

## Tasks

- [x] 1. Set up database schema and types
  - [x] 1.1 Create database migration for ai_query_history and ai_query_templates tables
    - Create tables with proper indexes
    - Insert default query templates
    - Set up RLS policies
    - _Requirements: 2.3, 7.1_
  - [x] 1.2 Create TypeScript types for AI insights
    - Define AIQueryHistory, AIQueryTemplate, AIQueryResponse interfaces
    - Define ResponseType, TemplateCategory, ChartConfig types
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 2. Implement SQL validation and safety layer
  - [x] 2.1 Create SQL validator utility functions
    - Implement validateSQL function with blocked keywords check
    - Implement blocked tables check
    - Implement SELECT-only validation
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 2.2 Write property test for SQL validation
    - **Property 6: SQL Validation Blocks Unsafe Queries**
    - **Validates: Requirements 4.1, 4.2, 4.3**

- [x] 3. Implement query input validation
  - [x] 3.1 Create query validation utility
    - Implement empty/whitespace query validation
    - _Requirements: 1.2_
  - [x] 3.2 Write property test for empty query validation
    - **Property 1: Empty Query Validation**
    - **Validates: Requirements 1.2**

- [x] 4. Implement template matching system
  - [x] 4.1 Create template matching utility functions
    - Implement similarity calculation function
    - Implement template matching with 0.7 threshold
    - Implement parameter extraction from queries
    - Implement parameter substitution into SQL
    - _Requirements: 2.1, 2.2_
  - [x] 4.2 Write property test for template matching threshold
    - **Property 2: Template Matching Threshold**
    - **Validates: Requirements 2.1**
  - [x] 4.3 Write property test for parameter extraction and substitution
    - **Property 3: Parameter Extraction and Substitution**
    - **Validates: Requirements 2.2**

- [x] 5. Implement response formatting
  - [x] 5.1 Create response type determination logic
    - Implement logic for number, table, chart, empty responses
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [x] 5.2 Create value formatting utilities
    - Implement currency formatter with "Rp" prefix
    - Implement percentage formatter with 1 decimal
    - _Requirements: 5.5, 5.6_
  - [x] 5.3 Write property test for response type determination
    - **Property 7: Response Type Determination**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
  - [x] 5.4 Write property test for value formatting
    - **Property 8: Value Formatting**
    - **Validates: Requirements 5.5, 5.6**

- [x] 6. Checkpoint - Core utilities complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement query history management
  - [x] 7.1 Create query history actions
    - Implement logQuery function
    - Implement getQueryHistory with limit of 10
    - Implement updateFeedback function
    - _Requirements: 7.1, 7.2, 8.2_
  - [x] 7.2 Create relative timestamp formatter
    - Implement formatRelativeTime function
    - _Requirements: 7.4_
  - [x] 7.3 Write property test for query history completeness
    - **Property 9: Query History Completeness**
    - **Validates: Requirements 7.1, 8.2**
  - [x] 7.4 Write property test for history limit
    - **Property 10: History Limit**
    - **Validates: Requirements 7.2**
  - [x] 7.5 Write property test for relative timestamp formatting
    - **Property 11: Relative Timestamp Formatting**
    - **Validates: Requirements 7.4**

- [x] 8. Implement export functionality
  - [x] 8.1 Create CSV export utility
    - Implement exportToCSV function with proper escaping
    - _Requirements: 9.2_
  - [x] 8.2 Write property test for CSV export format
    - **Property 12: CSV Export Format**
    - **Validates: Requirements 9.2**

- [x] 9. Implement access control
  - [x] 9.1 Create role-based access check utility
    - Implement canAccessAIInsights function
    - _Requirements: 10.1_
  - [x] 9.2 Write property test for role-based access control
    - **Property 13: Role-Based Access Control**
    - **Validates: Requirements 10.1**

- [x] 10. Checkpoint - All utilities and tests complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implement query processor service
  - [x] 11.1 Create main query processor
    - Implement processQuery orchestration function
    - Integrate template matching, SQL generation, validation, execution
    - Implement error handling with suggestions
    - _Requirements: 1.1, 2.1, 3.1, 3.4, 4.4_
  - [x] 11.2 Write property test for error responses include suggestions
    - **Property 5: Error Responses Include Suggestions**
    - **Validates: Requirements 3.4**
  - [x] 11.3 Write property test for template response format consistency
    - **Property 4: Template Response Format Consistency**
    - **Validates: Requirements 2.4**

- [x] 12. Build UI components
  - [x] 12.1 Create AIQueryInput component
    - Build query input field with placeholder
    - Add submit button with loading state
    - Add quick question buttons
    - _Requirements: 1.3, 6.1, 6.2, 6.3_
  - [x] 12.2 Create AIQueryResponse component
    - Build response display for text, number, table, chart types
    - Add feedback buttons (Helpful/Not Helpful)
    - Add export and email buttons
    - _Requirements: 5.1, 5.2, 5.3, 8.1, 9.1, 9.3_
  - [x] 12.3 Create AIQueryHistory component
    - Build history list with relative timestamps
    - Add click-to-rerun functionality
    - _Requirements: 7.2, 7.3, 7.4_

- [x] 13. Create AI Insights page
  - [x] 13.1 Create page route at /dashboard/executive/ai
    - Integrate all components
    - Add access control check
    - Wire up query processing flow
    - _Requirements: 10.1, 10.2_
  - [x] 13.2 Add navigation link to executive dashboard
    - Add AI Insights link in navigation
    - _Requirements: 10.1_

- [x] 14. Final checkpoint - Feature complete
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all acceptance criteria are met

## Notes

- All property-based tests are required for comprehensive coverage
- SQL validation is implemented first as it's critical for security
- UI components are built after all utilities are tested
- The AI SQL generation (Claude API integration) is a placeholder - actual implementation depends on API availability
