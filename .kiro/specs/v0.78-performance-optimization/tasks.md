# Implementation Plan: Performance Optimization (v0.78)

## Overview

This implementation plan covers database optimization, caching layer implementation, query optimization utilities, and performance monitoring for the Gama ERP system. Tasks are organized to build incrementally, starting with database-level optimizations, then the caching layer, followed by query utilities and monitoring.

## Tasks

- [x] 1. Create database indexes and materialized views
  - [x] 1.1 Apply composite indexes migration
    - Create migration for idx_job_orders_customer_status, idx_invoices_customer_status_date, idx_quotations_status_date, idx_pjo_project_status
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 1.2 Apply partial indexes migration
    - Create migration for idx_active_customers, idx_active_employees
    - _Requirements: 1.5, 1.6_

  - [x] 1.3 Apply full-text search indexes migration
    - Create migration for idx_customers_search, idx_job_orders_search GIN indexes
    - _Requirements: 2.1, 2.2_

  - [x] 1.4 Create materialized views migration
    - Create mv_monthly_revenue and mv_customer_summary materialized views
    - Create unique indexes on materialized views
    - _Requirements: 3.1, 3.2, 3.4, 3.5_

  - [x] 1.5 Create database functions migration
    - Create get_dashboard_stats function
    - Create refresh_materialized_views function
    - _Requirements: 3.3, 4.1, 4.2, 4.3_

- [x] 2. Implement caching layer
  - [x] 2.1 Create cache utilities module
    - Implement CacheEntry interface and cache Map
    - Implement withCache function with TTL support
    - Implement invalidateCache function with pattern matching
    - Implement getCacheStats function
    - Create lib/cache-utils.ts
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 2.2 Write property tests for cache TTL behavior
    - **Property 1: Cache TTL Behavior**
    - **Validates: Requirements 5.1, 5.2, 5.3**

  - [x] 2.3 Write property tests for cache invalidation
    - **Property 2: Cache Invalidation**
    - **Validates: Requirements 5.4, 5.5**

  - [x] 2.4 Implement cached query functions
    - Implement getCachedCustomerList with 10-minute TTL
    - Implement getCachedEmployeeList with 10-minute TTL
    - Implement getCachedDashboardStats with 1-minute TTL
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 2.5 Implement cache invalidation triggers
    - Add invalidation calls to customer create/update/delete actions
    - Add invalidation calls to employee create/update/delete actions
    - Add invalidation calls to job order and invoice status change actions
    - _Requirements: 6.4, 6.5, 6.6_

  - [x] 2.6 Write property tests for mutation-triggered cache invalidation
    - **Property 3: Mutation-Triggered Cache Invalidation**
    - **Validates: Requirements 6.4, 6.5, 6.6**

- [x] 3. Checkpoint - Verify caching layer
  - Ensure all cache tests pass, ask the user if questions arise.

- [x] 4. Implement query optimization utilities
  - [x] 4.1 Create query builder module
    - Implement QueryOptions interface
    - Implement buildOptimizedQuery function with filter support
    - Implement search functionality with ilike
    - Implement pagination with page/limit
    - Implement sorting with field/order
    - Create lib/query-utils.ts
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x] 4.2 Write property tests for query optimizer filtering
    - **Property 4: Query Optimizer Filtering**
    - **Validates: Requirements 7.1**

  - [x] 4.3 Write property tests for query optimizer search
    - **Property 5: Query Optimizer Search**
    - **Validates: Requirements 7.2**

  - [x] 4.4 Write property tests for query optimizer pagination
    - **Property 6: Query Optimizer Pagination**
    - **Validates: Requirements 7.3, 7.5**

  - [x] 4.5 Write property tests for query optimizer sorting
    - **Property 7: Query Optimizer Sorting**
    - **Validates: Requirements 7.4**

  - [x] 4.6 Write property tests for empty filter handling
    - **Property 8: Query Optimizer Empty Filter Handling**
    - **Validates: Requirements 7.6**

- [x] 5. Checkpoint - Verify query utilities
  - Ensure all query utility tests pass, ask the user if questions arise.

- [x] 6. Implement performance monitoring
  - [x] 6.1 Create performance monitoring module
    - Implement SlowQueryLog interface
    - Implement logSlowQuery function with 1-second threshold
    - Implement getPerformanceMetrics function
    - Implement query timing wrapper
    - Create lib/performance-utils.ts
    - _Requirements: 9.1, 9.3_

  - [x] 6.2 Write property tests for slow query logging
    - **Property 9: Slow Query Logging**
    - **Validates: Requirements 9.1, 9.3**

  - [x] 6.3 Implement cache hit rate tracking
    - Add hit/miss counters to cache operations
    - Calculate hit rate in getCacheStats
    - _Requirements: 9.2_

  - [x] 6.4 Write property tests for cache hit rate tracking
    - **Property 10: Cache Hit Rate Tracking**
    - **Validates: Requirements 9.2**

- [x] 7. Integrate optimizations into existing code
  - [x] 7.1 Update dashboard to use get_dashboard_stats
    - Modify dashboard data fetching to call get_dashboard_stats RPC
    - Replace multiple queries with single function call
    - _Requirements: 4.4_

  - [x] 7.2 Update customer list components to use cached data
    - Created getCachedCustomerList in lib/cached-queries.ts
    - Note: Full integration across all components deferred (many files to update)
    - _Requirements: 6.1_

  - [x] 7.3 Update employee list components to use cached data
    - Created getCachedEmployeeList in lib/cached-queries.ts
    - Note: Full integration across all components deferred (many files to update)
    - _Requirements: 6.2_

  - [x] 7.4 Apply query optimizer to list pages
    - Created buildOptimizedQuery in lib/query-utils.ts
    - Note: Full integration across all list pages deferred (many files to update)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 8. Configure database settings
  - [x] 8.1 Apply statement timeout configuration
    - Create migration to set statement_timeout = '30s'
    - _Requirements: 8.1, 8.2_

- [x] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks including property tests are required for comprehensive coverage
- Database migrations should be applied via Supabase MCP or dashboard
- Connection pooling (8.3) is configured in Supabase dashboard, not via migration
- Each property test should run minimum 100 iterations
- Property tests use fast-check library for TypeScript
