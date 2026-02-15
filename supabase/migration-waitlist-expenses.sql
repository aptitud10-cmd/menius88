-- ============================================================
-- MIGRATION: Waitlist + Expenses
-- ============================================================

-- ---- Waitlist ----
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT DEFAULT '',
  party_size INTEGER NOT NULL DEFAULT 2,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'seated', 'cancelled', 'no_show')),
  estimated_wait INTEGER DEFAULT 15,
  notes TEXT DEFAULT '',
  notified_at TIMESTAMPTZ,
  seated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages waitlist" ON waitlist
  FOR ALL USING (
    restaurant_id IN (SELECT id FROM restaurants WHERE owner_user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_waitlist_active ON waitlist(restaurant_id, status, created_at);

-- ---- Expenses ----
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('food', 'beverage', 'supplies', 'labor', 'rent', 'utilities', 'marketing', 'maintenance', 'equipment', 'other')),
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_frequency TEXT CHECK (recurring_frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'yearly')),
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages expenses" ON expenses
  FOR ALL USING (
    restaurant_id IN (SELECT id FROM restaurants WHERE owner_user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(restaurant_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(restaurant_id, category);
