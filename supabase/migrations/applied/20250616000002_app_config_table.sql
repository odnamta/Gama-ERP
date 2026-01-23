-- App Configuration Table for centralized configuration management
-- Requirements: 3.1, 3.2, 3.5

CREATE TABLE IF NOT EXISTS app_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT NOT NULL,
  config_value JSONB NOT NULL,
  environment TEXT NOT NULL DEFAULT 'all' CHECK (environment IN ('all', 'development', 'staging', 'production')),
  is_sensitive BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(config_key, environment)
);

-- Indexes for efficient queries
CREATE INDEX idx_app_config_key ON app_config(config_key);
CREATE INDEX idx_app_config_environment ON app_config(environment);

-- Enable RLS
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can view all configs
CREATE POLICY "Admins can view configs" ON app_config
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'super_admin', 'owner')
    )
  );

-- Admins can update configs
CREATE POLICY "Admins can update configs" ON app_config
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'super_admin', 'owner')
    )
  );

-- Admins can insert configs
CREATE POLICY "Admins can insert configs" ON app_config
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'super_admin', 'owner')
    )
  );

-- Insert default configurations (Requirement 3.5)
INSERT INTO app_config (config_key, config_value, environment, is_sensitive, description) VALUES
  ('app_name', '"Gama ERP"', 'all', false, 'Application display name'),
  ('app_version', '"0.80.0"', 'all', false, 'Current application version'),
  ('maintenance_mode', 'false', 'all', false, 'Enable/disable maintenance mode'),
  ('max_upload_size', '10485760', 'all', false, 'Maximum file upload size in bytes (10MB)'),
  ('session_timeout', '86400', 'all', false, 'Session timeout in seconds (24 hours)'),
  ('password_min_length', '8', 'all', false, 'Minimum password length'),
  ('password_require_uppercase', 'true', 'all', false, 'Require uppercase in password'),
  ('password_require_number', 'true', 'all', false, 'Require number in password'),
  ('password_require_special', 'true', 'all', false, 'Require special character in password'),
  ('mfa_enabled', 'false', 'all', false, 'Enable multi-factor authentication'),
  ('mfa_required_roles', '["super_admin", "owner"]', 'all', false, 'Roles that require MFA'),
  ('default_currency', '"IDR"', 'all', false, 'Default currency code'),
  ('default_timezone', '"Asia/Jakarta"', 'all', false, 'Default timezone'),
  ('rate_limit_requests', '100', 'all', false, 'Rate limit requests per window'),
  ('rate_limit_window', '60', 'all', false, 'Rate limit window in seconds')
ON CONFLICT (config_key, environment) DO NOTHING;

-- Add comment to table
COMMENT ON TABLE app_config IS 'Centralized application configuration with environment support';
