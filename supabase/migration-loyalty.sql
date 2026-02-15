-- ============================================================
-- MIGRATION: Customer Loyalty Program
-- ============================================================

-- ---- Customer loyalty accounts ----
CREATE TABLE IF NOT EXISTS loyalty_customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  name TEXT DEFAULT '',
  total_points INTEGER DEFAULT 0,
  total_spent NUMERIC(10,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id, phone)
);

-- ---- Points transactions ----
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES loyalty_customers(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('earn', 'redeem', 'bonus', 'expire')),
  points INTEGER NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---- Loyalty config on restaurant ----
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS loyalty_config JSONB DEFAULT '{"enabled": false, "pointsPerDollar": 10, "redeemThreshold": 100, "redeemValue": 5}'::jsonb;

-- RLS
ALTER TABLE loyalty_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages loyalty customers" ON loyalty_customers
  FOR ALL USING (
    restaurant_id IN (SELECT id FROM restaurants WHERE owner_user_id = auth.uid())
  );

CREATE POLICY "Owner manages loyalty transactions" ON loyalty_transactions
  FOR ALL USING (
    restaurant_id IN (SELECT id FROM restaurants WHERE owner_user_id = auth.uid())
  );

-- Public can check their points by phone
CREATE POLICY "Public reads own loyalty" ON loyalty_customers
  FOR SELECT USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_customers_phone ON loyalty_customers(restaurant_id, phone);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_customer ON loyalty_transactions(customer_id);
