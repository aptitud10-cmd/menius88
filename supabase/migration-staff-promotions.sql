-- ============================================================
-- MIGRATION: Staff Management & Promotions System
-- ============================================================

-- ---- Staff Invitations ----
CREATE TABLE IF NOT EXISTS staff_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('staff', 'manager')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---- Restaurant Staff (accepted members) ----
CREATE TABLE IF NOT EXISTS restaurant_staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('staff', 'manager')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id, user_id)
);

-- ---- Promotions / Discount Codes ----
CREATE TABLE IF NOT EXISTS promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  description TEXT DEFAULT '',
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL,
  min_order_amount NUMERIC(10,2) DEFAULT 0,
  max_uses INTEGER DEFAULT NULL, -- NULL = unlimited
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NULL, -- NULL = never expires
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id, code)
);

-- ---- Add discount fields to orders ----
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS promotion_id UUID REFERENCES promotions(id);

-- ---- RLS Policies ----

ALTER TABLE staff_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Staff invitations: only owner can manage
CREATE POLICY "Owner manages invitations" ON staff_invitations
  FOR ALL USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_user_id = auth.uid()
    )
  );

-- Restaurant staff: owner can manage, staff can read their own
CREATE POLICY "Owner manages staff" ON restaurant_staff
  FOR ALL USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Staff reads own record" ON restaurant_staff
  FOR SELECT USING (user_id = auth.uid());

-- Promotions: owner manages, public can validate
CREATE POLICY "Owner manages promotions" ON promotions
  FOR ALL USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Public validates promotions" ON promotions
  FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_staff_invitations_email ON staff_invitations(email);
CREATE INDEX IF NOT EXISTS idx_staff_invitations_token ON staff_invitations(token);
CREATE INDEX IF NOT EXISTS idx_restaurant_staff_user ON restaurant_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_promotions_code ON promotions(restaurant_id, code);
