-- ============================================================
-- MENIUS SaaS — Integrations & Premium Branding Migration
-- Phase 1 addon: Future-proof schema for POS, Webhooks,
-- and Premium Storefront configuration
-- Run AFTER migration-security-hardening.sql
-- ============================================================

-- ============================================================
-- 1. EXTEND RESTAURANTS TABLE — Premium Storefront Config
-- ============================================================
-- These fields enable per-tenant branding, theme, and storefront
-- configuration for the premium mobile-first storefront.

-- Branding & Theme
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS tagline TEXT DEFAULT '';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS cover_image_url TEXT DEFAULT '';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS cuisine_type TEXT DEFAULT '';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS website TEXT DEFAULT '';

-- Theme/brand customization (JSON for flexibility)
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS theme JSONB DEFAULT '{
  "primaryColor": "#2563eb",
  "accentColor": "#d4a574",
  "fontHeading": "Playfair Display",
  "fontBody": "Inter",
  "borderRadius": "xl",
  "darkMode": false
}'::jsonb;

-- Operating hours (JSON — array of day schedules)
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS operating_hours JSONB DEFAULT '[
  {"day": "monday", "open": "09:00", "close": "22:00", "closed": false},
  {"day": "tuesday", "open": "09:00", "close": "22:00", "closed": false},
  {"day": "wednesday", "open": "09:00", "close": "22:00", "closed": false},
  {"day": "thursday", "open": "09:00", "close": "22:00", "closed": false},
  {"day": "friday", "open": "09:00", "close": "23:00", "closed": false},
  {"day": "saturday", "open": "10:00", "close": "23:00", "closed": false},
  {"day": "sunday", "open": "10:00", "close": "21:00", "closed": false}
]'::jsonb;

-- Order configuration
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS order_config JSONB DEFAULT '{
  "deliveryEnabled": false,
  "pickupEnabled": true,
  "dineInEnabled": true,
  "deliveryFee": 0,
  "deliveryMinOrder": 0,
  "deliveryRadius": 5,
  "estimatedPrepTime": 20,
  "autoAcceptOrders": false,
  "taxRate": 0.16
}'::jsonb;

-- Subscription & trial
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'trial'
  CHECK (subscription_plan IN ('trial', 'basic', 'pro', 'premium', 'enterprise', 'cancelled'));
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '13 days');
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- ============================================================
-- 2. INTEGRATIONS TABLE — POS, Webhooks, External Services
-- ============================================================
-- Stores the connection configuration for each external integration.
-- Each integration belongs to a specific restaurant (tenant).

CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  
  -- Integration type: pos_toast, pos_square, pos_clover, twilio, n8n, custom_webhook
  provider TEXT NOT NULL CHECK (provider IN (
    'pos_toast', 'pos_square', 'pos_clover',
    'twilio_sms', 'twilio_whatsapp',
    'n8n', 'zapier',
    'custom_webhook',
    'stripe_connect',
    'email_sendgrid', 'email_resend'
  )),
  
  -- Display name (user-defined)
  name TEXT NOT NULL DEFAULT '',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error', 'pending_auth')),
  
  -- Encrypted credentials/config (in production, use Supabase Vault or similar)
  -- For now, JSONB with API keys, tokens, etc.
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Mapping config for POS (maps our product IDs to POS item IDs, etc.)
  data_mapping JSONB DEFAULT '{}'::jsonb,
  
  -- Last sync info
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT,
  last_error TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one integration per provider per restaurant
  UNIQUE(restaurant_id, provider)
);

CREATE INDEX idx_integrations_restaurant ON integrations(restaurant_id);
CREATE INDEX idx_integrations_provider ON integrations(provider);
CREATE INDEX idx_integrations_status ON integrations(status);

-- RLS for integrations
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "integrations_owner_select"
  ON integrations FOR SELECT
  USING (user_owns_restaurant(restaurant_id));

CREATE POLICY "integrations_owner_insert"
  ON integrations FOR INSERT
  WITH CHECK (user_owns_restaurant(restaurant_id));

CREATE POLICY "integrations_owner_update"
  ON integrations FOR UPDATE
  USING (user_owns_restaurant(restaurant_id))
  WITH CHECK (user_owns_restaurant(restaurant_id));

CREATE POLICY "integrations_owner_delete"
  ON integrations FOR DELETE
  USING (user_owns_restaurant(restaurant_id));

-- ============================================================
-- 3. WEBHOOKS TABLE — Outbound webhook subscriptions
-- ============================================================
-- Restaurants can register webhook URLs to receive notifications
-- when events occur (order created, status changed, etc.)

CREATE TABLE IF NOT EXISTS webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  
  -- Which events to trigger on
  event_type TEXT NOT NULL CHECK (event_type IN (
    'order.created', 'order.updated', 'order.cancelled',
    'menu.updated', 'product.created', 'product.updated',
    'restaurant.updated',
    'payment.received', 'payment.refunded',
    '*'  -- wildcard: all events
  )),
  
  -- Where to send the webhook
  url TEXT NOT NULL,
  
  -- Secret for HMAC signature verification
  secret TEXT NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Failure tracking
  failure_count INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  last_response_status INTEGER,
  last_error TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhooks_restaurant ON webhook_subscriptions(restaurant_id);
CREATE INDEX idx_webhooks_event ON webhook_subscriptions(event_type);

-- RLS for webhook subscriptions
ALTER TABLE webhook_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhooks_owner_select"
  ON webhook_subscriptions FOR SELECT
  USING (user_owns_restaurant(restaurant_id));

CREATE POLICY "webhooks_owner_insert"
  ON webhook_subscriptions FOR INSERT
  WITH CHECK (user_owns_restaurant(restaurant_id));

CREATE POLICY "webhooks_owner_update"
  ON webhook_subscriptions FOR UPDATE
  USING (user_owns_restaurant(restaurant_id))
  WITH CHECK (user_owns_restaurant(restaurant_id));

CREATE POLICY "webhooks_owner_delete"
  ON webhook_subscriptions FOR DELETE
  USING (user_owns_restaurant(restaurant_id));

-- ============================================================
-- 4. WEBHOOK DELIVERY LOG — Track outbound webhook deliveries
-- ============================================================

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_id UUID NOT NULL REFERENCES webhook_subscriptions(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  
  -- Delivery attempt info
  response_status INTEGER,
  response_body TEXT,
  duration_ms INTEGER,
  
  -- Retry tracking
  attempt_number INTEGER DEFAULT 1,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_restaurant ON webhook_deliveries(restaurant_id);
CREATE INDEX idx_webhook_deliveries_created ON webhook_deliveries(created_at DESC);

-- RLS for delivery logs
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhook_deliveries_owner_select"
  ON webhook_deliveries FOR SELECT
  USING (user_owns_restaurant(restaurant_id));

-- System can insert delivery logs
CREATE POLICY "webhook_deliveries_system_insert"
  ON webhook_deliveries FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- 5. POS SYNC LOG — Track POS synchronization history
-- ============================================================

CREATE TABLE IF NOT EXISTS pos_sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  
  sync_type TEXT NOT NULL CHECK (sync_type IN (
    'menu_push', 'menu_pull',
    'order_push', 'order_pull',
    'inventory_sync',
    'full_sync'
  )),
  
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'partial', 'failed')),
  
  items_processed INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  error_details JSONB DEFAULT '[]'::jsonb,
  
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER
);

CREATE INDEX idx_pos_sync_integration ON pos_sync_log(integration_id);
CREATE INDEX idx_pos_sync_restaurant ON pos_sync_log(restaurant_id);

-- RLS for POS sync log
ALTER TABLE pos_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pos_sync_owner_select"
  ON pos_sync_log FOR SELECT
  USING (user_owns_restaurant(restaurant_id));

CREATE POLICY "pos_sync_system_insert"
  ON pos_sync_log FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- 6. EXTEND PRODUCTS TABLE — POS mapping support
-- ============================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS external_id TEXT;  -- POS item ID
ALTER TABLE products ADD COLUMN IF NOT EXISTS external_provider TEXT;  -- Which POS
ALTER TABLE products ADD COLUMN IF NOT EXISTS allergens JSONB DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS dietary_tags JSONB DEFAULT '[]'::jsonb; -- vegetarian, vegan, gluten-free
ALTER TABLE products ADD COLUMN IF NOT EXISTS prep_time_minutes INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS calories INTEGER;

-- ============================================================
-- 7. EXTEND ORDERS TABLE — POS & delivery tracking
-- ============================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'dine_in'
  CHECK (order_type IN ('dine_in', 'pickup', 'delivery'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS external_order_id TEXT;  -- POS order ID
ALTER TABLE orders ADD COLUMN IF NOT EXISTS external_provider TEXT;  -- Which POS pushed it
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tip_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid'
  CHECK (payment_status IN ('unpaid', 'paid', 'refunded', 'partial_refund'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_ready_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email TEXT;

-- ============================================================
-- 8. NOTIFICATIONS TABLE — for future notification service
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  
  -- Target
  target_type TEXT NOT NULL CHECK (target_type IN ('owner', 'staff', 'customer')),
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_contact TEXT, -- phone/email for non-users
  
  -- Content
  channel TEXT NOT NULL CHECK (channel IN ('in_app', 'email', 'sms', 'whatsapp', 'push')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read')),
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  error TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_restaurant ON notifications(restaurant_id);
CREATE INDEX idx_notifications_target ON notifications(target_user_id);
CREATE INDEX idx_notifications_status ON notifications(status);

-- RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_owner_select"
  ON notifications FOR SELECT
  USING (user_owns_restaurant(restaurant_id) OR target_user_id = auth.uid());

CREATE POLICY "notifications_system_insert"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "notifications_user_update"
  ON notifications FOR UPDATE
  USING (target_user_id = auth.uid());

-- ============================================================
-- 9. AUTO-UPDATE updated_at TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_webhooks_updated_at
  BEFORE UPDATE ON webhook_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- DONE — Verify tables were created
-- ============================================================
-- Run this separately:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- ORDER BY table_name;
