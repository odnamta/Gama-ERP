-- Feedback System Tables Migration
-- Migration: 20251225000001_feedback_tables.sql
-- Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 8.3

-- ============================================================================
-- SEQUENCE: Ticket number generation
-- ============================================================================

-- Create sequence for ticket numbers (shared across all feedback types)
CREATE SEQUENCE IF NOT EXISTS feedback_ticket_seq START WITH 1 INCREMENT BY 1;

-- ============================================================================
-- TABLE: feedback_submissions
-- ============================================================================

CREATE TABLE IF NOT EXISTS feedback_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number VARCHAR(20) UNIQUE NOT NULL,
  feedback_type VARCHAR(20) NOT NULL CHECK (feedback_type IN ('bug', 'improvement', 'question', 'other')),
  
  -- Submitter info
  submitted_by UUID REFERENCES user_profiles(id),
  submitted_by_name VARCHAR(200),
  submitted_by_email VARCHAR(200),
  submitted_by_role VARCHAR(50),
  submitted_by_department VARCHAR(100),
  
  -- Bug-specific fields
  severity VARCHAR(20) CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  steps_to_reproduce TEXT,
  expected_behavior TEXT,
  actual_behavior TEXT,
  
  -- Improvement-specific fields
  current_behavior TEXT,
  desired_behavior TEXT,
  business_justification TEXT,
  
  -- Auto-captured context
  page_url VARCHAR(500),
  page_title VARCHAR(200),
  module VARCHAR(50),
  browser_info JSONB,
  screen_resolution VARCHAR(20),
  
  -- Screenshots (array of {url, filename, uploaded_at})
  screenshots JSONB DEFAULT '[]',
  
  -- Additional context
  error_message TEXT,
  console_logs TEXT,
  
  -- Categorization
  affected_module VARCHAR(50),
  priority_suggested VARCHAR(20) CHECK (priority_suggested IN ('urgent', 'high', 'medium', 'low')),
  tags TEXT[],
  
  -- Status & tracking
  status VARCHAR(30) DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'confirmed', 'in_progress', 'resolved', 'closed', 'wont_fix', 'duplicate')),
  
  -- Assignment
  assigned_to UUID REFERENCES user_profiles(id),
  assigned_at TIMESTAMPTZ,
  
  -- Resolution
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES user_profiles(id),
  resolved_in_version VARCHAR(20),
  
  -- Related
  duplicate_of UUID REFERENCES feedback_submissions(id),
  related_tickets UUID[],
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: feedback_comments
-- ============================================================================

CREATE TABLE IF NOT EXISTS feedback_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES feedback_submissions(id) ON DELETE CASCADE,
  comment_by UUID REFERENCES user_profiles(id),
  comment_by_name VARCHAR(200),
  comment_text TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: feedback_status_history
-- ============================================================================

CREATE TABLE IF NOT EXISTS feedback_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES feedback_submissions(id) ON DELETE CASCADE,
  old_status VARCHAR(30),
  new_status VARCHAR(30) NOT NULL,
  changed_by UUID REFERENCES user_profiles(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- ============================================================================
-- FUNCTION: Generate ticket number
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_feedback_ticket_number()
RETURNS TRIGGER AS $$
DECLARE
  prefix VARCHAR(3);
  seq_num INTEGER;
  year_part VARCHAR(4);
BEGIN
  -- Determine prefix based on feedback type
  IF NEW.feedback_type = 'bug' THEN
    prefix := 'BUG';
  ELSE
    prefix := 'REQ';
  END IF;
  
  -- Get next sequence value
  seq_num := nextval('feedback_ticket_seq');
  
  -- Format: PREFIX-XXXXX (5-digit zero-padded)
  NEW.ticket_number := prefix || '-' || LPAD(seq_num::TEXT, 5, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: Auto-generate ticket number on insert
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_generate_ticket_number ON feedback_submissions;
CREATE TRIGGER trigger_generate_ticket_number
  BEFORE INSERT ON feedback_submissions
  FOR EACH ROW
  WHEN (NEW.ticket_number IS NULL)
  EXECUTE FUNCTION generate_feedback_ticket_number();

-- ============================================================================
-- FUNCTION: Log status changes
-- ============================================================================

CREATE OR REPLACE FUNCTION log_feedback_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO feedback_status_history (
      feedback_id,
      old_status,
      new_status,
      changed_by,
      changed_at
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      NEW.resolved_by, -- Use resolved_by if available, otherwise null
      NOW()
    );
  END IF;
  
  -- Update the updated_at timestamp
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: Log status changes on update
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_log_status_change ON feedback_submissions;
CREATE TRIGGER trigger_log_status_change
  BEFORE UPDATE ON feedback_submissions
  FOR EACH ROW
  EXECUTE FUNCTION log_feedback_status_change();

-- ============================================================================
-- INDEXES: Performance optimization
-- ============================================================================

-- Index for filtering by status (most common filter)
CREATE INDEX IF NOT EXISTS idx_feedback_submissions_status 
  ON feedback_submissions(status);

-- Index for filtering by feedback type
CREATE INDEX IF NOT EXISTS idx_feedback_submissions_type 
  ON feedback_submissions(feedback_type);

-- Index for filtering by severity (for bug reports)
CREATE INDEX IF NOT EXISTS idx_feedback_submissions_severity 
  ON feedback_submissions(severity) WHERE severity IS NOT NULL;

-- Index for filtering by module
CREATE INDEX IF NOT EXISTS idx_feedback_submissions_module 
  ON feedback_submissions(module) WHERE module IS NOT NULL;

-- Index for user's own submissions
CREATE INDEX IF NOT EXISTS idx_feedback_submissions_submitted_by 
  ON feedback_submissions(submitted_by);

-- Index for assigned submissions
CREATE INDEX IF NOT EXISTS idx_feedback_submissions_assigned_to 
  ON feedback_submissions(assigned_to) WHERE assigned_to IS NOT NULL;

-- Index for sorting by created_at
CREATE INDEX IF NOT EXISTS idx_feedback_submissions_created_at 
  ON feedback_submissions(created_at DESC);

-- Composite index for common dashboard query (status + severity + created_at)
CREATE INDEX IF NOT EXISTS idx_feedback_submissions_dashboard 
  ON feedback_submissions(status, severity, created_at DESC);

-- Index for comments by feedback_id
CREATE INDEX IF NOT EXISTS idx_feedback_comments_feedback_id 
  ON feedback_comments(feedback_id);

-- Index for status history by feedback_id
CREATE INDEX IF NOT EXISTS idx_feedback_status_history_feedback_id 
  ON feedback_status_history(feedback_id);

-- Full-text search index on title and description
CREATE INDEX IF NOT EXISTS idx_feedback_submissions_search 
  ON feedback_submissions USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS on all feedback tables
ALTER TABLE feedback_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_status_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own submissions
CREATE POLICY "Users can view own submissions"
  ON feedback_submissions FOR SELECT
  TO authenticated
  USING (submitted_by = auth.uid());

-- Policy: Admins can view all submissions
CREATE POLICY "Admins can view all submissions"
  ON feedback_submissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'manager')
    )
  );

-- Policy: Authenticated users can create submissions
CREATE POLICY "Users can create submissions"
  ON feedback_submissions FOR INSERT
  TO authenticated
  WITH CHECK (submitted_by = auth.uid());

-- Policy: Admins can update any submission
CREATE POLICY "Admins can update submissions"
  ON feedback_submissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'manager')
    )
  );

-- Policy: Users can view comments on their own submissions
CREATE POLICY "Users can view comments on own submissions"
  ON feedback_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM feedback_submissions
      WHERE id = feedback_comments.feedback_id
      AND submitted_by = auth.uid()
    )
    AND is_internal = FALSE
  );

-- Policy: Admins can view all comments including internal
CREATE POLICY "Admins can view all comments"
  ON feedback_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'manager')
    )
  );

-- Policy: Users can add comments to their own submissions
CREATE POLICY "Users can add comments to own submissions"
  ON feedback_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    comment_by = auth.uid()
    AND is_internal = FALSE
    AND EXISTS (
      SELECT 1 FROM feedback_submissions
      WHERE id = feedback_comments.feedback_id
      AND submitted_by = auth.uid()
    )
  );

-- Policy: Admins can add comments to any submission
CREATE POLICY "Admins can add comments"
  ON feedback_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    comment_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'manager')
    )
  );

-- Policy: Users can view status history of their own submissions
CREATE POLICY "Users can view own status history"
  ON feedback_status_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM feedback_submissions
      WHERE id = feedback_status_history.feedback_id
      AND submitted_by = auth.uid()
    )
  );

-- Policy: Admins can view all status history
CREATE POLICY "Admins can view all status history"
  ON feedback_status_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'manager')
    )
  );

-- ============================================================================
-- VIEWS: Dashboard queries
-- ============================================================================

-- View: Feedback summary statistics
CREATE OR REPLACE VIEW feedback_summary_stats AS
SELECT
  COUNT(*) FILTER (WHERE status = 'new') AS new_count,
  COUNT(*) FILTER (WHERE severity = 'critical' AND status NOT IN ('resolved', 'closed', 'wont_fix')) AS critical_count,
  COUNT(*) FILTER (WHERE feedback_type = 'bug' AND status NOT IN ('resolved', 'closed', 'wont_fix')) AS open_bugs_count,
  COUNT(*) FILTER (WHERE feedback_type = 'improvement' AND status NOT IN ('resolved', 'closed', 'wont_fix')) AS open_requests_count,
  COUNT(*) FILTER (WHERE resolved_at >= NOW() - INTERVAL '7 days') AS resolved_this_week_count
FROM feedback_submissions;

-- View: Feedback list with comment counts
CREATE OR REPLACE VIEW feedback_with_comments AS
SELECT
  fs.*,
  COALESCE(cc.comment_count, 0) AS comment_count,
  up_submitter.full_name AS submitter_name,
  up_assigned.full_name AS assignee_name
FROM feedback_submissions fs
LEFT JOIN (
  SELECT feedback_id, COUNT(*) AS comment_count
  FROM feedback_comments
  WHERE is_internal = FALSE
  GROUP BY feedback_id
) cc ON fs.id = cc.feedback_id
LEFT JOIN user_profiles up_submitter ON fs.submitted_by = up_submitter.id
LEFT JOIN user_profiles up_assigned ON fs.assigned_to = up_assigned.id;

-- View: User's open ticket count
CREATE OR REPLACE VIEW user_open_ticket_counts AS
SELECT
  submitted_by AS user_id,
  COUNT(*) AS open_count
FROM feedback_submissions
WHERE status NOT IN ('resolved', 'closed', 'wont_fix')
GROUP BY submitted_by;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE feedback_submissions IS 'Stores bug reports, improvement requests, questions, and other feedback from users';
COMMENT ON TABLE feedback_comments IS 'Comments on feedback submissions, supports internal-only comments for admins';
COMMENT ON TABLE feedback_status_history IS 'Audit trail of status changes for feedback submissions';
COMMENT ON SEQUENCE feedback_ticket_seq IS 'Sequence for generating unique ticket numbers';
COMMENT ON VIEW feedback_summary_stats IS 'Dashboard summary statistics for feedback';
COMMENT ON VIEW feedback_with_comments IS 'Feedback submissions with comment counts and user names';
COMMENT ON VIEW user_open_ticket_counts IS 'Count of open tickets per user for badge display';
