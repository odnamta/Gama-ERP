-- Migration: Add entity_type column for soft multi-tenancy
-- Purpose: Separate Gama Main (logistics) and Gama Agency (shipping) operations
-- Date: 2026-01-09

-- ============================================================================
-- STEP 1: Add entity_type column to core business tables
-- ============================================================================

-- Customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS entity_type VARCHAR(20) DEFAULT 'gama_main' NOT NULL;

-- Quotations table
ALTER TABLE quotations
ADD COLUMN IF NOT EXISTS entity_type VARCHAR(20) DEFAULT 'gama_main' NOT NULL;

-- Proforma Job Orders (PJO) table
ALTER TABLE proforma_job_orders
ADD COLUMN IF NOT EXISTS entity_type VARCHAR(20) DEFAULT 'gama_main' NOT NULL;

-- Job Orders (JO) table
ALTER TABLE job_orders
ADD COLUMN IF NOT EXISTS entity_type VARCHAR(20) DEFAULT 'gama_main' NOT NULL;

-- Invoices table
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS entity_type VARCHAR(20) DEFAULT 'gama_main' NOT NULL;

-- BKK (Disbursements) table
ALTER TABLE bkk_records
ADD COLUMN IF NOT EXISTS entity_type VARCHAR(20) DEFAULT 'gama_main' NOT NULL;

-- Payments table
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS entity_type VARCHAR(20) DEFAULT 'gama_main' NOT NULL;

-- ============================================================================
-- STEP 2: Add check constraints to ensure valid entity_type values
-- ============================================================================

ALTER TABLE customers
ADD CONSTRAINT IF NOT EXISTS check_customers_entity_type
CHECK (entity_type IN ('gama_main', 'gama_agency'));

ALTER TABLE quotations
ADD CONSTRAINT IF NOT EXISTS check_quotations_entity_type
CHECK (entity_type IN ('gama_main', 'gama_agency'));

ALTER TABLE proforma_job_orders
ADD CONSTRAINT IF NOT EXISTS check_pjo_entity_type
CHECK (entity_type IN ('gama_main', 'gama_agency'));

ALTER TABLE job_orders
ADD CONSTRAINT IF NOT EXISTS check_jo_entity_type
CHECK (entity_type IN ('gama_main', 'gama_agency'));

ALTER TABLE invoices
ADD CONSTRAINT IF NOT EXISTS check_invoices_entity_type
CHECK (entity_type IN ('gama_main', 'gama_agency'));

ALTER TABLE bkk_records
ADD CONSTRAINT IF NOT EXISTS check_bkk_entity_type
CHECK (entity_type IN ('gama_main', 'gama_agency'));

ALTER TABLE payments
ADD CONSTRAINT IF NOT EXISTS check_payments_entity_type
CHECK (entity_type IN ('gama_main', 'gama_agency'));

-- ============================================================================
-- STEP 3: Add indexes for query performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_customers_entity_type ON customers(entity_type);
CREATE INDEX IF NOT EXISTS idx_quotations_entity_type ON quotations(entity_type);
CREATE INDEX IF NOT EXISTS idx_pjo_entity_type ON proforma_job_orders(entity_type);
CREATE INDEX IF NOT EXISTS idx_jo_entity_type ON job_orders(entity_type);
CREATE INDEX IF NOT EXISTS idx_invoices_entity_type ON invoices(entity_type);
CREATE INDEX IF NOT EXISTS idx_bkk_entity_type ON bkk_records(entity_type);
CREATE INDEX IF NOT EXISTS idx_payments_entity_type ON payments(entity_type);

-- ============================================================================
-- STEP 4: Set agency-specific tables to 'gama_agency' by default
-- ============================================================================

-- Shipping Lines
ALTER TABLE shipping_lines
ADD COLUMN IF NOT EXISTS entity_type VARCHAR(20) DEFAULT 'gama_agency' NOT NULL;

ALTER TABLE shipping_lines
ADD CONSTRAINT IF NOT EXISTS check_shipping_lines_entity_type
CHECK (entity_type = 'gama_agency');

-- Bookings
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS entity_type VARCHAR(20) DEFAULT 'gama_agency' NOT NULL;

ALTER TABLE bookings
ADD CONSTRAINT IF NOT EXISTS check_bookings_entity_type
CHECK (entity_type = 'gama_agency');

-- Bill of Lading Documentation
ALTER TABLE bl_documentation
ADD COLUMN IF NOT EXISTS entity_type VARCHAR(20) DEFAULT 'gama_agency' NOT NULL;

ALTER TABLE bl_documentation
ADD CONSTRAINT IF NOT EXISTS check_bl_entity_type
CHECK (entity_type = 'gama_agency');

-- Manifests
ALTER TABLE manifests
ADD COLUMN IF NOT EXISTS entity_type VARCHAR(20) DEFAULT 'gama_agency' NOT NULL;

ALTER TABLE manifests
ADD CONSTRAINT IF NOT EXISTS check_manifests_entity_type
CHECK (entity_type = 'gama_agency');

-- Vessel Schedules
ALTER TABLE vessel_schedules
ADD COLUMN IF NOT EXISTS entity_type VARCHAR(20) DEFAULT 'gama_agency' NOT NULL;

ALTER TABLE vessel_schedules
ADD CONSTRAINT IF NOT EXISTS check_vessel_schedules_entity_type
CHECK (entity_type = 'gama_agency');

-- Container Tracking
ALTER TABLE container_tracking
ADD COLUMN IF NOT EXISTS entity_type VARCHAR(20) DEFAULT 'gama_agency' NOT NULL;

ALTER TABLE container_tracking
ADD CONSTRAINT IF NOT EXISTS check_container_tracking_entity_type
CHECK (entity_type = 'gama_agency');

-- Port Agents
ALTER TABLE port_agents
ADD COLUMN IF NOT EXISTS entity_type VARCHAR(20) DEFAULT 'gama_agency' NOT NULL;

ALTER TABLE port_agents
ADD CONSTRAINT IF NOT EXISTS check_port_agents_entity_type
CHECK (entity_type = 'gama_agency');

-- Service Providers
ALTER TABLE service_providers
ADD COLUMN IF NOT EXISTS entity_type VARCHAR(20) DEFAULT 'gama_agency' NOT NULL;

ALTER TABLE service_providers
ADD CONSTRAINT IF NOT EXISTS check_service_providers_entity_type
CHECK (entity_type = 'gama_agency');

-- Shipping Rates
ALTER TABLE shipping_rates
ADD COLUMN IF NOT EXISTS entity_type VARCHAR(20) DEFAULT 'gama_agency' NOT NULL;

ALTER TABLE shipping_rates
ADD CONSTRAINT IF NOT EXISTS check_shipping_rates_entity_type
CHECK (entity_type = 'gama_agency');

-- ============================================================================
-- STEP 5: Add comments for documentation
-- ============================================================================

COMMENT ON COLUMN customers.entity_type IS 'Entity separation: gama_main (logistics) or gama_agency (shipping)';
COMMENT ON COLUMN quotations.entity_type IS 'Entity separation: gama_main (logistics) or gama_agency (shipping)';
COMMENT ON COLUMN proforma_job_orders.entity_type IS 'Entity separation: gama_main (logistics) or gama_agency (shipping)';
COMMENT ON COLUMN job_orders.entity_type IS 'Entity separation: gama_main (logistics) or gama_agency (shipping)';
COMMENT ON COLUMN invoices.entity_type IS 'Entity separation: gama_main (logistics) or gama_agency (shipping)';
COMMENT ON COLUMN bkk_records.entity_type IS 'Entity separation: gama_main (logistics) or gama_agency (shipping)';
COMMENT ON COLUMN payments.entity_type IS 'Entity separation: gama_main (logistics) or gama_agency (shipping)';
