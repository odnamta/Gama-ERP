-- Migration: Tighten Financial Table RLS — Exclude ops from SELECT
-- Date: 2026-02-21
-- Purpose: ops staff must not see invoices, payments, or vendor_payments
--          (prevents them from inferring revenue/profit margins)
-- Business rule: ops gets a budget via BKK; knowing revenue lets them spend to the profit line

-- Drop the overly permissive policies that allowed any authenticated user
DROP POLICY IF EXISTS "invoices_select" ON public.invoices;
DROP POLICY IF EXISTS "payments_select" ON public.payments;
DROP POLICY IF EXISTS "vendor_payments_select" ON public.vendor_payments;

-- Recreate with role-based restriction (exclude ops)
CREATE POLICY "invoices_select" ON public.invoices
  FOR SELECT USING (
    has_role(ARRAY[
      'owner', 'director', 'sysadmin',
      'finance_manager', 'finance',
      'marketing_manager', 'marketing',
      'operations_manager', 'administration',
      'hr', 'hse', 'agency', 'customs', 'engineer'
    ])
  );

CREATE POLICY "payments_select" ON public.payments
  FOR SELECT USING (
    has_role(ARRAY[
      'owner', 'director', 'sysadmin',
      'finance_manager', 'finance',
      'marketing_manager', 'marketing',
      'operations_manager', 'administration',
      'hr', 'hse', 'agency', 'customs', 'engineer'
    ])
  );

CREATE POLICY "vendor_payments_select" ON public.vendor_payments
  FOR SELECT USING (
    has_role(ARRAY[
      'owner', 'director', 'sysadmin',
      'finance_manager', 'finance',
      'marketing_manager', 'marketing',
      'operations_manager', 'administration',
      'hr', 'hse', 'agency', 'customs', 'engineer'
    ])
  );
