-- Migration: Partial Indexes for Performance Optimization
-- Task 1.2: Apply partial indexes migration
-- Requirements: 1.5, 1.6

-- ============================================================================
-- PARTIAL INDEXES
-- These indexes only include rows matching a specified condition,
-- making them smaller and faster for queries on active records
-- ============================================================================

-- Index for active customers by name
-- Optimizes: Fetching active customers for dropdowns and searches
-- Common query: SELECT * FROM customers WHERE is_active = true ORDER BY name
CREATE INDEX IF NOT EXISTS idx_active_customers 
    ON customers (name) 
    WHERE is_active = true;

-- Index for active employees by full_name
-- Optimizes: Fetching active employees for dropdowns and searches
-- Common query: SELECT * FROM employees WHERE status = 'active' ORDER BY full_name
CREATE INDEX IF NOT EXISTS idx_active_employees 
    ON employees (full_name) 
    WHERE status = 'active';
