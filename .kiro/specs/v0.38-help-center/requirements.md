# Requirements Document

## Introduction

This document defines the requirements for the Help Center & Documentation feature (v0.38) in GAMA ERP. The feature provides an in-app help center with searchable documentation, FAQs, and contextual help to assist users in understanding and using the system effectively.

## Glossary

- **Help_Center**: The main module providing searchable documentation, FAQs, and contextual help
- **Help_Article**: A documentation entry containing title, content (markdown), category, and metadata
- **FAQ**: A frequently asked question with its answer, organized by category
- **Contextual_Help**: Help content relevant to the current page/route the user is viewing
- **Full_Text_Search**: PostgreSQL-based search functionality for finding relevant help content
- **Article_Slug**: A URL-friendly unique identifier for help articles

## Requirements

### Requirement 1: Help Articles Database Schema

**User Story:** As a system administrator, I want help articles stored in a structured database, so that content can be managed, searched, and displayed consistently.

#### Acceptance Criteria

1. THE Database SHALL store help articles with id, article_slug, title, summary, content, category, tags, applicable_roles, related_routes, related_articles, view_count, helpful_count, not_helpful_count, is_published, display_order, created_at, and updated_at fields
2. WHEN a help article is created, THE Database SHALL enforce article_slug uniqueness
3. THE Database SHALL support categories including 'getting_started', 'quotations', 'jobs', 'finance', 'hr', 'reports', and 'troubleshooting'
4. THE Database SHALL store content in markdown format
5. WHEN the database is initialized, THE System SHALL insert default help articles for getting started, creating quotations, and recording payments

### Requirement 2: FAQs Database Schema

**User Story:** As a system administrator, I want FAQs stored in a structured database, so that common questions can be managed and displayed to users.

#### Acceptance Criteria

1. THE Database SHALL store FAQs with id, question, answer, category, applicable_roles, display_order, and created_at fields
2. WHEN the database is initialized, THE System SHALL insert default FAQs covering password reset, revenue visibility, invoice splitting, BKK explanation, and engineering flags

### Requirement 3: Full-Text Search Indexes

**User Story:** As a user, I want help content to be searchable, so that I can quickly find relevant information.

#### Acceptance Criteria

1. THE Database SHALL create a full-text search index on help_articles combining title, summary, and content fields
2. THE Database SHALL create a full-text search index on help_faqs combining question and answer fields
3. WHEN a search query is executed, THE Search_Engine SHALL use PostgreSQL's to_tsvector for English language tokenization

### Requirement 4: Help Center Main Page

**User Story:** As a user, I want a central help center page, so that I can browse and discover help content.

#### Acceptance Criteria

1. WHEN a user navigates to /help, THE Help_Center SHALL display a search input prominently at the top
2. THE Help_Center SHALL display quick links for Getting Started, Guided Tours, and Keyboard Shortcuts
3. THE Help_Center SHALL display category cards showing category name and article count for each category
4. THE Help_Center SHALL display a list of frequently asked questions in an expandable accordion format
5. THE Help_Center SHALL display a "View All FAQs" link to see all questions
6. THE Help_Center SHALL display contact information for additional support

### Requirement 5: Help Article Search

**User Story:** As a user, I want to search help articles, so that I can find specific information quickly.

#### Acceptance Criteria

1. WHEN a user enters a search query, THE Search_Engine SHALL perform full-text search across help articles and FAQs
2. WHEN search results are returned, THE Help_Center SHALL rank results by relevance
3. WHEN search results are displayed, THE Help_Center SHALL highlight matching search terms in the results
4. WHEN no search results are found, THE Help_Center SHALL display a helpful message suggesting alternative actions

### Requirement 6: Help Article Display

**User Story:** As a user, I want to read help articles with proper formatting, so that I can understand the content easily.

#### Acceptance Criteria

1. WHEN a user views a help article, THE Help_Center SHALL render markdown content with proper formatting including headings, lists, code blocks, and emphasis
2. WHEN a user views a help article, THE Help_Center SHALL display the article title and summary
3. WHEN a user views a help article, THE Help_Center SHALL display related articles if any exist
4. WHEN a user views a help article, THE Help_Center SHALL increment the view_count
5. THE Help_Center SHALL provide "Was this helpful?" feedback buttons (helpful/not helpful)
6. WHEN a user clicks a feedback button, THE Help_Center SHALL update the appropriate count (helpful_count or not_helpful_count)

### Requirement 7: FAQ Display

**User Story:** As a user, I want to browse FAQs in an expandable format, so that I can quickly scan questions and view answers.

#### Acceptance Criteria

1. THE Help_Center SHALL display FAQs grouped by category
2. WHEN a user clicks on a FAQ question, THE Help_Center SHALL expand to show the answer
3. WHEN a user clicks on an expanded FAQ, THE Help_Center SHALL collapse the answer
4. THE Help_Center SHALL display FAQs in display_order within each category

### Requirement 8: Contextual Help

**User Story:** As a user, I want to see help relevant to my current page, so that I can get assistance without leaving my workflow.

#### Acceptance Criteria

1. THE Help_Center SHALL provide a help button accessible from all pages
2. WHEN a user clicks the contextual help button, THE Help_Center SHALL display articles where related_routes includes the current page route
3. WHEN no contextual articles exist for the current route, THE Help_Center SHALL display general help options
4. THE Contextual_Help SHALL link to full articles in the help center

### Requirement 9: Role-Based Article Visibility

**User Story:** As a user, I want to see only help content relevant to my role, so that I'm not overwhelmed with irrelevant information.

#### Acceptance Criteria

1. WHEN displaying help articles, THE Help_Center SHALL filter articles based on the user's role matching applicable_roles
2. WHEN displaying FAQs, THE Help_Center SHALL filter FAQs based on the user's role matching applicable_roles
3. IF a user's role is not in applicable_roles, THEN THE Help_Center SHALL hide that content from the user

### Requirement 10: Category Browsing

**User Story:** As a user, I want to browse help articles by category, so that I can explore related topics.

#### Acceptance Criteria

1. WHEN a user clicks on a category card, THE Help_Center SHALL display all published articles in that category
2. THE Help_Center SHALL display articles sorted by display_order within each category
3. THE Help_Center SHALL show article title, summary, and tags for each article in the category view
