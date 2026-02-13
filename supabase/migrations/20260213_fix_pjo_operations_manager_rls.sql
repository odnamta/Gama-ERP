-- Fix: Add operations_manager to PJO INSERT and UPDATE policies
-- Bug: operations_manager could not update or create PJOs despite having permissions in app code
-- Root cause: entity_type RLS policies (20260109) only included administration/finance_manager/finance

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert PJOs based on entity_type" ON proforma_job_orders;
DROP POLICY IF EXISTS "Users can update PJOs based on entity_type" ON proforma_job_orders;

-- Recreate INSERT policy with operations_manager
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
      AND role IN ('administration', 'finance_manager', 'operations_manager', 'marketing_manager')
    ) THEN entity_type = 'gama_main'

    ELSE FALSE
  END
);

-- Recreate UPDATE policy with operations_manager
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
      AND role IN ('administration', 'finance_manager', 'finance', 'operations_manager', 'marketing_manager')
    ) THEN entity_type = 'gama_main'

    ELSE FALSE
  END
);
