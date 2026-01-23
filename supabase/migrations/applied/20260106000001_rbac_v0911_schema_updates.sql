-- RBAC v0.9.11 Schema Updates
-- Migration: Update user_profiles for 11 roles, add department_scope, workflow columns

-- ============================================
-- 1. Update user_profiles table
-- ============================================

-- Add department_scope column for managers
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS department_scope TEXT[] DEFAULT '{}';

-- Drop existing role constraint
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_role_check;

-- Add new role constraint with all 11 roles
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_role_check 
CHECK (role IN (
  'owner',
  'director',
  'manager',
  'sysadmin',
  'administration',
  'finance',
  'marketing',
  'ops',
  'engineer',
  'hr',
  'hse'
));

-- Drop existing custom_dashboard constraint
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_custom_dashboard_check;

-- Add new custom_dashboard constraint
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_custom_dashboard_check 
CHECK (custom_dashboard IN (
  'executive',
  'manager',
  'marketing',
  'admin_finance',
  'operations',
  'engineering',
  'hr',
  'hse',
  'sysadmin',
  'default',
  -- Legacy values for backward compatibility
  'owner',
  'admin',
  'ops',
  'finance',
  'sales',
  'viewer'
));

-- Add new permission columns
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS can_check_pjo BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_check_jo BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_check_bkk BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_approve_jo BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_approve_bkk BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_estimate_costs BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_see_actual_costs BOOLEAN DEFAULT true;

-- ============================================
-- 2. Add workflow columns to proforma_job_orders
-- ============================================

ALTER TABLE proforma_job_orders
ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS checked_by UUID REFERENCES user_profiles(id),
ADD COLUMN IF NOT EXISTS checked_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES user_profiles(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES user_profiles(id),
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add constraint for workflow_status
ALTER TABLE proforma_job_orders
DROP CONSTRAINT IF EXISTS pjo_workflow_status_check;

ALTER TABLE proforma_job_orders
ADD CONSTRAINT pjo_workflow_status_check
CHECK (workflow_status IN ('draft', 'checked', 'approved', 'rejected'));


-- ============================================
-- 3. Add workflow columns to job_orders
-- ============================================

ALTER TABLE job_orders
ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS checked_by UUID REFERENCES user_profiles(id),
ADD COLUMN IF NOT EXISTS checked_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES user_profiles(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES user_profiles(id),
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add constraint for workflow_status
ALTER TABLE job_orders
DROP CONSTRAINT IF EXISTS jo_workflow_status_check;

ALTER TABLE job_orders
ADD CONSTRAINT jo_workflow_status_check
CHECK (workflow_status IN ('draft', 'checked', 'approved', 'rejected'));

-- ============================================
-- 4. Create disbursements (BKK) table
-- ============================================

CREATE TABLE IF NOT EXISTS disbursements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bkk_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- References
  job_order_id UUID REFERENCES job_orders(id),
  vendor_id UUID,
  vendor_invoice_id UUID,
  
  -- Financial details
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'IDR',
  description TEXT,
  payment_method VARCHAR(50),
  bank_account VARCHAR(100),
  reference_number VARCHAR(100),
  
  -- Workflow
  workflow_status VARCHAR(20) DEFAULT 'draft',
  created_by UUID REFERENCES user_profiles(id),
  checked_by UUID REFERENCES user_profiles(id),
  checked_at TIMESTAMP,
  approved_by UUID REFERENCES user_profiles(id),
  approved_at TIMESTAMP,
  rejected_by UUID REFERENCES user_profiles(id),
  rejected_at TIMESTAMP,
  rejection_reason TEXT,
  
  -- Payment execution
  paid_at TIMESTAMP,
  paid_by UUID REFERENCES user_profiles(id),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Soft delete
  is_active BOOLEAN DEFAULT true
);

-- Add constraint for workflow_status
ALTER TABLE disbursements
ADD CONSTRAINT bkk_workflow_status_check
CHECK (workflow_status IN ('draft', 'checked', 'approved', 'rejected', 'paid'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_disbursements_job_order ON disbursements(job_order_id);
CREATE INDEX IF NOT EXISTS idx_disbursements_vendor ON disbursements(vendor_id);
CREATE INDEX IF NOT EXISTS idx_disbursements_status ON disbursements(workflow_status);
CREATE INDEX IF NOT EXISTS idx_disbursements_created ON disbursements(created_at DESC);

-- ============================================
-- 5. Create audit_logs table
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  user_role VARCHAR(50) NOT NULL,
  
  -- What
  action VARCHAR(100) NOT NULL,
  module VARCHAR(50) NOT NULL,
  
  -- Which record
  record_id UUID,
  record_type VARCHAR(50),
  record_number VARCHAR(100),
  
  -- Changes (for updates)
  old_values JSONB,
  new_values JSONB,
  changes_summary TEXT,
  
  -- Context
  ip_address VARCHAR(45),
  user_agent TEXT,
  session_id VARCHAR(255),
  
  -- Workflow context
  workflow_status_from VARCHAR(50),
  workflow_status_to VARCHAR(50),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_record ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_module ON audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_record_type ON audit_logs(record_type, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_module_action ON audit_logs(module, action, created_at DESC);

-- Prevent modifications to audit_logs (tamper-proof)
-- Note: This is enforced via RLS policies, not triggers, for Supabase compatibility

-- ============================================
-- 6. Enable RLS on new tables
-- ============================================

ALTER TABLE disbursements ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Disbursements policies
CREATE POLICY "Users can view disbursements based on role" ON disbursements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role IN ('owner', 'director', 'manager', 'administration', 'finance')
    )
  );

CREATE POLICY "Administration and finance can create disbursements" ON disbursements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role IN ('owner', 'director', 'manager', 'administration', 'finance')
    )
  );

CREATE POLICY "Administration and finance can update disbursements" ON disbursements
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role IN ('owner', 'director', 'manager', 'administration', 'finance')
    )
  );

-- Audit logs policies (read-only for most users)
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role IN ('owner', 'director', 'sysadmin')
    )
  );

CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- No UPDATE or DELETE policies for audit_logs (tamper-proof)

-- ============================================
-- 7. Create function to generate BKK number
-- ============================================

CREATE OR REPLACE FUNCTION generate_bkk_number()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  current_month TEXT;
  next_seq INT;
  new_number TEXT;
BEGIN
  current_year := TO_CHAR(NOW(), 'YYYY');
  current_month := TO_CHAR(NOW(), 'MM');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(bkk_number FROM 'BKK-(\d+)/') AS INT)
  ), 0) + 1
  INTO next_seq
  FROM disbursements
  WHERE bkk_number LIKE 'BKK-%/' || current_month || '/' || current_year;
  
  new_number := 'BKK-' || LPAD(next_seq::TEXT, 4, '0') || '/' || current_month || '/' || current_year;
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE disbursements IS 'BKK (Bukti Kas Keluar) - Cash disbursement records with Maker-Checker-Approver workflow';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for all system actions - tamper-proof';
