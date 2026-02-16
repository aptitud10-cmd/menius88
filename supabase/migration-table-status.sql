-- ============================================================
-- MIGRATION: Table Status & Server Assignment
-- ============================================================

-- Add status columns to tables
ALTER TABLE tables ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'cleaning'));
ALTER TABLE tables ADD COLUMN IF NOT EXISTS current_order_id UUID REFERENCES orders(id) ON DELETE SET NULL;
ALTER TABLE tables ADD COLUMN IF NOT EXISTS assigned_server TEXT DEFAULT '';
ALTER TABLE tables ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ DEFAULT NOW();

-- Index for quick status lookups
CREATE INDEX IF NOT EXISTS idx_tables_status ON tables(restaurant_id, status);
