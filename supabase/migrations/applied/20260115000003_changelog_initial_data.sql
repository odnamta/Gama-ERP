-- Migration: Insert initial changelog entries
-- Task 1.3: Create initial data migration
-- Requirements: 8.1, 8.2, 8.3, 8.4

-- ============================================================================
-- INITIAL CHANGELOG DATA
-- Seed the changelog with existing release history
-- ============================================================================

-- Requirement 8.1: v0.33 GAMA ERP Launch (is_major: true)
INSERT INTO changelog_entries (version, title, description, category, is_major, published_at)
VALUES (
    'v0.33',
    'GAMA ERP Launch',
    'Initial release with Operations, Finance, HR modules. Dashboard for each role.',
    'feature',
    true,
    '2025-12-01T00:00:00Z'
);

-- Requirement 8.2: v0.34 Disbursement Module (BKK)
INSERT INTO changelog_entries (version, title, description, category, is_major, published_at)
VALUES (
    'v0.34',
    'Disbursement Module (BKK)',
    'Complete cash-out tracking with approval workflow.',
    'feature',
    false,
    '2025-12-15T00:00:00Z'
);

-- Requirement 8.3: v0.35 Agency & Customs Roles
INSERT INTO changelog_entries (version, title, description, category, is_major, published_at)
VALUES (
    'v0.35',
    'Agency & Customs Roles',
    'Added support for Agency and Customs departments with dedicated dashboards.',
    'feature',
    false,
    '2026-01-09T00:00:00Z'
);

-- Requirement 8.4: v0.36 User Onboarding Fix (bugfix)
INSERT INTO changelog_entries (version, title, description, category, is_major, published_at)
VALUES (
    'v0.36',
    'User Onboarding Fix',
    'Fixed issue where new users could not sign up via Google OAuth.',
    'bugfix',
    false,
    '2026-01-10T00:00:00Z'
);
