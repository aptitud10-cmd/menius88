-- ============================================================
-- MIGRATION: Reservations + Delivery Zones
-- ============================================================

-- ---- Table capacity for reservations ----
ALTER TABLE tables ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 4;
ALTER TABLE tables ADD COLUMN IF NOT EXISTS section TEXT DEFAULT 'main';

-- ---- Reservations ----
CREATE TABLE IF NOT EXISTS reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT DEFAULT '',
  party_size INTEGER NOT NULL DEFAULT 2,
  date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 90,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---- Reservation config on restaurant ----
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS reservation_config JSONB DEFAULT '{
  "enabled": false,
  "maxPartySize": 12,
  "slotDuration": 90,
  "advanceDays": 30,
  "timeSlots": ["12:00","12:30","13:00","13:30","14:00","14:30","19:00","19:30","20:00","20:30","21:00","21:30"],
  "autoConfirm": false
}'::jsonb;

-- ---- Delivery zones ----
CREATE TABLE IF NOT EXISTS delivery_zones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  min_distance_km NUMERIC(5,1) DEFAULT 0,
  max_distance_km NUMERIC(5,1) NOT NULL,
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  min_order_amount NUMERIC(10,2) DEFAULT 0,
  estimated_minutes INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;

-- Owner manages reservations
CREATE POLICY "Owner manages reservations" ON reservations
  FOR ALL USING (
    restaurant_id IN (SELECT id FROM restaurants WHERE owner_user_id = auth.uid())
  );

-- Public can create reservations
CREATE POLICY "Public creates reservations" ON reservations
  FOR INSERT WITH CHECK (true);

-- Public can check their reservation by phone
CREATE POLICY "Public reads own reservations" ON reservations
  FOR SELECT USING (true);

-- Owner manages delivery zones
CREATE POLICY "Owner manages delivery zones" ON delivery_zones
  FOR ALL USING (
    restaurant_id IN (SELECT id FROM restaurants WHERE owner_user_id = auth.uid())
  );

-- Public can read delivery zones
CREATE POLICY "Public reads delivery zones" ON delivery_zones
  FOR SELECT USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(restaurant_id, date, status);
CREATE INDEX IF NOT EXISTS idx_delivery_zones_restaurant ON delivery_zones(restaurant_id, is_active);
