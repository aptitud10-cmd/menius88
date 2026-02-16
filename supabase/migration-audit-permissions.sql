-- ============================================================
-- MIGRATION: Audit Log + Staff Permissions
-- ============================================================

-- ---- Audit Log ----
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id UUID,
  user_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages audit log" ON audit_log
  FOR ALL USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_audit_log_restaurant ON audit_log(restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(restaurant_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(restaurant_id, entity_type, entity_id);

-- ---- Staff Permissions (granular) ----
ALTER TABLE restaurant_staff ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{
  "orders": {"view": true, "manage": true},
  "menu": {"view": true, "manage": false},
  "inventory": {"view": true, "manage": false},
  "analytics": {"view": false, "manage": false},
  "staff": {"view": false, "manage": false},
  "settings": {"view": false, "manage": false},
  "billing": {"view": false, "manage": false},
  "promotions": {"view": true, "manage": false},
  "reviews": {"view": true, "manage": false},
  "customers": {"view": true, "manage": false},
  "reservations": {"view": true, "manage": true},
  "kitchen": {"view": true, "manage": true}
}'::jsonb;

-- ---- Report config on restaurant ----
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS report_config JSONB DEFAULT '{
  "weeklyReport": true,
  "reportEmail": null,
  "reportDay": "monday"
}'::jsonb;
