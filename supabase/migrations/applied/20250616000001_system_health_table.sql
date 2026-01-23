-- Migration: Create system_health table for production readiness monitoring
-- Requirements: 1.1, 1.2 - System Health Monitoring

-- Create system_health table with all health metric columns
CREATE TABLE IF NOT EXISTS system_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  db_connections_active INTEGER,
  db_connections_idle INTEGER,
  db_size_mb DECIMAL(10,2),
  largest_tables JSONB,
  avg_query_time_ms DECIMAL(10,2),
  slow_queries_count INTEGER,
  cache_hit_rate DECIMAL(5,2),
  pending_jobs INTEGER,
  failed_jobs INTEGER,
  errors_last_hour INTEGER,
  metrics JSONB DEFAULT '{}'
);

-- Add timestamp index for efficient queries (descending for recent-first queries)
CREATE INDEX idx_system_health_timestamp ON system_health(timestamp DESC);

-- Add comment for documentation
COMMENT ON TABLE system_health IS 'Stores system health metrics for monitoring and alerting';
COMMENT ON COLUMN system_health.db_connections_active IS 'Number of active database connections';
COMMENT ON COLUMN system_health.db_connections_idle IS 'Number of idle database connections';
COMMENT ON COLUMN system_health.db_size_mb IS 'Total database size in megabytes';
COMMENT ON COLUMN system_health.largest_tables IS 'JSON object mapping table names to their sizes';
COMMENT ON COLUMN system_health.avg_query_time_ms IS 'Average query execution time in milliseconds';
COMMENT ON COLUMN system_health.slow_queries_count IS 'Number of slow queries in the monitoring period';
COMMENT ON COLUMN system_health.cache_hit_rate IS 'Database cache hit rate as a percentage';
COMMENT ON COLUMN system_health.pending_jobs IS 'Number of pending background jobs';
COMMENT ON COLUMN system_health.failed_jobs IS 'Number of failed background jobs';
COMMENT ON COLUMN system_health.errors_last_hour IS 'Count of errors in the last hour';
COMMENT ON COLUMN system_health.metrics IS 'Additional custom metrics as JSON';

-- Enable RLS on system_health table
ALTER TABLE system_health ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins and super_admins can view health metrics
CREATE POLICY "Admins can view system health"
  ON system_health
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'super_admin', 'owner')
    )
  );

-- RLS Policy: Only system (service role) can insert health metrics
-- This allows the health check system to record metrics
CREATE POLICY "System can insert health metrics"
  ON system_health
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Grant necessary permissions
GRANT SELECT ON system_health TO authenticated;
GRANT INSERT ON system_health TO authenticated;
