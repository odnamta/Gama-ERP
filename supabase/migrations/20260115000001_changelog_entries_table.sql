-- Migration: Create changelog_entries table
-- Task 1.1: Create changelog_entries table migration
-- Requirements: 1.1, 1.2, 1.3, 1.4

-- ============================================================================
-- CHANGELOG ENTRIES TABLE
-- Stores system changelog entries for the "What's New" feature
-- ============================================================================

-- Create the update_updated_at_column function if it doesn't exist
-- This function is used by triggers to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create changelog_entries table
-- Requirement 1.1: Table with all required columns
CREATE TABLE IF NOT EXISTS changelog_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version TEXT,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'feature' CHECK (category IN ('feature', 'improvement', 'bugfix', 'security')),
    is_major BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Requirement 1.2: Index for efficient ordering by published_at
CREATE INDEX IF NOT EXISTS idx_changelog_published_at ON changelog_entries(published_at DESC);

-- Requirement 1.3: Category CHECK constraint is included in table definition above
-- Valid values: 'feature', 'improvement', 'bugfix', 'security'

-- Trigger for automatically updating updated_at on row updates
CREATE TRIGGER update_changelog_entries_updated_at
    BEFORE UPDATE ON changelog_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Requirement 1.4: Enable Row Level Security
ALTER TABLE changelog_entries ENABLE ROW LEVEL SECURITY;

-- Add comment for documentation
COMMENT ON TABLE changelog_entries IS 'Stores system changelog entries for the What''s New feature';
COMMENT ON COLUMN changelog_entries.version IS 'Version number (e.g., v0.33)';
COMMENT ON COLUMN changelog_entries.title IS 'Title of the changelog entry';
COMMENT ON COLUMN changelog_entries.description IS 'Detailed description, supports markdown';
COMMENT ON COLUMN changelog_entries.category IS 'Category: feature, improvement, bugfix, or security';
COMMENT ON COLUMN changelog_entries.is_major IS 'Flag for major updates that should be highlighted';
COMMENT ON COLUMN changelog_entries.published_at IS 'When the entry was published (for ordering)';
COMMENT ON COLUMN changelog_entries.created_by IS 'User who created the entry';
