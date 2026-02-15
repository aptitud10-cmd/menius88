-- ============================================================
-- MIGRATION: Order Types & Customer Reviews
-- ============================================================

-- ---- Ensure order_type column exists ----
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'dine_in' CHECK (order_type IN ('dine_in', 'pickup', 'delivery'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- ---- Customer Reviews ----
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Public: Anyone can create a review (with valid data)
CREATE POLICY "Public creates reviews" ON reviews
  FOR INSERT WITH CHECK (true);

-- Public: Anyone can read visible reviews
CREATE POLICY "Public reads visible reviews" ON reviews
  FOR SELECT USING (is_visible = true);

-- Owner: manages own restaurant reviews (toggle visibility, delete)
CREATE POLICY "Owner manages reviews" ON reviews
  FOR ALL USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_restaurant ON reviews(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order ON reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(restaurant_id, rating);
CREATE INDEX IF NOT EXISTS idx_orders_type ON orders(restaurant_id, order_type);
