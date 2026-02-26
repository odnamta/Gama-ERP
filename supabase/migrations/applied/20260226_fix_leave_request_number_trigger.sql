-- ============================================================================
-- Migration: Fix leave request number trigger
-- Date: 2026-02-26
-- Status: APPLIED via Supabase MCP
-- Root cause: generate_leave_request_number() has SET search_path TO ''
--   but calls NEXTVAL('leave_request_seq') without schema prefix.
--   This causes "relation 'leave_request_seq' does not exist" on every INSERT,
--   which silently blocks all leave request submissions.
-- Reported by: Kurniashanti (marketing), Iqbal Tito (hse)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_leave_request_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
BEGIN
    NEW.request_number := 'LV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('public.leave_request_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$function$;
