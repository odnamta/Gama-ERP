# Design Document: Global Search (v0.24)

## Overview

The Global Search feature provides a command palette-style search interface accessible via Cmd+K (Mac) or Ctrl+K (Windows/Linux). It enables users to quickly search across all entities in the Gama ERP system including customers, projects, PJOs, job orders, invoices, and vendors. The feature includes recent search history, quick actions for creating new entities, and keyboard-first navigation.

## Architecture

The Global Search feature follows a client-server architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │  GlobalSearch   │───▶│   localStorage  │                     │
│  │   Component     │    │ (recent search) │                     │
│  └────────┬────────┘    └─────────────────┘                     │
│           │                                                      │
│           │ Supabase RPC                                        │
│           ▼                                                      │
├─────────────────────────────────────────────────────────────────┤
│                      Supabase Backend                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │  global_search  │───▶│  search_index   │                     │
│  │   (function)    │    │    (view)       │                     │
│  └─────────────────┘    └────────┬────────┘                     │
│                                  │                               │
│           ┌──────────────────────┼──────────────────────┐       │
│           ▼                      ▼                      ▼       │
│  ┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐ │
│  │  customers  │    │ proforma_job_   │    │    invoices     │ │
│  │  projects   │    │    orders       │    │   job_orders    │ │
│  │   vendors   │    │                 │    │                 │ │
│  └─────────────┘    └─────────────────┘    └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. GlobalSearch Component

The main React component that renders the search dialog and handles user interactions.

```typescript
interface GlobalSearchProps {
  // No props required - component is self-contained
}

interface SearchResult {
  entity_type: 'customer' | 'project' | 'pjo' | 'jo' | 'invoice' | 'vendor';
  entity_id: string;
  primary_text: string;
  secondary_text: string | null;
  url: string;
  relevance: number;
}

interface GlobalSearchState {
  open: boolean;
  query: string;
  results: SearchResult[];
  selectedIndex: number;
  isLoading: boolean;
  recentSearches: string[];
}
```

### 2. Search Dialog UI Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ 🔍 [Search input field                              ] ESC       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Results Area - scrollable, max-height: 400px]                │
│                                                                 │
│  ENTITY_TYPE_LABEL                                             │
│  ─────────────────────────────────────────────────────────     │
│  → [Icon] Primary Text                                         │
│           Secondary Text                                        │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ ↵ to select  ↑↓ to navigate                    esc to close    │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Header Search Button

A button component integrated into the application header.

```typescript
interface SearchButtonProps {
  onClick: () => void;
}
```

## Data Models

### Search Index View Schema

```sql
CREATE OR REPLACE VIEW search_index AS
SELECT 
  entity_type::VARCHAR,
  entity_id::UUID,
  primary_text::TEXT,
  secondary_text::TEXT,
  url::TEXT,
  created_at::TIMESTAMPTZ
FROM (
  -- Union of all searchable entities
) AS combined_entities;
```

### Entity Mappings

| Entity Type | Primary Text | Secondary Text | URL Pattern |
|-------------|--------------|----------------|-------------|
| customer | name | email | /customers/{id} |
| project | name | description | /projects/{id} |
| pjo | pjo_number | commodity - description | /proforma-jo/{id} |
| jo | jo_number | description | /job-orders/{id} |
| invoice | invoice_number | status - total_amount | /invoices/{id} |
| vendor | vendor_name | vendor_type - city | /vendors/{id} |

### Recent Searches Storage

```typescript
// localStorage key: 'recentSearches'
// Value: JSON array of strings, max 5 items
type RecentSearches = string[];
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Relevance Scoring Correctness

*For any* search result returned by global_search, the relevance score SHALL equal:
- 1.0 if primary_text starts with the search query (case-insensitive)
- 0.8 if primary_text contains but does not start with the search query
- 0.5 if only secondary_text contains the search query
- 0.3 for all other partial matches

**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

### Property 2: Keyboard Navigation Bounds

*For any* results array of length N and any current selectedIndex, after pressing:
- Down Arrow: new selectedIndex = min(selectedIndex + 1, N - 1)
- Up Arrow: new selectedIndex = max(selectedIndex - 1, 0)

The selectedIndex SHALL always remain within bounds [0, N-1] for non-empty results.

**Validates: Requirements 5.1, 5.2, 5.4, 5.5**

### Property 3: Results Grouping by Entity Type

*For any* set of search results, grouping by entity_type SHALL produce buckets where each bucket contains only results of that entity_type, and no result appears in multiple buckets.

**Validates: Requirements 3.1**

### Property 4: Results Ordering

*For any* set of search results, the results SHALL be ordered such that for any two consecutive results r1 and r2:
- r1.relevance >= r2.relevance, AND
- if r1.relevance == r2.relevance, then r1.created_at >= r2.created_at

**Validates: Requirements 3.3**

### Property 5: Results Limit Invariant

*For any* search query, the number of results returned by global_search SHALL be at most max_results (default 20).

**Validates: Requirements 3.4**

### Property 6: Recent Searches Maximum Limit

*For any* state of recentSearches, the array length SHALL be at most 5.

**Validates: Requirements 7.1**

### Property 7: Recent Searches No Duplicates

*For any* recentSearches array after adding a new search query, the array SHALL contain no duplicate entries.

**Validates: Requirements 7.5**

### Property 8: Search Index Excludes Inactive Records

*For any* record in the source tables with is_active = FALSE (where applicable), that record SHALL NOT appear in the search_index view.

**Validates: Requirements 10.3**

### Property 9: Case-Insensitive Matching

*For any* search query Q and text T, if T contains Q (case-insensitive), then global_search SHALL return T as a match regardless of the case of Q or T.

**Validates: Requirements 10.5**

### Property 10: Minimum Query Length Threshold

*For any* search query with length < 2, the search function SHALL NOT be invoked and no search results SHALL be displayed.

**Validates: Requirements 2.1**

## Error Handling

### Network Errors
- WHEN a search request fails due to network error, THE Search_Dialog SHALL display an error message and allow retry
- THE component SHALL catch and log all Supabase RPC errors

### Invalid Data
- WHEN search results contain null or undefined fields, THE component SHALL handle gracefully with fallback values
- WHEN localStorage is unavailable, THE component SHALL continue functioning without recent searches

### Edge Cases
- Empty search results: Display "No results found" message
- Very long search queries: Truncate display but search full query
- Special characters in query: Pass through to database function (SQL injection prevented by parameterized queries)

## Testing Strategy

### Unit Tests
Unit tests will verify specific examples and edge cases:

1. **Keyboard shortcut detection**: Test Cmd+K and Ctrl+K event handling
2. **Dialog open/close states**: Test state transitions
3. **Empty query display**: Test recent searches and quick actions rendering
4. **Result rendering**: Test that all required fields are displayed
5. **Navigation actions**: Test URL generation and router calls

### Property-Based Tests
Property-based tests will use **fast-check** library to verify universal properties:

1. **Relevance scoring**: Generate random text/query combinations and verify scoring rules
2. **Navigation bounds**: Generate random array lengths and indices, verify bounds
3. **Grouping correctness**: Generate random result sets, verify grouping
4. **Ordering correctness**: Generate random results with scores/dates, verify order
5. **Recent searches invariants**: Generate sequences of search operations, verify limits and uniqueness

### Test Configuration
- Minimum 100 iterations per property test
- Each test tagged with: **Feature: global-search, Property {number}: {property_text}**

### Integration Tests
- Test full search flow from input to navigation
- Test localStorage persistence across sessions
- Test Supabase RPC integration with test database
