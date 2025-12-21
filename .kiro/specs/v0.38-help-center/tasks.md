# Implementation Plan: Help Center & Documentation

## Overview

This implementation plan breaks down the Help Center feature into discrete coding tasks. The feature provides searchable documentation, FAQs, and contextual help for GAMA ERP users.

## Tasks

- [x] 1. Create database schema and seed data
  - [x] 1.1 Create help_articles table with full-text search index
    - Apply migration with table structure, indexes, and RLS policies
    - Insert default articles (getting-started, creating-quotation, recording-payment)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1_
  - [x] 1.2 Create help_faqs table with full-text search index
    - Apply migration with table structure, indexes, and RLS policies
    - Insert default FAQs (password reset, revenue visibility, invoice splitting, BKK, engineering flags)
    - _Requirements: 2.1, 2.2, 3.2_
  - [x] 1.3 Create search_help_content RPC function
    - Create PostgreSQL function for combined article/FAQ search
    - Use ts_rank for relevance scoring
    - _Requirements: 3.3, 5.1, 5.2_

- [x] 2. Create TypeScript types and utility functions
  - [x] 2.1 Create help-center types
    - Define HelpArticle, HelpFAQ, HelpSearchResult interfaces
    - Define HelpArticleRow, HelpFAQRow database row types
    - Define HelpArticleCategory type and constants
    - _Requirements: 1.1, 2.1_
  - [x] 2.2 Implement data transformation utilities
    - Implement mapDbRowToArticle function
    - Implement mapDbRowToFAQ function
    - _Requirements: 1.1, 2.1_
  - [x] 2.3 Write property tests for data transformation
    - **Property 1: Article Data Transformation Round-Trip**
    - **Property 2: FAQ Data Transformation Round-Trip**
    - **Validates: Requirements 1.1, 2.1**
  - [x] 2.4 Implement filtering utilities
    - Implement filterArticlesByRole function
    - Implement filterFAQsByRole function
    - Implement filterArticlesByRoute function
    - _Requirements: 8.2, 9.1, 9.2_
  - [x] 2.5 Write property tests for filtering utilities
    - **Property 8: Route-Based Article Filtering**
    - **Property 9: Role-Based Content Filtering**
    - **Validates: Requirements 8.2, 9.1, 9.2, 9.3**
  - [x] 2.6 Implement sorting and grouping utilities
    - Implement sortArticlesByDisplayOrder function
    - Implement sortFAQsByDisplayOrder function
    - Implement groupArticlesByCategory function
    - Implement calculateCategoryCounts function
    - _Requirements: 4.3, 7.1, 7.4, 10.1, 10.2_
  - [x] 2.7 Write property tests for sorting and grouping
    - **Property 4: Category Article Count Calculation**
    - **Property 7: FAQ Grouping and Sorting**
    - **Property 10: Category-Based Article Filtering and Sorting**
    - **Property 11: Display Order Sorting Invariant**
    - **Validates: Requirements 4.3, 7.1, 7.4, 10.1, 10.2**
  - [x] 2.8 Implement search and display utilities
    - Implement highlightSearchTerms function
    - Implement getCategoryDisplayInfo function
    - Implement getArticleUrl function
    - Implement isValidSearchQuery function
    - Implement isValidCategory function
    - _Requirements: 1.3, 5.3_
  - [x] 2.9 Write property tests for search utilities
    - **Property 3: Category Validation**
    - **Property 5: Search Results Relevance Ordering**
    - **Property 6: Search Term Highlighting**
    - **Validates: Requirements 1.3, 5.1, 5.2, 5.3**

- [x] 3. Checkpoint - Verify utilities
  - Ensure all property tests pass
  - Ensure all unit tests pass
  - Ask the user if questions arise

- [x] 4. Create server actions
  - [x] 4.1 Implement search action
    - Create searchHelpContent function using RPC
    - Filter results by user role
    - _Requirements: 5.1, 5.2, 9.1, 9.2_
  - [x] 4.2 Implement article retrieval actions
    - Create getArticlesForRole function
    - Create getArticleBySlug function
    - Create getContextualArticles function
    - _Requirements: 6.2, 8.2, 10.1_
  - [x] 4.3 Implement FAQ retrieval action
    - Create getFAQsForRole function
    - _Requirements: 7.1, 9.2_
  - [x] 4.4 Implement feedback actions
    - Create incrementViewCount function
    - Create recordFeedback function
    - _Requirements: 6.4, 6.6_
  - [x] 4.5 Write unit tests for server actions
    - Test search with mocked Supabase
    - Test article retrieval
    - Test feedback recording
    - _Requirements: 5.1, 6.4, 6.6_

- [x] 5. Create Help Center UI components
  - [x] 5.1 Create category-card component
    - Display category icon, label, and article count
    - Link to category page
    - _Requirements: 4.3_
  - [x] 5.2 Create help-article-card component
    - Display article title, summary, and tags
    - Link to article detail page
    - _Requirements: 10.3_
  - [x] 5.3 Create faq-accordion component
    - Expandable/collapsible FAQ items
    - Group by category
    - Sort by display_order
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  - [x] 5.4 Create help-article-search component
    - Search input with debounce
    - Results dropdown with highlighting
    - Empty state message
    - _Requirements: 5.1, 5.3, 5.4_
  - [x] 5.5 Create quick-links component
    - Links to Getting Started, Guided Tours, Keyboard Shortcuts
    - _Requirements: 4.2_
  - [x] 5.6 Create help-feedback component
    - "Was this helpful?" buttons
    - Update counts on click
    - _Requirements: 6.5, 6.6_

- [x] 6. Create Help Center pages
  - [x] 6.1 Create help center main page (/help)
    - Search input at top
    - Quick links section
    - Category cards grid
    - FAQ accordion section
    - Contact information footer
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  - [x] 6.2 Create article detail page (/help/articles/[slug])
    - Render markdown content
    - Display title and summary
    - Show related articles
    - Increment view count
    - Feedback buttons
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  - [x] 6.3 Create category page (/help/category/[category])
    - List articles in category
    - Sort by display_order
    - Show title, summary, tags
    - _Requirements: 10.1, 10.2, 10.3_

- [x] 7. Create contextual help feature
  - [x] 7.1 Create contextual-help-popover component
    - Popover with relevant articles for current route
    - Fallback to general help when no matches
    - Links to full articles
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  - [x] 7.2 Add help button to main layout
    - Accessible from all pages
    - Trigger contextual help popover
    - _Requirements: 8.1_

- [x] 8. Update navigation and integrate
  - [x] 8.1 Add Help Center to navigation
    - Add help link to sidebar/header
    - _Requirements: 4.1_
  - [x] 8.2 Export components from index file
    - Create components/help-center/index.ts
    - Export all public components

- [x] 9. Final checkpoint - Integration testing
  - ✅ All 56 tests pass (34 unit + 22 property tests)
  - ✅ Build succeeds with no errors
  - ✅ Help center pages created (/help, /help/articles/[slug], /help/category/[category])
  - ✅ Contextual help integrated in header
  - ✅ Navigation updated with Help Center link

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The feature uses fast-check for property-based testing
