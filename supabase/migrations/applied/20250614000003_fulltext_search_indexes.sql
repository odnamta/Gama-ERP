-- Migration: Full-Text Search Indexes for Performance Optimization
-- Task 1.3: Apply full-text search indexes migration
-- Requirements: 2.1, 2.2

-- ============================================================================
-- FULL-TEXT SEARCH INDEXES (GIN)
-- GIN indexes enable efficient full-text search across text columns
-- ============================================================================

-- Enable pg_trgm extension for trigram-based text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index for customer search by name
-- Optimizes: Full-text search on customer name
-- Common query: SELECT * FROM customers WHERE name ILIKE '%search%'
CREATE INDEX IF NOT EXISTS idx_customers_search 
    ON customers USING gin (name gin_trgm_ops);

-- Index for job_orders search by jo_number and description
-- Optimizes: Full-text search on job order number and description
-- Common query: SELECT * FROM job_orders WHERE jo_number ILIKE '%search%' OR description ILIKE '%search%'
CREATE INDEX IF NOT EXISTS idx_job_orders_search_number 
    ON job_orders USING gin (jo_number gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_job_orders_search_description 
    ON job_orders USING gin (description gin_trgm_ops);
