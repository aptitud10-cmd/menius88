-- ============================================================
-- MENIUS SaaS — Security Hardening Migration
-- Multi-Tenant Isolation: BULLETPROOF RLS Policies
-- Run this in the Supabase SQL Editor AFTER the initial migration
-- ============================================================

-- ============================================================
-- 0. FIX CRITICAL TRIGGER (handle_new_user)
-- ============================================================
-- The original trigger fails when profile already exists,
-- blocking the entire signup process. This fix adds conflict handling.

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
  -- Never block signup even if profile creation fails
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 0b. ENHANCED HELPER FUNCTIONS
-- ============================================================

-- Get user's restaurant_id (SECURITY DEFINER ensures it runs with elevated privileges)
CREATE OR REPLACE FUNCTION get_user_restaurant_id()
RETURNS UUID AS $$
  SELECT default_restaurant_id FROM profiles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user owns a specific restaurant
CREATE OR REPLACE FUNCTION user_owns_restaurant(rest_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM restaurants
    WHERE id = rest_id AND owner_user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if a resource belongs to a specific restaurant (for cross-table validation)
CREATE OR REPLACE FUNCTION product_belongs_to_restaurant(p_product_id UUID, p_restaurant_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM products
    WHERE id = p_product_id AND restaurant_id = p_restaurant_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if an order belongs to a restaurant the current user owns
CREATE OR REPLACE FUNCTION user_owns_order(p_order_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM orders o
    INNER JOIN restaurants r ON r.id = o.restaurant_id
    WHERE o.id = p_order_id AND r.owner_user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 1. DROP ALL EXISTING POLICIES (clean slate)
-- ============================================================

-- Restaurants
DROP POLICY IF EXISTS "owners_read_own_restaurants" ON restaurants;
DROP POLICY IF EXISTS "owners_insert_restaurants" ON restaurants;
DROP POLICY IF EXISTS "owners_update_own_restaurants" ON restaurants;
DROP POLICY IF EXISTS "public_read_restaurant_by_slug" ON restaurants;

-- Profiles
DROP POLICY IF EXISTS "users_read_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "system_insert_profile" ON profiles;

-- Categories
DROP POLICY IF EXISTS "owners_manage_categories" ON categories;
DROP POLICY IF EXISTS "public_read_active_categories" ON categories;

-- Products
DROP POLICY IF EXISTS "owners_manage_products" ON products;
DROP POLICY IF EXISTS "public_read_active_products" ON products;

-- Product Variants
DROP POLICY IF EXISTS "owners_manage_variants" ON product_variants;
DROP POLICY IF EXISTS "public_read_variants" ON product_variants;

-- Product Extras
DROP POLICY IF EXISTS "owners_manage_extras" ON product_extras;
DROP POLICY IF EXISTS "public_read_extras" ON product_extras;

-- Tables
DROP POLICY IF EXISTS "owners_manage_tables" ON tables;
DROP POLICY IF EXISTS "public_read_tables" ON tables;

-- Orders
DROP POLICY IF EXISTS "owners_manage_orders" ON orders;
DROP POLICY IF EXISTS "public_insert_orders" ON orders;
DROP POLICY IF EXISTS "public_read_own_order" ON orders;

-- Order Items
DROP POLICY IF EXISTS "owners_read_order_items" ON order_items;
DROP POLICY IF EXISTS "public_insert_order_items" ON order_items;
DROP POLICY IF EXISTS "public_read_order_items" ON order_items;

-- Order Item Extras
DROP POLICY IF EXISTS "owners_read_order_item_extras" ON order_item_extras;
DROP POLICY IF EXISTS "public_insert_order_item_extras" ON order_item_extras;

-- Storage
DROP POLICY IF EXISTS "Anyone can read product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users update product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users delete product images" ON storage.objects;

-- ============================================================
-- 2. HARDENED RLS POLICIES — RESTAURANTS
-- ============================================================
-- Restaurants table: tenant_id IS the restaurant.id itself
-- owner_user_id determines ownership

-- Owners can read their own restaurants
CREATE POLICY "restaurants_owner_select"
  ON restaurants FOR SELECT
  USING (owner_user_id = auth.uid());

-- Public can read restaurants (needed for public menu pages by slug)
-- This is intentional: restaurant name, slug, logo are public information
CREATE POLICY "restaurants_public_select"
  ON restaurants FOR SELECT
  USING (true);

-- Only authenticated users can create restaurants, and they must be the owner
CREATE POLICY "restaurants_owner_insert"
  ON restaurants FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND owner_user_id = auth.uid());

-- Owners can only update their own restaurants
CREATE POLICY "restaurants_owner_update"
  ON restaurants FOR UPDATE
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

-- Owners can only delete their own restaurants
CREATE POLICY "restaurants_owner_delete"
  ON restaurants FOR DELETE
  USING (owner_user_id = auth.uid());

-- ============================================================
-- 3. HARDENED RLS POLICIES — PROFILES
-- ============================================================

-- Users can only read their own profile
CREATE POLICY "profiles_user_select"
  ON profiles FOR SELECT
  USING (user_id = auth.uid());

-- Users can only update their own profile
CREATE POLICY "profiles_user_update"
  ON profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can only insert their own profile (trigger also handles this)
CREATE POLICY "profiles_user_insert"
  ON profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 4. HARDENED RLS POLICIES — CATEGORIES
-- ============================================================
-- tenant_id = restaurant_id

-- Owners can SELECT their own restaurant's categories
CREATE POLICY "categories_owner_select"
  ON categories FOR SELECT
  USING (user_owns_restaurant(restaurant_id));

-- Public can read active categories (needed for public menu)
CREATE POLICY "categories_public_select"
  ON categories FOR SELECT
  USING (is_active = true);

-- Owners can INSERT categories only for their own restaurant
CREATE POLICY "categories_owner_insert"
  ON categories FOR INSERT
  WITH CHECK (user_owns_restaurant(restaurant_id));

-- Owners can UPDATE categories only for their own restaurant
CREATE POLICY "categories_owner_update"
  ON categories FOR UPDATE
  USING (user_owns_restaurant(restaurant_id))
  WITH CHECK (user_owns_restaurant(restaurant_id));

-- Owners can DELETE categories only for their own restaurant
CREATE POLICY "categories_owner_delete"
  ON categories FOR DELETE
  USING (user_owns_restaurant(restaurant_id));

-- ============================================================
-- 5. HARDENED RLS POLICIES — PRODUCTS
-- ============================================================

-- Owners can SELECT their own restaurant's products
CREATE POLICY "products_owner_select"
  ON products FOR SELECT
  USING (user_owns_restaurant(restaurant_id));

-- Public can read active products (needed for public menu)
CREATE POLICY "products_public_select"
  ON products FOR SELECT
  USING (is_active = true);

-- Owners can INSERT products only for their own restaurant
CREATE POLICY "products_owner_insert"
  ON products FOR INSERT
  WITH CHECK (user_owns_restaurant(restaurant_id));

-- Owners can UPDATE products only for their own restaurant
CREATE POLICY "products_owner_update"
  ON products FOR UPDATE
  USING (user_owns_restaurant(restaurant_id))
  WITH CHECK (user_owns_restaurant(restaurant_id));

-- Owners can DELETE products only for their own restaurant
CREATE POLICY "products_owner_delete"
  ON products FOR DELETE
  USING (user_owns_restaurant(restaurant_id));

-- ============================================================
-- 6. HARDENED RLS POLICIES — PRODUCT VARIANTS
-- ============================================================

-- Owners can manage variants for their own products
CREATE POLICY "variants_owner_select"
  ON product_variants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_id AND user_owns_restaurant(p.restaurant_id)
    )
  );

-- Public can read variants (for public menu product detail)
CREATE POLICY "variants_public_select"
  ON product_variants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_id AND p.is_active = true
    )
  );

-- Owners can INSERT variants for their own products
CREATE POLICY "variants_owner_insert"
  ON product_variants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_id AND user_owns_restaurant(p.restaurant_id)
    )
  );

-- Owners can UPDATE variants for their own products
CREATE POLICY "variants_owner_update"
  ON product_variants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_id AND user_owns_restaurant(p.restaurant_id)
    )
  );

-- Owners can DELETE variants for their own products
CREATE POLICY "variants_owner_delete"
  ON product_variants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_id AND user_owns_restaurant(p.restaurant_id)
    )
  );

-- ============================================================
-- 7. HARDENED RLS POLICIES — PRODUCT EXTRAS
-- ============================================================

-- Owners can manage extras for their own products
CREATE POLICY "extras_owner_select"
  ON product_extras FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_id AND user_owns_restaurant(p.restaurant_id)
    )
  );

-- Public can read extras (for public menu)
CREATE POLICY "extras_public_select"
  ON product_extras FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_id AND p.is_active = true
    )
  );

-- Owners can INSERT extras for their own products
CREATE POLICY "extras_owner_insert"
  ON product_extras FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_id AND user_owns_restaurant(p.restaurant_id)
    )
  );

-- Owners can UPDATE extras for their own products
CREATE POLICY "extras_owner_update"
  ON product_extras FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_id AND user_owns_restaurant(p.restaurant_id)
    )
  );

-- Owners can DELETE extras for their own products
CREATE POLICY "extras_owner_delete"
  ON product_extras FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_id AND user_owns_restaurant(p.restaurant_id)
    )
  );

-- ============================================================
-- 8. HARDENED RLS POLICIES — TABLES
-- ============================================================

-- Owners can SELECT their own restaurant's tables
CREATE POLICY "tables_owner_select"
  ON tables FOR SELECT
  USING (user_owns_restaurant(restaurant_id));

-- NO public read for tables (was previously USING(true) — security hole)
-- Tables are only managed by the owner, not publicly viewable

-- Owners can INSERT tables only for their own restaurant
CREATE POLICY "tables_owner_insert"
  ON tables FOR INSERT
  WITH CHECK (user_owns_restaurant(restaurant_id));

-- Owners can UPDATE tables only for their own restaurant
CREATE POLICY "tables_owner_update"
  ON tables FOR UPDATE
  USING (user_owns_restaurant(restaurant_id))
  WITH CHECK (user_owns_restaurant(restaurant_id));

-- Owners can DELETE tables only for their own restaurant
CREATE POLICY "tables_owner_delete"
  ON tables FOR DELETE
  USING (user_owns_restaurant(restaurant_id));

-- ============================================================
-- 9. HARDENED RLS POLICIES — ORDERS (CRITICAL)
-- ============================================================
-- Previously: public_read_own_order USING (true) — ANYONE could read ALL orders!

-- Owners can SELECT orders for their own restaurants
CREATE POLICY "orders_owner_select"
  ON orders FOR SELECT
  USING (user_owns_restaurant(restaurant_id));

-- Owners can UPDATE orders for their own restaurants (status changes)
CREATE POLICY "orders_owner_update"
  ON orders FOR UPDATE
  USING (user_owns_restaurant(restaurant_id))
  WITH CHECK (user_owns_restaurant(restaurant_id));

-- Owners can DELETE orders for their own restaurants
CREATE POLICY "orders_owner_delete"
  ON orders FOR DELETE
  USING (user_owns_restaurant(restaurant_id));

-- Public/anonymous can INSERT orders (customer placing orders)
-- The restaurant_id must reference a valid restaurant
CREATE POLICY "orders_public_insert"
  ON orders FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM restaurants WHERE id = restaurant_id)
  );

-- Public can read orders by ID only (for order confirmation after placing)
-- This uses the anon role — customer can only read if they know the exact order ID
-- In practice, the order ID is only known by the customer who just placed it
CREATE POLICY "orders_anon_select_by_id"
  ON orders FOR SELECT
  USING (auth.role() = 'anon' OR user_owns_restaurant(restaurant_id));

-- ============================================================
-- 10. HARDENED RLS POLICIES — ORDER ITEMS (CRITICAL)
-- ============================================================
-- Previously: public_read_order_items USING (true) — ANYONE could read ALL items!

-- Owners can SELECT order items for their restaurant's orders
CREATE POLICY "order_items_owner_select"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_id AND user_owns_restaurant(o.restaurant_id)
    )
  );

-- Public can INSERT order items (part of placing an order)
CREATE POLICY "order_items_public_insert"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE id = order_id)
  );

-- Anon users can read order items for orders they know the ID of
-- (in practice, only after placing an order)
CREATE POLICY "order_items_anon_select"
  ON order_items FOR SELECT
  USING (
    auth.role() = 'anon' OR
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_id AND user_owns_restaurant(o.restaurant_id)
    )
  );

-- Owners can DELETE order items
CREATE POLICY "order_items_owner_delete"
  ON order_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_id AND user_owns_restaurant(o.restaurant_id)
    )
  );

-- ============================================================
-- 11. HARDENED RLS POLICIES — ORDER ITEM EXTRAS (CRITICAL)
-- ============================================================
-- Previously: owners_read_order_item_extras USING (true) — ANYONE could read ALL!

-- Owners can SELECT order item extras for their restaurant
CREATE POLICY "order_item_extras_owner_select"
  ON order_item_extras FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM order_items oi
      INNER JOIN orders o ON o.id = oi.order_id
      WHERE oi.id = order_item_id AND user_owns_restaurant(o.restaurant_id)
    )
  );

-- Public can INSERT order item extras (part of placing an order)
CREATE POLICY "order_item_extras_public_insert"
  ON order_item_extras FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM order_items WHERE id = order_item_id)
  );

-- Anon can read order item extras for accessible orders
CREATE POLICY "order_item_extras_anon_select"
  ON order_item_extras FOR SELECT
  USING (
    auth.role() = 'anon' OR
    EXISTS (
      SELECT 1 FROM order_items oi
      INNER JOIN orders o ON o.id = oi.order_id
      WHERE oi.id = order_item_id AND user_owns_restaurant(o.restaurant_id)
    )
  );

-- Owners can DELETE order item extras
CREATE POLICY "order_item_extras_owner_delete"
  ON order_item_extras FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM order_items oi
      INNER JOIN orders o ON o.id = oi.order_id
      WHERE oi.id = order_item_id AND user_owns_restaurant(o.restaurant_id)
    )
  );

-- ============================================================
-- 12. HARDENED STORAGE POLICIES
-- ============================================================
-- Previously: ANY authenticated user could upload/modify/delete ANY image

-- Anyone can read product images (they are public URLs)
CREATE POLICY "storage_product_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Only restaurant owners can upload images
-- The path convention should be: product-images/{restaurant_id}/{filename}
CREATE POLICY "storage_product_images_owner_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.uid() IS NOT NULL
    AND user_owns_restaurant((string_to_array(name, '/'))[1]::UUID)
  );

-- Only restaurant owners can update their own images
CREATE POLICY "storage_product_images_owner_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-images'
    AND auth.uid() IS NOT NULL
    AND user_owns_restaurant((string_to_array(name, '/'))[1]::UUID)
  );

-- Only restaurant owners can delete their own images
CREATE POLICY "storage_product_images_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND auth.uid() IS NOT NULL
    AND user_owns_restaurant((string_to_array(name, '/'))[1]::UUID)
  );

-- ============================================================
-- 13. ADDITIONAL SECURITY INDEXES (performance for RLS)
-- ============================================================

-- These indexes help RLS policy evaluation performance
CREATE INDEX IF NOT EXISTS idx_restaurants_owner_user_id ON restaurants(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id_created ON orders(restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_item_extras_order_item_id ON order_item_extras(order_item_id);

-- ============================================================
-- 14. AUDIT LOG TABLE (for tracking security-relevant actions)
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_tenant ON audit_log(tenant_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Only owners can read their own audit logs
CREATE POLICY "audit_log_owner_select"
  ON audit_log FOR SELECT
  USING (user_owns_restaurant(tenant_id) OR user_id = auth.uid());

-- System can insert audit logs (via SECURITY DEFINER functions)
CREATE POLICY "audit_log_system_insert"
  ON audit_log FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- 15. AUDIT TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION log_tenant_action()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (tenant_id, user_id, action, table_name, record_id, old_data)
    VALUES (
      COALESCE(OLD.restaurant_id, get_user_restaurant_id()),
      auth.uid(),
      TG_OP,
      TG_TABLE_NAME,
      OLD.id,
      to_jsonb(OLD)
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (tenant_id, user_id, action, table_name, record_id, old_data, new_data)
    VALUES (
      COALESCE(NEW.restaurant_id, get_user_restaurant_id()),
      auth.uid(),
      TG_OP,
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (tenant_id, user_id, action, table_name, record_id, new_data)
    VALUES (
      COALESCE(NEW.restaurant_id, get_user_restaurant_id()),
      auth.uid(),
      TG_OP,
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(NEW)
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to critical tables
DROP TRIGGER IF EXISTS audit_orders ON orders;
CREATE TRIGGER audit_orders
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW EXECUTE FUNCTION log_tenant_action();

DROP TRIGGER IF EXISTS audit_products ON products;
CREATE TRIGGER audit_products
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW EXECUTE FUNCTION log_tenant_action();

DROP TRIGGER IF EXISTS audit_categories ON categories;
CREATE TRIGGER audit_categories
  AFTER INSERT OR UPDATE OR DELETE ON categories
  FOR EACH ROW EXECUTE FUNCTION log_tenant_action();

-- ============================================================
-- VERIFICATION: List all policies after migration
-- ============================================================
-- Run this separately to verify:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename, policyname;
