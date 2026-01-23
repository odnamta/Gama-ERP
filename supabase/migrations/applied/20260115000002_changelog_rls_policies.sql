-- Migration: Create RLS policies for changelog_entries
-- Task 1.2: Create RLS policies migration
-- Requirements: 2.1, 2.2, 2.3, 2.4

-- ============================================================================
-- RLS POLICIES FOR CHANGELOG_ENTRIES
-- Read: All authenticated users
-- Write: Only owner, director, sysadmin roles
-- ============================================================================

-- Requirement 2.1: All authenticated users can read changelog entries
CREATE POLICY "Authenticated users can read changelog"
ON changelog_entries FOR SELECT
TO authenticated
USING (true);

-- Requirement 2.2: Only admins can insert changelog entries
CREATE POLICY "Admins can insert changelog"
ON changelog_entries FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.role IN ('owner', 'director', 'sysadmin')
    )
);

-- Requirement 2.3: Only admins can update changelog entries
CREATE POLICY "Admins can update changelog"
ON changelog_entries FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.role IN ('owner', 'director', 'sysadmin')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.role IN ('owner', 'director', 'sysadmin')
    )
);

-- Requirement 2.4: Only admins can delete changelog entries
CREATE POLICY "Admins can delete changelog"
ON changelog_entries FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.role IN ('owner', 'director', 'sysadmin')
    )
);

-- Grant permissions
GRANT SELECT ON changelog_entries TO authenticated;
GRANT ALL ON changelog_entries TO service_role;
