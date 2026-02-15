-- ============================================================
-- MIGRATION: Inventory, Scheduled Orders, Tips
-- ============================================================

-- ---- Inventory fields on products ----
ALTER TABLE products ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5;

-- ---- Scheduled orders ----
ALTER TABLE orders ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_scheduled BOOLEAN DEFAULT FALSE;

-- ---- Tips ----
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tip_amount NUMERIC(10,2) DEFAULT 0;

-- ---- Inventory log for auditing ----
CREATE TABLE IF NOT EXISTS inventory_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL CHECK (change_type IN ('restock', 'order', 'adjustment', 'initial')),
  quantity_change INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  notes TEXT DEFAULT '',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE inventory_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages inventory log" ON inventory_log
  FOR ALL USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inventory_log_product ON inventory_log(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_log_restaurant ON inventory_log(restaurant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(restaurant_id, track_inventory, stock_quantity);
CREATE INDEX IF NOT EXISTS idx_orders_scheduled ON orders(restaurant_id, is_scheduled, scheduled_for);
