-- ============================================================
-- MENIUS SaaS — MASTER MIGRATION (Consolidated)
-- Run this ONCE in the Supabase SQL Editor for a fresh install.
-- Contains ALL tables, columns, functions, triggers, RLS, and indexes.
-- Generated: Feb 2026
-- ============================================================

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. CORE TABLES
-- ============================================================

-- Restaurants (tenants)
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timezone TEXT DEFAULT 'America/Mexico_City',
  currency TEXT DEFAULT 'MXN',
  logo_url TEXT,
  -- Premium storefront
  tagline TEXT DEFAULT '',
  description TEXT DEFAULT '',
  cover_image_url TEXT DEFAULT '',
  cuisine_type TEXT DEFAULT '',
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  website TEXT DEFAULT '',
  -- Theme (JSONB)
  theme JSONB DEFAULT '{"primaryColor":"#2563eb","accentColor":"#d4a574","fontHeading":"Playfair Display","fontBody":"Inter","borderRadius":"xl","darkMode":false}'::jsonb,
  -- Operating hours (JSONB array)
  operating_hours JSONB DEFAULT '[{"day":"monday","open":"09:00","close":"22:00","closed":false},{"day":"tuesday","open":"09:00","close":"22:00","closed":false},{"day":"wednesday","open":"09:00","close":"22:00","closed":false},{"day":"thursday","open":"09:00","close":"22:00","closed":false},{"day":"friday","open":"09:00","close":"23:00","closed":false},{"day":"saturday","open":"10:00","close":"23:00","closed":false},{"day":"sunday","open":"10:00","close":"21:00","closed":false}]'::jsonb,
  -- Order config
  order_config JSONB DEFAULT '{"deliveryEnabled":false,"pickupEnabled":true,"dineInEnabled":true,"deliveryFee":0,"deliveryMinOrder":0,"deliveryRadius":5,"estimatedPrepTime":20,"autoAcceptOrders":false,"taxRate":0.16}'::jsonb,
  -- Subscription
  subscription_plan TEXT DEFAULT 'trial' CHECK (subscription_plan IN ('trial','basic','pro','premium','enterprise','cancelled')),
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '13 days'),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_connect_account_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  -- Multi-language
  default_language TEXT DEFAULT 'es',
  supported_languages TEXT[] DEFAULT ARRAY['es'],
  -- Loyalty
  loyalty_config JSONB DEFAULT '{"enabled":false,"pointsPerDollar":10,"redeemThreshold":100,"redeemValue":5}'::jsonb,
  -- Reservations
  reservation_config JSONB DEFAULT '{"enabled":false,"maxPartySize":12,"slotDuration":90,"advanceDays":30,"timeSlots":["12:00","12:30","13:00","13:30","14:00","14:30","19:00","19:30","20:00","20:30","21:00","21:30"],"autoConfirm":false}'::jsonb,
  -- Reports
  report_config JSONB DEFAULT '{"weeklyReport":true,"reportEmail":null,"reportDay":"monday"}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('super_admin','owner','staff')),
  default_restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  -- Menu scheduling
  available_from TEXT DEFAULT NULL,
  available_until TEXT DEFAULT NULL,
  available_days TEXT[] DEFAULT NULL,
  schedule_label TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  image_url TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  -- POS
  external_id TEXT,
  external_provider TEXT,
  -- Dietary
  allergens TEXT[],
  dietary_tags TEXT[],
  prep_time_minutes INTEGER,
  calories INTEGER,
  -- Inventory
  track_inventory BOOLEAN DEFAULT FALSE,
  stock_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  -- Menu scheduling
  available_from TEXT DEFAULT NULL,
  available_until TEXT DEFAULT NULL,
  available_days TEXT[] DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Variants
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_delta DECIMAL(10,2) DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

-- Product Extras
CREATE TABLE IF NOT EXISTS product_extras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10,2) DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

-- Tables
CREATE TABLE IF NOT EXISTS tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  qr_code_value TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  capacity INTEGER DEFAULT 4,
  section TEXT DEFAULT 'main',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. ORDERS
-- ============================================================

CREATE TABLE IF NOT EXISTS promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  description TEXT DEFAULT '',
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage','fixed')),
  discount_value NUMERIC(10,2) NOT NULL,
  min_order_amount NUMERIC(10,2) DEFAULT 0,
  max_uses INTEGER DEFAULT NULL,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id, code)
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','preparing','ready','delivered','cancelled')),
  customer_name TEXT DEFAULT '',
  customer_phone TEXT,
  customer_email TEXT,
  notes TEXT DEFAULT '',
  -- Order type
  order_type TEXT DEFAULT 'dine_in' CHECK (order_type IN ('dine_in','pickup','delivery')),
  delivery_address TEXT,
  delivery_fee NUMERIC(10,2) DEFAULT 0,
  -- Amounts
  subtotal NUMERIC(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  tax_amount NUMERIC(10,2) DEFAULT 0,
  tip_amount NUMERIC(10,2) DEFAULT 0,
  -- Discounts
  discount_code TEXT,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  promotion_id UUID REFERENCES promotions(id),
  -- Scheduling
  scheduled_for TIMESTAMPTZ,
  is_scheduled BOOLEAN DEFAULT FALSE,
  -- Payment
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','paid','refunded','partial_refund')),
  payment_method TEXT,
  stripe_payment_intent_id TEXT,
  -- POS
  external_order_id TEXT,
  external_provider TEXT,
  estimated_ready_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  line_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS order_item_extras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  extra_id UUID NOT NULL REFERENCES product_extras(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL DEFAULT 0
);

-- ============================================================
-- 3. STAFF & INVITATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS staff_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('staff','manager')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','expired','revoked')),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS restaurant_staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('staff','manager')),
  is_active BOOLEAN DEFAULT TRUE,
  permissions JSONB DEFAULT '{"orders":{"view":true,"manage":true},"menu":{"view":true,"manage":false},"inventory":{"view":true,"manage":false},"analytics":{"view":false,"manage":false},"staff":{"view":false,"manage":false},"settings":{"view":false,"manage":false},"billing":{"view":false,"manage":false},"promotions":{"view":true,"manage":false},"reviews":{"view":true,"manage":false},"customers":{"view":true,"manage":false},"reservations":{"view":true,"manage":true},"kitchen":{"view":true,"manage":true}}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id, user_id)
);

-- ============================================================
-- 4. REVIEWS
-- ============================================================

CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  is_visible BOOLEAN DEFAULT TRUE,
  owner_response TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. TRANSLATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS product_translations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, language)
);

CREATE TABLE IF NOT EXISTS category_translations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, language)
);

-- ============================================================
-- 6. INVENTORY LOG
-- ============================================================

CREATE TABLE IF NOT EXISTS inventory_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL CHECK (change_type IN ('restock','order','adjustment','initial')),
  quantity_change INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  notes TEXT DEFAULT '',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. LOYALTY
-- ============================================================

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

CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES loyalty_customers(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('earn','redeem','bonus','expire')),
  points INTEGER NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. RESERVATIONS & DELIVERY ZONES
-- ============================================================

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
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','seated','completed','cancelled','no_show')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- ============================================================
-- 9. CUSTOMERS
-- ============================================================

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

-- ============================================================
-- 10. WAITLIST & EXPENSES
-- ============================================================

CREATE TABLE IF NOT EXISTS waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT DEFAULT '',
  party_size INTEGER NOT NULL DEFAULT 2,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','notified','seated','cancelled','no_show')),
  estimated_wait INTEGER DEFAULT 15,
  notes TEXT DEFAULT '',
  notified_at TIMESTAMPTZ,
  seated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('food','beverage','supplies','labor','rent','utilities','marketing','maintenance','equipment','other')),
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_frequency TEXT CHECK (recurring_frequency IN ('daily','weekly','biweekly','monthly','yearly')),
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. INTEGRATIONS & WEBHOOKS
-- ============================================================

CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('pos_toast','pos_square','pos_clover','twilio_sms','twilio_whatsapp','n8n','zapier','custom_webhook','stripe_connect','email_sendgrid','email_resend')),
  name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active','inactive','error','pending_auth')),
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  data_mapping JSONB DEFAULT '{}'::jsonb,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id, provider)
);

CREATE TABLE IF NOT EXISTS webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('order.created','order.updated','order.cancelled','menu.updated','product.created','product.updated','restaurant.updated','payment.received','payment.refunded','*')),
  url TEXT NOT NULL,
  secret TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_active BOOLEAN DEFAULT TRUE,
  failure_count INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  last_status_code INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id, event_type, url)
);

-- ============================================================
-- 12. AUDIT LOG
-- ============================================================

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

-- ============================================================
-- 13. FUNCTIONS & TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'owner'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE OR REPLACE FUNCTION generate_order_number(rest_id UUID)
RETURNS TEXT AS $$
DECLARE
  count_today INTEGER;
  today_str TEXT;
BEGIN
  today_str := TO_CHAR(NOW(), 'YYMMDD');
  SELECT COUNT(*) + 1 INTO count_today FROM orders
  WHERE restaurant_id = rest_id AND created_at::DATE = NOW()::DATE;
  RETURN 'ORD-' || today_str || '-' || LPAD(count_today::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_restaurant_id()
RETURNS UUID AS $$
  SELECT default_restaurant_id FROM profiles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION user_owns_restaurant(rest_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM restaurants WHERE id = rest_id AND owner_user_id = auth.uid());
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 14. ROW LEVEL SECURITY
-- ============================================================

-- Restaurants
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_restaurants" ON restaurants FOR SELECT USING (true);
CREATE POLICY "owners_insert_restaurants" ON restaurants FOR INSERT WITH CHECK (owner_user_id = auth.uid());
CREATE POLICY "owners_update_own_restaurants" ON restaurants FOR UPDATE USING (owner_user_id = auth.uid());

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_read_own_profile" ON profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "users_update_own_profile" ON profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "system_insert_profile" ON profiles FOR INSERT WITH CHECK (true);

-- Categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners_manage_categories" ON categories FOR ALL USING (user_owns_restaurant(restaurant_id));
CREATE POLICY "public_read_active_categories" ON categories FOR SELECT USING (is_active = true);

-- Products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners_manage_products" ON products FOR ALL USING (user_owns_restaurant(restaurant_id));
CREATE POLICY "public_read_active_products" ON products FOR SELECT USING (is_active = true);

-- Product Variants
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners_manage_variants" ON product_variants FOR ALL USING (EXISTS (SELECT 1 FROM products p WHERE p.id = product_id AND user_owns_restaurant(p.restaurant_id)));
CREATE POLICY "public_read_variants" ON product_variants FOR SELECT USING (true);

-- Product Extras
ALTER TABLE product_extras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners_manage_extras" ON product_extras FOR ALL USING (EXISTS (SELECT 1 FROM products p WHERE p.id = product_id AND user_owns_restaurant(p.restaurant_id)));
CREATE POLICY "public_read_extras" ON product_extras FOR SELECT USING (true);

-- Tables
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners_manage_tables" ON tables FOR ALL USING (user_owns_restaurant(restaurant_id));
CREATE POLICY "public_read_tables" ON tables FOR SELECT USING (true);

-- Orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners_manage_orders" ON orders FOR ALL USING (user_owns_restaurant(restaurant_id));
CREATE POLICY "public_insert_orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "public_read_own_order" ON orders FOR SELECT USING (true);

-- Order Items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners_read_order_items" ON order_items FOR SELECT USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND user_owns_restaurant(o.restaurant_id)));
CREATE POLICY "public_insert_order_items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "public_read_order_items" ON order_items FOR SELECT USING (true);

-- Order Item Extras
ALTER TABLE order_item_extras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners_read_order_item_extras" ON order_item_extras FOR SELECT USING (true);
CREATE POLICY "public_insert_order_item_extras" ON order_item_extras FOR INSERT WITH CHECK (true);

-- Promotions
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_manages_promotions" ON promotions FOR ALL USING (user_owns_restaurant(restaurant_id));
CREATE POLICY "public_validates_promotions" ON promotions FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

-- Staff
ALTER TABLE staff_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_manages_invitations" ON staff_invitations FOR ALL USING (user_owns_restaurant(restaurant_id));

ALTER TABLE restaurant_staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_manages_staff" ON restaurant_staff FOR ALL USING (user_owns_restaurant(restaurant_id));
CREATE POLICY "staff_reads_own" ON restaurant_staff FOR SELECT USING (user_id = auth.uid());

-- Reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_creates_reviews" ON reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "public_reads_visible_reviews" ON reviews FOR SELECT USING (is_visible = true);
CREATE POLICY "owner_manages_reviews" ON reviews FOR ALL USING (user_owns_restaurant(restaurant_id));

-- Translations
ALTER TABLE product_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_manages_product_translations" ON product_translations FOR ALL USING (product_id IN (SELECT p.id FROM products p JOIN restaurants r ON p.restaurant_id = r.id WHERE r.owner_user_id = auth.uid()));
CREATE POLICY "owner_manages_category_translations" ON category_translations FOR ALL USING (category_id IN (SELECT c.id FROM categories c JOIN restaurants r ON c.restaurant_id = r.id WHERE r.owner_user_id = auth.uid()));
CREATE POLICY "public_reads_product_translations" ON product_translations FOR SELECT USING (true);
CREATE POLICY "public_reads_category_translations" ON category_translations FOR SELECT USING (true);

-- Inventory Log
ALTER TABLE inventory_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_manages_inventory_log" ON inventory_log FOR ALL USING (user_owns_restaurant(restaurant_id));

-- Loyalty
ALTER TABLE loyalty_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_manages_loyalty_customers" ON loyalty_customers FOR ALL USING (user_owns_restaurant(restaurant_id));
CREATE POLICY "owner_manages_loyalty_transactions" ON loyalty_transactions FOR ALL USING (user_owns_restaurant(restaurant_id));
CREATE POLICY "public_reads_own_loyalty" ON loyalty_customers FOR SELECT USING (true);

-- Reservations
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_manages_reservations" ON reservations FOR ALL USING (user_owns_restaurant(restaurant_id));
CREATE POLICY "public_creates_reservations" ON reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "public_reads_reservations" ON reservations FOR SELECT USING (true);

-- Delivery Zones
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_manages_delivery_zones" ON delivery_zones FOR ALL USING (user_owns_restaurant(restaurant_id));
CREATE POLICY "public_reads_delivery_zones" ON delivery_zones FOR SELECT USING (true);

-- Customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_manages_customers" ON customers FOR ALL USING (user_owns_restaurant(restaurant_id));
CREATE POLICY "public_upserts_customer" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "public_reads_customer" ON customers FOR SELECT USING (true);

-- Waitlist
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_manages_waitlist" ON waitlist FOR ALL USING (user_owns_restaurant(restaurant_id));

-- Expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_manages_expenses" ON expenses FOR ALL USING (user_owns_restaurant(restaurant_id));

-- Integrations
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_manages_integrations" ON integrations FOR ALL USING (user_owns_restaurant(restaurant_id));

-- Webhooks
ALTER TABLE webhook_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_manages_webhooks" ON webhook_subscriptions FOR ALL USING (user_owns_restaurant(restaurant_id));

-- Audit Log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_reads_audit_log" ON audit_log FOR ALL USING (user_owns_restaurant(restaurant_id));

-- ============================================================
-- 15. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON restaurants(slug);
CREATE INDEX IF NOT EXISTS idx_restaurants_owner ON restaurants(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_restaurant ON profiles(default_restaurant_id);
CREATE INDEX IF NOT EXISTS idx_categories_restaurant ON categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_products_restaurant ON products(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(restaurant_id, track_inventory, stock_quantity);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_extras_product ON product_extras(product_id);
CREATE INDEX IF NOT EXISTS idx_tables_restaurant ON tables(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_type ON orders(restaurant_id, order_type);
CREATE INDEX IF NOT EXISTS idx_orders_scheduled ON orders(restaurant_id, is_scheduled, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_item_extras_item ON order_item_extras(order_item_id);
CREATE INDEX IF NOT EXISTS idx_promotions_code ON promotions(restaurant_id, code);
CREATE INDEX IF NOT EXISTS idx_staff_invitations_email ON staff_invitations(email);
CREATE INDEX IF NOT EXISTS idx_staff_invitations_token ON staff_invitations(token);
CREATE INDEX IF NOT EXISTS idx_restaurant_staff_user ON restaurant_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_restaurant ON reviews(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order ON reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(restaurant_id, rating);
CREATE INDEX IF NOT EXISTS idx_product_translations_product ON product_translations(product_id, language);
CREATE INDEX IF NOT EXISTS idx_category_translations_category ON category_translations(category_id, language);
CREATE INDEX IF NOT EXISTS idx_inventory_log_product ON inventory_log(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_log_restaurant ON inventory_log(restaurant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_loyalty_customers_phone ON loyalty_customers(restaurant_id, phone);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_customer ON loyalty_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(restaurant_id, date, status);
CREATE INDEX IF NOT EXISTS idx_delivery_zones_restaurant ON delivery_zones(restaurant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(restaurant_id, phone);
CREATE INDEX IF NOT EXISTS idx_customers_last_order ON customers(restaurant_id, last_order_at DESC);
CREATE INDEX IF NOT EXISTS idx_waitlist_active ON waitlist(restaurant_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(restaurant_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(restaurant_id, category);
CREATE INDEX IF NOT EXISTS idx_integrations_restaurant ON integrations(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_restaurant ON audit_log(restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(restaurant_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(restaurant_id, entity_type, entity_id);

-- ============================================================
-- 16. STORAGE BUCKET
-- ============================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "Anyone can read product images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Auth users upload product images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
CREATE POLICY "Auth users update product images" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');
CREATE POLICY "Auth users delete product images" ON storage.objects FOR DELETE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- ============================================================
-- DONE! Your MENIUS database is fully set up.
-- ============================================================
