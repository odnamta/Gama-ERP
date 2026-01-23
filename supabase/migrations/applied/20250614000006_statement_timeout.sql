-- Migration: Statement Timeout Configuration
-- Task 8.1: Apply statement timeout configuration
-- Requirements: 8.1, 8.2

-- ============================================================================
-- STATEMENT TIMEOUT
-- Enforce a 30-second timeout for all queries to prevent long-running queries
-- from blocking the system
-- ============================================================================

-- Set statement timeout to 30 seconds for the database
-- This applies to all new connections
ALTER DATABASE postgres SET statement_timeout = '30s';

-- Note: This setting will apply to new connections.
-- Existing connections will need to reconnect to pick up the change.
