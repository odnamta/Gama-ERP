-- Feature Flags Table for feature management
-- Requirements: 5.1, 5.7

CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  target_users UUID[] DEFAULT '{}',
  target_roles TEXT[] DEFAULT '{}',
  rollout_percentage INTEGER DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  enable_at TIMESTAMPTZ,
  disable_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient flag lookups
CREATE INDEX idx_feature_flags_key ON feature_flags(flag_key);

-- Enable RLS
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- All authenticated users can view feature flags
CREATE POLICY "Authenticated users can view feature flags" ON feature_flags
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Admins can manage feature flags
CREATE POLICY "Admins can manage feature flags" ON feature_flags
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'super_admin', 'owner')
    )
  );

-- Insert default feature flags (Requirement 5.7)
INSERT INTO feature_flags (flag_key, name, description, is_enabled, target_roles, rollout_percentage) VALUES
  ('ai_insights', 'AI Insights', 'Enable AI-powered insights and recommendations', false, '{}', 0),
  ('predictive_analytics', 'Predictive Analytics', 'Enable predictive analytics features', false, '{}', 0),
  ('whatsapp_notifications', 'WhatsApp Notifications', 'Enable WhatsApp notification integration', false, '{}', 0),
  ('mobile_app', 'Mobile App Access', 'Enable mobile application access', false, '{}', 0),
  ('bulk_operations', 'Bulk Operations', 'Enable bulk data operations', true, '{"admin", "super_admin", "owner"}', 100),
  ('advanced_reports', 'Advanced Reports', 'Enable advanced reporting features', true, '{"manager", "finance", "admin", "super_admin", "owner"}', 100)
ON CONFLICT (flag_key) DO NOTHING;

-- Add comment to table
COMMENT ON TABLE feature_flags IS 'Feature flag management with targeting and rollout support';
