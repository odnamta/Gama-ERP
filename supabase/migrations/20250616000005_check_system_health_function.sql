-- check_system_health PostgreSQL function
-- Requirements: 9.1, 9.2, 9.3, 9.4
-- 
-- This function provides a database-level health check that:
-- - Returns health status as JSONB (Requirement 9.1)
-- - Includes database size, active connections, and recent error count (Requirement 9.2)
-- - Determines status based on error count and connection thresholds (Requirement 9.3)
-- - Inserts a record into system_health table on each call (Requirement 9.4)

-- Drop existing function if exists to allow recreation
DROP FUNCTION IF EXISTS check_system_health();

CREATE OR REPLACE FUNCTION check_system_health()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_db_size_mb NUMERIC;
  v_active_connections INTEGER;
  v_idle_connections INTEGER;
  v_errors_last_hour INTEGER;
  v_cache_hit_rate NUMERIC;
  v_status TEXT;
  v_result JSONB;
  v_largest_tables JSONB;
  v_app_version TEXT;
BEGIN
  -- Get database size in MB
  SELECT pg_database_size(current_database()) / 1024.0 / 1024.0 INTO v_db_size_mb;
  
  -- Get active connections
  SELECT COUNT(*) INTO v_active_connections
  FROM pg_stat_activity
  WHERE state = 'active' AND datname = current_database();
  
  -- Get idle connections
  SELECT COUNT(*) INTO v_idle_connections
  FROM pg_stat_activity
  WHERE state = 'idle' AND datname = current_database();
  
  -- Get errors in last hour (from system_health if available, otherwise 0)
  SELECT COALESCE(
    (SELECT errors_last_hour FROM system_health 
     WHERE timestamp > NOW() - INTERVAL '1 hour' 
     ORDER BY timestamp DESC LIMIT 1),
    0
  ) INTO v_errors_last_hour;
  
  -- Get cache hit rate from pg_statio_user_tables (aggregate across all tables)
  SELECT 
    CASE 
      WHEN SUM(heap_blks_hit + heap_blks_read) > 0 
      THEN ROUND((SUM(heap_blks_hit)::NUMERIC / SUM(heap_blks_hit + heap_blks_read)::NUMERIC) * 100, 2)
      ELSE 100.00
    END INTO v_cache_hit_rate
  FROM pg_statio_user_tables
  WHERE schemaname = 'public';
  
  -- Default cache hit rate if no data
  IF v_cache_hit_rate IS NULL THEN
    v_cache_hit_rate := 100.00;
  END IF;
  
  -- Get largest tables (top 10)
  SELECT jsonb_object_agg(tablename, size_mb)
  INTO v_largest_tables
  FROM (
    SELECT 
      relname AS tablename,
      ROUND(pg_total_relation_size(relid) / 1024.0 / 1024.0, 2) AS size_mb
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(relid) DESC
    LIMIT 10
  ) t;
  
  -- Get app version from config (if available)
  BEGIN
    SELECT config_value::TEXT INTO v_app_version
    FROM app_config
    WHERE config_key = 'app_version' AND environment = 'all'
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    v_app_version := NULL;
  END;
  
  -- Remove quotes from JSON string value
  IF v_app_version IS NOT NULL THEN
    v_app_version := TRIM(BOTH '"' FROM v_app_version);
  ELSE
    v_app_version := 'unknown';
  END IF;
  
  -- Determine status based on thresholds (Requirements 9.2, 9.3)
  -- Status logic per requirements:
  -- - 'unhealthy': errors > 100 (Req 1.4) OR active connections > 80
  -- - 'degraded'/'warning': errors > 50 OR active connections > 50 (Req 1.5)
  -- - 'healthy': otherwise
  IF v_errors_last_hour > 100 OR v_active_connections > 80 THEN
    v_status := 'unhealthy';
  ELSIF v_errors_last_hour > 50 OR v_active_connections > 50 THEN
    v_status := 'warning';
  ELSE
    v_status := 'healthy';
  END IF;
  
  -- Build result JSONB (Requirement 9.2)
  v_result := jsonb_build_object(
    'status', v_status,
    'timestamp', NOW(),
    'version', v_app_version,
    'database', jsonb_build_object(
      'size_mb', ROUND(v_db_size_mb, 2),
      'connections', v_active_connections + v_idle_connections,
      'active_connections', v_active_connections,
      'idle_connections', v_idle_connections,
      'cache_hit_rate', v_cache_hit_rate
    ),
    'errors_last_hour', v_errors_last_hour,
    'largest_tables', COALESCE(v_largest_tables, '{}'::jsonb)
  );
  
  -- Insert health record into system_health table (Requirement 9.4)
  INSERT INTO system_health (
    db_connections_active,
    db_connections_idle,
    db_size_mb,
    largest_tables,
    cache_hit_rate,
    errors_last_hour,
    metrics
  ) VALUES (
    v_active_connections,
    v_idle_connections,
    ROUND(v_db_size_mb, 2),
    COALESCE(v_largest_tables, '{}'::jsonb),
    v_cache_hit_rate,
    v_errors_last_hour,
    jsonb_build_object(
      'status', v_status,
      'version', v_app_version,
      'total_connections', v_active_connections + v_idle_connections
    )
  );
  
  RETURN v_result;
END;
$$;

-- Add comment to function
COMMENT ON FUNCTION check_system_health() IS 'Returns system health status as JSONB and records metrics to system_health table. Includes database size, connections, error count, and determines status based on thresholds.';

-- Grant execute permission to authenticated users (admins will use this via RPC)
GRANT EXECUTE ON FUNCTION check_system_health() TO authenticated;
