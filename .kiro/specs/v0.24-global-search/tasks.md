# Implementation Plan: Global Search (v0.24)

## Overview

This implementation plan covers the Global Search feature, enabling Cmd+K / Ctrl+K search across all entities. Tasks are ordered to build incrementally: database infrastructure first, then core search logic, UI components, and finally integration.

## Tasks

- [x] 1. Database Infrastructure Setup
  - [x] 1.1 Create search_index view
    - Create SQL migration for search_index view
    - Union customers, projects, proforma_job_orders, job_orders, invoices, vendors
    - Include entity_type, entity_id, primary_text, secondary_text, url, created_at columns
    - Filter to only active records (is_active = TRUE where applicable)
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 1.2 Create global_search function
    - Create SQL function accepting search_query (TEXT) and max_results (INTEGER DEFAULT 20)
    - Implement case-insensitive ILIKE matching on primary_text and secondary_text
    - Implement relevance scoring: prefix=1.0, contains=0.8, secondary_only=0.5, other=0.3
    - Order by relevance DESC, created_at DESC
    - Limit results to max_results
    - _Requirements: 10.4, 10.5, 4.1, 4.2, 4.3, 4.4_

  - [x] 1.3 Write property test for relevance scoring
    - **Property 1: Relevance Scoring Correctness**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

  - [x] 1.4 Write property test for case-insensitive matching
    - **Property 9: Case-Insensitive Matching**
    - **Validates: Requirements 10.5**

- [x] 2. Checkpoint - Database Setup
  - Ensure search_index view returns data from all entity tables
  - Ensure global_search function returns correctly scored results
  - Ask the user if questions arise

- [x] 3. Search Utility Functions
  - [x] 3.1 Create search utility module
    - Create lib/search-utils.ts
    - Implement performSearch function wrapping Supabase RPC call
    - Implement groupResultsByEntityType function
    - Implement sortResultsByRelevance function (for client-side verification)
    - Define SearchResult interface and entity type constants
    - _Requirements: 3.1, 3.3, 3.4_

  - [x] 3.2 Write property test for results grouping
    - **Property 3: Results Grouping by Entity Type**
    - **Validates: Requirements 3.1**

  - [x] 3.3 Write property test for results ordering
    - **Property 4: Results Ordering**
    - **Validates: Requirements 3.3**

  - [x] 3.4 Write property test for results limit
    - **Property 5: Results Limit Invariant**
    - **Validates: Requirements 3.4**

- [x] 4. Recent Searches Management
  - [x] 4.1 Create recent searches utility
    - Create lib/recent-searches-utils.ts
    - Implement loadRecentSearches from localStorage
    - Implement saveRecentSearch with deduplication and max 5 limit
    - Implement clearRecentSearches
    - Handle localStorage unavailability gracefully
    - _Requirements: 7.1, 7.2, 7.3, 7.5_

  - [x] 4.2 Write property test for recent searches max limit
    - **Property 6: Recent Searches Maximum Limit**
    - **Validates: Requirements 7.1**

  - [x] 4.3 Write property test for recent searches no duplicates
    - **Property 7: Recent Searches No Duplicates**
    - **Validates: Requirements 7.5**

- [x] 5. Checkpoint - Utility Functions
  - Ensure all utility functions work correctly
  - Ensure all property tests pass
  - Ask the user if questions arise

- [x] 6. GlobalSearch Component
  - [x] 6.1 Create GlobalSearch component structure
    - Create components/search/global-search.tsx
    - Implement component state (open, query, results, selectedIndex, isLoading)
    - Implement keyboard shortcut listener (Cmd+K / Ctrl+K)
    - Implement Escape key to close dialog
    - Use shadcn Dialog component
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 6.2 Implement search input and debouncing
    - Add search input with 200ms debounce
    - Implement minimum 2 character threshold before searching
    - Show loading state during search
    - Show "No results found" for empty results
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 6.3 Write property test for minimum query length
    - **Property 10: Minimum Query Length Threshold**
    - **Validates: Requirements 2.1**

  - [x] 6.4 Implement results display
    - Group results by entity type
    - Display entity icon, primary text, secondary text for each result
    - Show entity type section headers
    - Highlight selected result
    - _Requirements: 3.1, 3.2_

  - [x] 6.5 Implement keyboard navigation
    - Handle Up/Down arrow keys for selection
    - Handle Enter key for navigation
    - Implement bounds checking for selection index
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 6.6 Write property test for keyboard navigation bounds
    - **Property 2: Keyboard Navigation Bounds**
    - **Validates: Requirements 5.1, 5.2, 5.4, 5.5**

  - [x] 6.7 Implement mouse navigation
    - Handle click on search result
    - Navigate to result URL and close dialog
    - Add hover styles for visual feedback
    - _Requirements: 6.1, 6.2_

  - [x] 6.8 Implement recent searches display
    - Show recent searches when query is empty
    - Allow clicking recent search to populate input
    - Integrate with recent searches utility
    - _Requirements: 7.1, 7.4_

  - [x] 6.9 Implement quick actions
    - Show quick action buttons when query is empty
    - Add "New PJO" action navigating to /proforma-jo/new
    - Add "New Customer" action navigating to /customers/new
    - Display keyboard shortcut hints
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 7. Checkpoint - GlobalSearch Component
  - Ensure dialog opens/closes correctly
  - Ensure search returns and displays results
  - Ensure keyboard and mouse navigation work
  - Ask the user if questions arise

- [x] 8. Header Integration
  - [x] 8.1 Create search button for header
    - Add search button with search icon and "Search..." text
    - Display keyboard shortcut hint (⌘K / Ctrl+K)
    - Wire button click to open GlobalSearch dialog
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 8.2 Integrate GlobalSearch into layout
    - Add GlobalSearch component to app/(main)/layout.tsx
    - Ensure component is available on all authenticated pages
    - _Requirements: 9.3_

- [x] 9. Final Checkpoint
  - Ensure all tests pass
  - Test full search flow end-to-end
  - Verify keyboard shortcuts work across different pages
  - Ask the user if questions arise

## Notes

- All tasks are required for comprehensive implementation
- Property tests use fast-check library for randomized testing
- Each property test should run minimum 100 iterations
- Database migrations should be applied via Supabase MCP or dashboard
