-- Deployment History Table for tracking deployments
-- Requirements: 6.1, 6.3

CREATE TABLE IF NOT EXISTS deployment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  environment TEXT NOT NULL CHECK (environment IN ('development', 'staging', 'production')),
  deployed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deployed_by UUID REFERENCES auth.users(id),
  deployed_by_name TEXT,
  changelog TEXT,
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed', 'rolled_back')),
  is_rollback BOOLEAN NOT NULL DEFAULT false,
  rollback_reason TEXT,
  rollback_target_version TEXT,
  commit_hash TEXT,
  build_number TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Indexes for efficient queries
CREATE INDEX idx_deployment_history_environment ON deployment_history(environment);
CREATE INDEX idx_deployment_history_deployed_at ON deployment_history(deployed_at DESC);
CREATE INDEX idx_deployment_history_version ON deployment_history(version);

-- Enable RLS
ALTER TABLE deployment_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can view deployment history
CREATE POLICY "Admins can view deployment history" ON deployment_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'super_admin', 'owner')
    )
  );

-- System can insert deployment records
CREATE POLICY "System can insert deployment records" ON deployment_history
  FOR INSERT
  WITH CHECK (true);

-- Add comment to table
COMMENT ON TABLE deployment_history IS 'Deployment history tracking with rollback support';
