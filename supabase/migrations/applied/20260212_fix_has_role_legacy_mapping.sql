-- ============================================================================
-- Migration: Fix has_role() Legacy Role Name Mapping
-- Date: 2026-02-12
-- Status: APPLIED via Supabase Management API
-- Purpose: Instead of rewriting 496 RLS policies individually, modify the
--          has_role() function to map new role names to legacy equivalents.
--          This instantly fixes all policies across 189 tables.
-- ============================================================================
-- Problem:
--   496 of 776 RLS policies (64%) across 189 tables use legacy role names:
--     - 'admin'       (should be 'sysadmin')
--     - 'super_admin' (should be 'director')
--     - 'manager'     (should be 'marketing_manager', 'finance_manager', 'operations_manager')
--
-- Solution:
--   Add legacy role mapping to has_role() so new role names also match
--   their legacy equivalents in policy checks.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.has_role(allowed_roles text[])
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_role text;
BEGIN
  -- Get role from JWT app_metadata (synced on login)
  user_role := (auth.jwt() -> 'app_metadata' ->> 'role');

  -- Fallback: query user_profiles with SECURITY DEFINER (bypasses RLS)
  IF user_role IS NULL THEN
    SELECT role INTO user_role
    FROM public.user_profiles
    WHERE user_id = auth.uid();
  END IF;

  -- Direct match
  IF user_role = ANY(allowed_roles) THEN
    RETURN true;
  END IF;

  -- Legacy role name compatibility
  -- sysadmin was previously 'admin'
  -- director was previously 'super_admin'
  -- marketing_manager/finance_manager/operations_manager were previously 'manager'
  IF user_role = 'sysadmin' AND 'admin' = ANY(allowed_roles) THEN
    RETURN true;
  ELSIF user_role = 'director' AND 'super_admin' = ANY(allowed_roles) THEN
    RETURN true;
  ELSIF user_role IN ('marketing_manager', 'finance_manager', 'operations_manager') AND 'manager' = ANY(allowed_roles) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$function$;
