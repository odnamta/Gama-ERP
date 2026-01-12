-- =====================================================
-- IMMEDIATE FIX: Create profile for Feri Supriono
-- His auth account exists but no user_profiles record
-- Date: 2026-01-12
-- =====================================================

-- First, let's check if Feri's auth account exists and get his user_id
-- This query will help us identify the auth.users record
-- Run this in Supabase SQL Editor to see Feri's user_id:
-- SELECT id, email, created_at FROM auth.users WHERE email = 'ferisupriono@gama-group.co';

-- Once you have Feri's user_id from auth.users, create his profile
-- REPLACE 'PUT_FERI_USER_ID_HERE' with the actual UUID from the query above

-- Example (you need to run the SELECT query first to get the real UUID):
/*
INSERT INTO user_profiles (
  user_id,
  email,
  full_name,
  role,
  department_scope,
  custom_dashboard,
  -- Finance Manager permissions
  can_see_revenue,
  can_see_profit,
  can_approve_pjo,
  can_manage_invoices,
  can_manage_users,
  can_create_pjo,
  can_fill_costs,
  is_active,
  last_login_at
) VALUES (
  'PUT_FERI_USER_ID_HERE'::uuid,  -- Replace with actual UUID from auth.users
  'ferisupriono@gama-group.co',
  'Feri Supriono',
  'finance_manager',
  '{}',
  'manager',
  -- Finance Manager default permissions
  true,   -- can_see_revenue
  true,   -- can_see_profit
  true,   -- can_approve_pjo
  true,   -- can_manage_invoices
  false,  -- can_manage_users (typically false for managers)
  true,   -- can_create_pjo
  true,   -- can_fill_costs
  true,   -- is_active
  NOW()   -- last_login_at
)
ON CONFLICT (user_id) DO NOTHING;  -- Safety: don't create duplicate if already exists
*/

-- =====================================================
-- Instructions for manual execution:
-- =====================================================
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Run: SELECT id, email, created_at FROM auth.users WHERE email = 'ferisupriono@gama-group.co';
-- 3. Copy the 'id' (UUID) from the result
-- 4. Uncomment the INSERT statement above
-- 5. Replace 'PUT_FERI_USER_ID_HERE' with the actual UUID
-- 6. Execute the INSERT statement
-- =====================================================

-- Note: After the RLS policy fix (20260112_fix_user_profiles_self_registration.sql),
-- this type of issue won't happen again for new users
