-- ============================================================
-- MIGRATION: Gift Cards + Menu Combos
-- ============================================================

-- ---- Gift Cards ----
CREATE TABLE IF NOT EXISTS gift_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  initial_amount NUMERIC(10,2) NOT NULL,
  remaining_amount NUMERIC(10,2) NOT NULL,
  buyer_name TEXT DEFAULT '',
  buyer_email TEXT DEFAULT '',
  recipient_name TEXT DEFAULT '',
  recipient_email TEXT DEFAULT '',
  message TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id, code)
);

CREATE TABLE IF NOT EXISTS gift_card_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gift_card_id UUID NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'redeem', 'refund')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_card_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages gift cards" ON gift_cards
  FOR ALL USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_user_id = auth.uid()));

CREATE POLICY "Public reads own gift card" ON gift_cards
  FOR SELECT USING (true);

CREATE POLICY "Owner manages gift card transactions" ON gift_card_transactions
  FOR ALL USING (gift_card_id IN (
    SELECT gc.id FROM gift_cards gc
    JOIN restaurants r ON gc.restaurant_id = r.id
    WHERE r.owner_user_id = auth.uid()
  ));

CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(restaurant_id, code);
CREATE INDEX IF NOT EXISTS idx_gift_card_transactions_card ON gift_card_transactions(gift_card_id);

-- ---- Menu Combos ----
CREATE TABLE IF NOT EXISTS combos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  original_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  combo_price NUMERIC(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  available_from TEXT DEFAULT NULL,
  available_until TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS combo_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  combo_id UUID NOT NULL REFERENCES combos(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0
);

ALTER TABLE combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE combo_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages combos" ON combos
  FOR ALL USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_user_id = auth.uid()));
CREATE POLICY "Public reads active combos" ON combos
  FOR SELECT USING (is_active = true);

CREATE POLICY "Owner manages combo items" ON combo_items
  FOR ALL USING (combo_id IN (
    SELECT c.id FROM combos c
    JOIN restaurants r ON c.restaurant_id = r.id
    WHERE r.owner_user_id = auth.uid()
  ));
CREATE POLICY "Public reads combo items" ON combo_items
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_combos_restaurant ON combos(restaurant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_combo_items_combo ON combo_items(combo_id);
