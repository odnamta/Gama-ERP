-- =====================================================
-- Feedback Enhancement Migration (Mar 7, 2026)
-- Adds: BKK advance tracking, invoice collection status,
--        survey type field, template seed data
-- =====================================================

-- 1. BKK Advance Recipient + Deadline Tracking
ALTER TABLE bukti_kas_keluar
  ADD COLUMN IF NOT EXISTS advance_recipient_name TEXT,
  ADD COLUMN IF NOT EXISTS return_deadline DATE;

COMMENT ON COLUMN bukti_kas_keluar.advance_recipient_name IS 'PIC who received the advance cash';
COMMENT ON COLUMN bukti_kas_keluar.return_deadline IS 'Deadline for returning unused advance';

-- 2. Invoice Collection Status Tracking
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS collection_status TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS collection_notes TEXT,
  ADD COLUMN IF NOT EXISTS last_contact_date DATE,
  ADD COLUMN IF NOT EXISTS next_follow_up_date DATE;

COMMENT ON COLUMN invoices.collection_status IS 'AR collection workflow: none, contacted, promised, escalated, collected';
COMMENT ON COLUMN invoices.next_follow_up_date IS 'Next scheduled follow-up date for collection';

-- 3. Route Survey Type
ALTER TABLE route_surveys
  ADD COLUMN IF NOT EXISTS survey_type TEXT DEFAULT 'standard_route';

COMMENT ON COLUMN route_surveys.survey_type IS 'Survey type: standard_route, port_jetty, bridge_crossing';

-- 4. Equipment Status Transition Rules (stored as reference)
-- Transition validation is handled in application code (asset-actions.ts)
-- Valid transitions:
--   active → maintenance, repair, idle, disposed, sold
--   maintenance → active, repair, idle, disposed
--   repair → active, maintenance, idle, disposed
--   idle → active, maintenance, disposed, sold
--   disposed → (terminal state, no transitions)
--   sold → (terminal state, no transitions)
