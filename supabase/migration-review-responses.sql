-- ============================================================
-- MIGRATION: Review Responses
-- ============================================================

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS owner_response TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;
