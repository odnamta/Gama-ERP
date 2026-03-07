-- Fix engineering RLS policies to include 'hse' role
-- Bug: Iqbal Tito (role: hse) could not create drawings, surveys, or resources
-- Root cause: app-level permissions included 'hse' but RLS policies did not
-- Also fixes rate_limit_log policies that blocked SELECT/UPDATE for non-admin roles

-- drawings: add hse to INSERT WITH CHECK
DROP POLICY IF EXISTS drawings_insert ON drawings;
CREATE POLICY drawings_insert ON drawings FOR INSERT TO authenticated
  WITH CHECK (has_role(ARRAY['admin', 'super_admin', 'owner', 'manager', 'engineer', 'ops', 'marketing', 'hse']));

-- drawings: add hse to UPDATE
DROP POLICY IF EXISTS drawings_update ON drawings;
CREATE POLICY drawings_update ON drawings FOR UPDATE TO authenticated
  USING (has_role(ARRAY['admin', 'super_admin', 'owner', 'manager', 'engineer', 'hse']));

-- drawing_revisions: add hse to INSERT WITH CHECK
DROP POLICY IF EXISTS drawing_revisions_insert ON drawing_revisions;
CREATE POLICY drawing_revisions_insert ON drawing_revisions FOR INSERT TO authenticated
  WITH CHECK (has_role(ARRAY['admin', 'super_admin', 'owner', 'manager', 'engineer', 'hse']));

-- drawing_revisions: add hse to UPDATE
DROP POLICY IF EXISTS drawing_revisions_update ON drawing_revisions;
CREATE POLICY drawing_revisions_update ON drawing_revisions FOR UPDATE TO authenticated
  USING (has_role(ARRAY['admin', 'super_admin', 'owner', 'manager', 'engineer', 'hse']));

-- route_surveys: add hse to INSERT WITH CHECK
DROP POLICY IF EXISTS route_surveys_insert ON route_surveys;
CREATE POLICY route_surveys_insert ON route_surveys FOR INSERT TO authenticated
  WITH CHECK (has_role(ARRAY['admin', 'super_admin', 'owner', 'manager', 'engineer', 'hse']));

-- route_surveys: add hse to UPDATE
DROP POLICY IF EXISTS route_surveys_update ON route_surveys;
CREATE POLICY route_surveys_update ON route_surveys FOR UPDATE TO authenticated
  USING (has_role(ARRAY['admin', 'super_admin', 'owner', 'manager', 'engineer', 'hse']));

-- route_survey_checklist: add hse to INSERT WITH CHECK
DROP POLICY IF EXISTS route_survey_checklist_insert ON route_survey_checklist;
CREATE POLICY route_survey_checklist_insert ON route_survey_checklist FOR INSERT TO authenticated
  WITH CHECK (has_role(ARRAY['admin', 'super_admin', 'owner', 'manager', 'engineer', 'hse']));

-- route_survey_checklist: add hse to UPDATE
DROP POLICY IF EXISTS route_survey_checklist_update ON route_survey_checklist;
CREATE POLICY route_survey_checklist_update ON route_survey_checklist FOR UPDATE TO authenticated
  USING (has_role(ARRAY['admin', 'super_admin', 'owner', 'manager', 'engineer', 'hse']));

-- engineering_resources: add hse to INSERT WITH CHECK
DROP POLICY IF EXISTS engineering_resources_insert ON engineering_resources;
CREATE POLICY engineering_resources_insert ON engineering_resources FOR INSERT TO authenticated
  WITH CHECK (has_role(ARRAY['admin', 'super_admin', 'owner', 'manager', 'engineer', 'hse']));

-- engineering_resources: add hse to UPDATE
DROP POLICY IF EXISTS engineering_resources_update ON engineering_resources;
CREATE POLICY engineering_resources_update ON engineering_resources FOR UPDATE TO authenticated
  USING (has_role(ARRAY['admin', 'super_admin', 'owner', 'manager', 'engineer', 'hse']));

-- rate_limit_log: open SELECT and UPDATE to all authenticated users
-- The rate limiter "fails open" on errors, but non-admin users were getting
-- unnecessary RLS errors on every rate limit check
DROP POLICY IF EXISTS rate_limit_log_select ON rate_limit_log;
CREATE POLICY rate_limit_log_select ON rate_limit_log FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS rate_limit_log_update ON rate_limit_log;
CREATE POLICY rate_limit_log_update ON rate_limit_log FOR UPDATE TO authenticated
  USING (true);
