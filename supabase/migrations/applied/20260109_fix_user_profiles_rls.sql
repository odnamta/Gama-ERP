-- =====================================================
-- FIX: Add RLS Policies for user_profiles Table
-- Issue: No INSERT policy exists, blocking user creation
-- Date: 2026-01-09
-- =====================================================

-- Enable RLS on user_profiles if not already enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies (clean slate)
DROP POLICY IF EXISTS "user_profiles_select_policy" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_policy" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_policy" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_delete_policy" ON user_profiles;

-- SELECT: Users can view their own profile + users with can_manage_users can see all
CREATE POLICY "user_profiles_select_policy" ON user_profiles
FOR SELECT TO authenticated
USING (
  -- Users can see their own profile
  user_id = auth.uid()

  -- Users with can_manage_users permission can see all profiles
  OR EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = auth.uid()
    AND up.can_manage_users = true
  )

  -- Owner and director can see all
  OR EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = auth.uid()
    AND up.role IN ('owner', 'director', 'sysadmin')
  )
);

-- INSERT: Users with can_manage_users permission can create new profiles
CREATE POLICY "user_profiles_insert_policy" ON user_profiles
FOR INSERT TO authenticated
WITH CHECK (
  -- Users with can_manage_users permission
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = auth.uid()
    AND up.can_manage_users = true
  )

  -- Or owner/director/sysadmin roles
  OR EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = auth.uid()
    AND up.role IN ('owner', 'director', 'sysadmin')
  )
);

-- UPDATE: Users can update their own profile + users with can_manage_users can update all
CREATE POLICY "user_profiles_update_policy" ON user_profiles
FOR UPDATE TO authenticated
USING (
  -- Users can update their own profile
  user_id = auth.uid()

  -- Users with can_manage_users permission can update all profiles
  OR EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = auth.uid()
    AND up.can_manage_users = true
  )

  -- Owner and director can update all
  OR EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = auth.uid()
    AND up.role IN ('owner', 'director', 'sysadmin')
  )
)
WITH CHECK (
  -- Same conditions for the updated state
  user_id = auth.uid()

  OR EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = auth.uid()
    AND up.can_manage_users = true
  )

  OR EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = auth.uid()
    AND up.role IN ('owner', 'director', 'sysadmin')
  )
);

-- DELETE: Only owner can delete profiles
CREATE POLICY "user_profiles_delete_policy" ON user_profiles
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = auth.uid()
    AND up.role = 'owner'
  )
);

-- Add comment for documentation
COMMENT ON TABLE user_profiles IS 'User profiles with role-based permissions. RLS policies control access based on can_manage_users permission and role.';
