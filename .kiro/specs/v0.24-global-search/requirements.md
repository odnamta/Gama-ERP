# Requirements Document

## Introduction

This document defines the requirements for implementing a Global Search feature (v0.24) in the Gama ERP system. The feature enables users to quickly search across all entities (customers, projects, PJOs, job orders, invoices, vendors) using a keyboard-triggered command palette (Cmd+K / Ctrl+K).

## Glossary

- **Search_Dialog**: The modal overlay component that appears when the user triggers the global search shortcut
- **Search_Index**: A database view that aggregates searchable content from all entity tables
- **Entity_Type**: The category of a search result (customer, project, pjo, jo, invoice, vendor)
- **Relevance_Score**: A numeric value (0.0-1.0) indicating how closely a result matches the search query
- **Recent_Searches**: Previously executed search queries stored in browser localStorage
- **Quick_Actions**: Shortcut commands for creating new entities directly from the search dialog

## Requirements

### Requirement 1: Keyboard Shortcut Activation

**User Story:** As a user, I want to open the global search dialog using a keyboard shortcut, so that I can quickly search without using the mouse.

#### Acceptance Criteria

1. WHEN the user presses Cmd+K on macOS, THE Search_Dialog SHALL open immediately
2. WHEN the user presses Ctrl+K on Windows/Linux, THE Search_Dialog SHALL open immediately
3. WHEN the user presses Escape while the Search_Dialog is open, THE Search_Dialog SHALL close immediately
4. WHEN the Search_Dialog opens, THE input field SHALL receive focus automatically

### Requirement 2: Search Input and Query Processing

**User Story:** As a user, I want to type a search query and see results in real-time, so that I can find entities quickly.

#### Acceptance Criteria

1. WHEN the user types fewer than 2 characters, THE Search_Dialog SHALL display recent searches and quick actions instead of search results
2. WHEN the user types 2 or more characters, THE Search_Dialog SHALL execute a search query after a 200ms debounce delay
3. WHILE a search is in progress, THE Search_Dialog SHALL display a loading indicator
4. WHEN the search completes with no results, THE Search_Dialog SHALL display a "No results found" message with the search query

### Requirement 3: Search Results Display

**User Story:** As a user, I want to see search results grouped by entity type with relevant information, so that I can identify the correct item quickly.

#### Acceptance Criteria

1. WHEN search results are returned, THE Search_Dialog SHALL group results by entity_type (Customers, Projects, PJOs, Job Orders, Invoices, Vendors)
2. WHEN displaying a result, THE Search_Dialog SHALL show the entity icon, primary text, and secondary text
3. WHEN displaying results, THE Search_Dialog SHALL order them by relevance_score descending, then by created_at descending
4. THE Search_Dialog SHALL limit results to a maximum of 20 items

### Requirement 4: Search Relevance Scoring

**User Story:** As a user, I want search results to be ranked by relevance, so that the most likely matches appear first.

#### Acceptance Criteria

1. WHEN the primary_text starts with the search query, THE global_search function SHALL assign a relevance_score of 1.0
2. WHEN the primary_text contains the search query (not at start), THE global_search function SHALL assign a relevance_score of 0.8
3. WHEN only the secondary_text contains the search query, THE global_search function SHALL assign a relevance_score of 0.5
4. FOR ALL other partial matches, THE global_search function SHALL assign a relevance_score of 0.3

### Requirement 5: Keyboard Navigation

**User Story:** As a user, I want to navigate search results using the keyboard, so that I can select items without using the mouse.

#### Acceptance Criteria

1. WHEN the user presses the Down Arrow key, THE Search_Dialog SHALL move selection to the next result
2. WHEN the user presses the Up Arrow key, THE Search_Dialog SHALL move selection to the previous result
3. WHEN the user presses Enter, THE Search_Dialog SHALL navigate to the selected result's URL and close the dialog
4. WHEN selection reaches the last result and Down Arrow is pressed, THE selection SHALL remain on the last result
5. WHEN selection is on the first result and Up Arrow is pressed, THE selection SHALL remain on the first result

### Requirement 6: Mouse Navigation

**User Story:** As a user, I want to click on search results to navigate to them, so that I can use the mouse when preferred.

#### Acceptance Criteria

1. WHEN the user clicks on a search result, THE Search_Dialog SHALL navigate to the result's URL and close the dialog
2. WHEN the user hovers over a search result, THE Search_Dialog SHALL provide visual feedback indicating the item is clickable

### Requirement 7: Recent Searches

**User Story:** As a user, I want to see my recent searches when opening the search dialog, so that I can quickly repeat previous searches.

#### Acceptance Criteria

1. WHEN the Search_Dialog opens with an empty query, THE Search_Dialog SHALL display up to 5 recent searches
2. WHEN the user executes a search and navigates to a result, THE Search_Dialog SHALL save the query to recent searches
3. WHEN saving a recent search, THE Search_Dialog SHALL store it in browser localStorage
4. WHEN the user clicks on a recent search, THE Search_Dialog SHALL populate the input field with that search query
5. IF a search query already exists in recent searches, THEN THE Search_Dialog SHALL move it to the top instead of duplicating

### Requirement 8: Quick Actions

**User Story:** As a user, I want to access quick actions from the search dialog, so that I can create new entities without navigating away.

#### Acceptance Criteria

1. WHEN the Search_Dialog opens with an empty query, THE Search_Dialog SHALL display quick action buttons
2. WHEN the user clicks "New PJO" quick action, THE Search_Dialog SHALL navigate to /proforma-jo/new and close
3. WHEN the user clicks "New Customer" quick action, THE Search_Dialog SHALL navigate to /customers/new and close
4. THE Search_Dialog SHALL display keyboard shortcut hints next to quick actions

### Requirement 9: Header Search Button

**User Story:** As a user, I want to see a search button in the header, so that I can discover and access the search feature.

#### Acceptance Criteria

1. THE Header component SHALL display a search button with a search icon and "Search..." text
2. THE search button SHALL display the keyboard shortcut hint (⌘K on Mac, Ctrl+K on Windows)
3. WHEN the user clicks the search button, THE Search_Dialog SHALL open

### Requirement 10: Database Search Infrastructure

**User Story:** As a developer, I want a database view and function for searching, so that search queries are efficient and maintainable.

#### Acceptance Criteria

1. THE search_index view SHALL aggregate searchable data from customers, projects, proforma_job_orders, job_orders, invoices, and vendors tables
2. THE search_index view SHALL include entity_type, entity_id, primary_text, secondary_text, url, and created_at columns
3. THE search_index view SHALL only include active records (is_active = TRUE where applicable)
4. THE global_search function SHALL accept search_query (TEXT) and max_results (INTEGER, default 20) parameters
5. THE global_search function SHALL perform case-insensitive matching on primary_text and secondary_text
