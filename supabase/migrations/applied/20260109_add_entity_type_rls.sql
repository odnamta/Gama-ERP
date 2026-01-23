-- Migration: RLS Policies for entity_type Multi-Tenancy
-- Purpose: Enforce data isolation between Gama Main and Gama Agency
-- Date: 2026-01-09

-- ============================================================================
-- POLICY LOGIC:
-- - Owner/Director: See ALL entities (gama_main + gama_agency)
-- - Agency role: See ONLY gama_agency
-- - All other roles: See ONLY gama_main
-- ============================================================================

-- ============================================================================
-- CUSTOMERS TABLE
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view customers based on role" ON customers;
DROP POLICY IF EXISTS "Users can insert customers based on role" ON customers;
DROP POLICY IF EXISTS "Users can update customers based on role" ON customers;
DROP POLICY IF EXISTS "Users can delete customers based on role" ON customers;

-- SELECT policy
CREATE POLICY "Users can view customers based on entity_type" ON customers
FOR SELECT USING (
  CASE
    -- Owner/Director see everything
    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'director')
    ) THEN TRUE

    -- Agency role sees only gama_agency
    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role = 'agency'
    ) THEN entity_type = 'gama_agency'

    -- All other roles see only gama_main
    ELSE entity_type = 'gama_main'
  END
);

-- INSERT policy
CREATE POLICY "Users can insert customers based on entity_type" ON customers
FOR INSERT WITH CHECK (
  CASE
    -- Owner/Director can insert to any entity
    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'director')
    ) THEN TRUE

    -- Agency role can only insert gama_agency
    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role = 'agency'
    ) THEN entity_type = 'gama_agency'

    -- Marketing/Admin can only insert gama_main
    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('marketing', 'administration', 'marketing_manager')
    ) THEN entity_type = 'gama_main'

    ELSE FALSE
  END
);

-- UPDATE policy
CREATE POLICY "Users can update customers based on entity_type" ON customers
FOR UPDATE USING (
  CASE
    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'director')
    ) THEN TRUE

    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role = 'agency'
    ) THEN entity_type = 'gama_agency'

    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('marketing', 'administration', 'marketing_manager')
    ) THEN entity_type = 'gama_main'

    ELSE FALSE
  END
);

-- DELETE policy
CREATE POLICY "Users can delete customers based on entity_type" ON customers
FOR DELETE USING (
  CASE
    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'director')
    ) THEN TRUE

    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role = 'agency'
    ) THEN entity_type = 'gama_agency'

    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('marketing', 'administration', 'marketing_manager')
    ) THEN entity_type = 'gama_main'

    ELSE FALSE
  END
);

-- ============================================================================
-- QUOTATIONS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view quotations based on role" ON quotations;
DROP POLICY IF EXISTS "Users can insert quotations based on role" ON quotations;
DROP POLICY IF EXISTS "Users can update quotations based on role" ON quotations;
DROP POLICY IF EXISTS "Users can delete quotations based on role" ON quotations;

CREATE POLICY "Users can view quotations based on entity_type" ON quotations
FOR SELECT USING (
  CASE
    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'director')
    ) THEN TRUE

    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role = 'agency'
    ) THEN entity_type = 'gama_agency'

    ELSE entity_type = 'gama_main'
  END
);

CREATE POLICY "Users can insert quotations based on entity_type" ON quotations
FOR INSERT WITH CHECK (
  CASE
    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'director')
    ) THEN TRUE

    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role = 'agency'
    ) THEN entity_type = 'gama_agency'

    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('marketing', 'marketing_manager')
    ) THEN entity_type = 'gama_main'

    ELSE FALSE
  END
);

CREATE POLICY "Users can update quotations based on entity_type" ON quotations
FOR UPDATE USING (
  CASE
    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'director')
    ) THEN TRUE

    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role = 'agency'
    ) THEN entity_type = 'gama_agency'

    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('marketing', 'marketing_manager', 'administration')
    ) THEN entity_type = 'gama_main'

    ELSE FALSE
  END
);

CREATE POLICY "Users can delete quotations based on entity_type" ON quotations
FOR DELETE USING (
  CASE
    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'director')
    ) THEN TRUE

    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role = 'agency'
    ) THEN entity_type = 'gama_agency'

    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('marketing', 'marketing_manager')
    ) THEN entity_type = 'gama_main'

    ELSE FALSE
  END
);

-- ============================================================================
-- PROFORMA JOB ORDERS (PJO) TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view PJOs based on role" ON proforma_job_orders;
DROP POLICY IF EXISTS "Users can insert PJOs based on role" ON proforma_job_orders;
DROP POLICY IF EXISTS "Users can update PJOs based on role" ON proforma_job_orders;
DROP POLICY IF EXISTS "Users can delete PJOs based on role" ON proforma_job_orders;

CREATE POLICY "Users can view PJOs based on entity_type" ON proforma_job_orders
FOR SELECT USING (
  CASE
    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'director')
    ) THEN TRUE

    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role = 'agency'
    ) THEN entity_type = 'gama_agency'

    ELSE entity_type = 'gama_main'
  END
);

CREATE POLICY "Users can insert PJOs based on entity_type" ON proforma_job_orders
FOR INSERT WITH CHECK (
  CASE
    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'director')
    ) THEN TRUE

    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role = 'agency'
    ) THEN entity_type = 'gama_agency'

    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('administration', 'finance_manager')
    ) THEN entity_type = 'gama_main'

    ELSE FALSE
  END
);

CREATE POLICY "Users can update PJOs based on entity_type" ON proforma_job_orders
FOR UPDATE USING (
  CASE
    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'director')
    ) THEN TRUE

    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role = 'agency'
    ) THEN entity_type = 'gama_agency'

    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('administration', 'finance_manager', 'finance')
    ) THEN entity_type = 'gama_main'

    ELSE FALSE
  END
);

CREATE POLICY "Users can delete PJOs based on entity_type" ON proforma_job_orders
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'director')
  )
);

-- ============================================================================
-- JOB ORDERS (JO) TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view job orders based on role" ON job_orders;
DROP POLICY IF EXISTS "Users can insert job orders based on role" ON job_orders;
DROP POLICY IF EXISTS "Users can update job orders based on role" ON job_orders;
DROP POLICY IF EXISTS "Users can delete job orders based on role" ON job_orders;

CREATE POLICY "Users can view job orders based on entity_type" ON job_orders
FOR SELECT USING (
  CASE
    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'director')
    ) THEN TRUE

    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role = 'agency'
    ) THEN entity_type = 'gama_agency'

    ELSE entity_type = 'gama_main'
  END
);

CREATE POLICY "Users can insert job orders based on entity_type" ON job_orders
FOR INSERT WITH CHECK (
  CASE
    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'director')
    ) THEN TRUE

    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role = 'agency'
    ) THEN entity_type = 'gama_agency'

    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('administration', 'finance_manager')
    ) THEN entity_type = 'gama_main'

    ELSE FALSE
  END
);

CREATE POLICY "Users can update job orders based on entity_type" ON job_orders
FOR UPDATE USING (
  CASE
    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'director')
    ) THEN TRUE

    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role = 'agency'
    ) THEN entity_type = 'gama_agency'

    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('administration', 'finance_manager', 'ops', 'operations_manager')
    ) THEN entity_type = 'gama_main'

    ELSE FALSE
  END
);

CREATE POLICY "Users can delete job orders based on entity_type" ON job_orders
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'director')
  )
);

-- ============================================================================
-- INVOICES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view invoices based on role" ON invoices;
DROP POLICY IF EXISTS "Users can insert invoices based on role" ON invoices;
DROP POLICY IF EXISTS "Users can update invoices based on role" ON invoices;
DROP POLICY IF EXISTS "Users can delete invoices based on role" ON invoices;

CREATE POLICY "Users can view invoices based on entity_type" ON invoices
FOR SELECT USING (
  CASE
    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'director')
    ) THEN TRUE

    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role = 'agency'
    ) THEN entity_type = 'gama_agency'

    ELSE entity_type = 'gama_main'
  END
);

CREATE POLICY "Users can insert invoices based on entity_type" ON invoices
FOR INSERT WITH CHECK (
  CASE
    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'director')
    ) THEN TRUE

    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role = 'agency'
    ) THEN entity_type = 'gama_agency'

    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('administration', 'finance', 'finance_manager')
    ) THEN entity_type = 'gama_main'

    ELSE FALSE
  END
);

CREATE POLICY "Users can update invoices based on entity_type" ON invoices
FOR UPDATE USING (
  CASE
    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'director')
    ) THEN TRUE

    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role = 'agency'
    ) THEN entity_type = 'gama_agency'

    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('administration', 'finance', 'finance_manager')
    ) THEN entity_type = 'gama_main'

    ELSE FALSE
  END
);

CREATE POLICY "Users can delete invoices based on entity_type" ON invoices
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'director')
  )
);

-- ============================================================================
-- BKK RECORDS (DISBURSEMENTS) TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view BKK records based on role" ON bkk_records;
DROP POLICY IF EXISTS "Users can insert BKK records based on role" ON bkk_records;
DROP POLICY IF EXISTS "Users can update BKK records based on role" ON bkk_records;
DROP POLICY IF EXISTS "Users can delete BKK records based on role" ON bkk_records;

CREATE POLICY "Users can view BKK records based on entity_type" ON bkk_records
FOR SELECT USING (
  CASE
    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'director')
    ) THEN TRUE

    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role = 'agency'
    ) THEN entity_type = 'gama_agency'

    ELSE entity_type = 'gama_main'
  END
);

CREATE POLICY "Users can insert BKK records based on entity_type" ON bkk_records
FOR INSERT WITH CHECK (
  CASE
    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'director')
    ) THEN TRUE

    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role = 'agency'
    ) THEN entity_type = 'gama_agency'

    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('finance', 'finance_manager')
    ) THEN entity_type = 'gama_main'

    ELSE FALSE
  END
);

CREATE POLICY "Users can update BKK records based on entity_type" ON bkk_records
FOR UPDATE USING (
  CASE
    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'director')
    ) THEN TRUE

    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role = 'agency'
    ) THEN entity_type = 'gama_agency'

    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('finance', 'finance_manager')
    ) THEN entity_type = 'gama_main'

    ELSE FALSE
  END
);

CREATE POLICY "Users can delete BKK records based on entity_type" ON bkk_records
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'director')
  )
);

-- ============================================================================
-- PAYMENTS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view payments based on role" ON payments;
DROP POLICY IF EXISTS "Users can insert payments based on role" ON payments;
DROP POLICY IF EXISTS "Users can update payments based on role" ON payments;
DROP POLICY IF EXISTS "Users can delete payments based on role" ON payments;

CREATE POLICY "Users can view payments based on entity_type" ON payments
FOR SELECT USING (
  CASE
    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'director')
    ) THEN TRUE

    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role = 'agency'
    ) THEN entity_type = 'gama_agency'

    ELSE entity_type = 'gama_main'
  END
);

CREATE POLICY "Users can insert payments based on entity_type" ON payments
FOR INSERT WITH CHECK (
  CASE
    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'director')
    ) THEN TRUE

    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role = 'agency'
    ) THEN entity_type = 'gama_agency'

    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('finance', 'finance_manager')
    ) THEN entity_type = 'gama_main'

    ELSE FALSE
  END
);

CREATE POLICY "Users can update payments based on entity_type" ON payments
FOR UPDATE USING (
  CASE
    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'director')
    ) THEN TRUE

    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role = 'agency'
    ) THEN entity_type = 'gama_agency'

    WHEN EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('finance', 'finance_manager')
    ) THEN entity_type = 'gama_main'

    ELSE FALSE
  END
);

CREATE POLICY "Users can delete payments based on entity_type" ON payments
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'director')
  )
);
