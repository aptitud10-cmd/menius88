-- ============================================================
-- MIGRATION: Menu Scheduling + Customer Accounts
-- ============================================================

-- ---- Menu schedule on categories ----
-- available_from/available_until define time windows (e.g., "06:00"/"11:30" for breakfast)
-- available_days is an array of day names (e.g., ['lunes','martes','miercoles'])
ALTER TABLE categories ADD COLUMN IF NOT EXISTS available_from TEXT DEFAULT NULL;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS available_until TEXT DEFAULT NULL;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS available_days TEXT[] DEFAULT NULL;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS schedule_label TEXT DEFAULT NULL;

-- ---- Product-level availability ----
ALTER TABLE products ADD COLUMN IF NOT EXISTS available_from TEXT DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS available_until TEXT DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS available_days TEXT[] DEFAULT NULL;

-- ---- Customer accounts ----
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  name TEXT DEFAULT '',
  email TEXT DEFAULT '',
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC(10,2) DEFAULT 0,
  last_order_at TIMESTAMPTZ,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id, phone)
);

-- RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages customers" ON customers
  FOR ALL USING (
    restaurant_id IN (SELECT id FROM restaurants WHERE owner_user_id = auth.uid())
  );

CREATE POLICY "Public upserts customer on order" ON customers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public reads own customer" ON customers
  FOR SELECT USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(restaurant_id, phone);
CREATE INDEX IF NOT EXISTS idx_customers_last_order ON customers(restaurant_id, last_order_at DESC);
