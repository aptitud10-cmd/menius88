// ============================================================
// MENIUS — Types
// ============================================================

// ---- Theme & Configuration ----

export interface RestaurantTheme {
  primaryColor: string;
  accentColor: string;
  fontHeading: string;
  fontBody: string;
  borderRadius: string;
  darkMode: boolean;
}

export interface DaySchedule {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export interface OrderConfig {
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  dineInEnabled: boolean;
  deliveryFee: number;
  deliveryMinOrder: number;
  deliveryRadius: number;
  estimatedPrepTime: number;
  autoAcceptOrders: boolean;
  taxRate: number;
}

export type SubscriptionPlan = 'trial' | 'basic' | 'pro' | 'premium' | 'enterprise' | 'cancelled';

// ---- Restaurant (Extended) ----

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  owner_user_id: string;
  timezone: string;
  currency: string;
  logo_url: string | null;
  created_at: string;
  // Premium storefront fields
  tagline?: string;
  description?: string;
  cover_image_url?: string;
  cuisine_type?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  theme?: RestaurantTheme;
  operating_hours?: DaySchedule[];
  order_config?: OrderConfig;
  // Subscription
  subscription_plan?: SubscriptionPlan;
  trial_ends_at?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  stripe_connect_account_id?: string;
  is_active?: boolean;
}

export interface Profile {
  user_id: string;
  full_name: string;
  role: 'super_admin' | 'owner' | 'staff';
  default_restaurant_id: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  restaurant_id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  // Menu scheduling
  available_from?: string | null;
  available_until?: string | null;
  available_days?: string[] | null;
  schedule_label?: string | null;
}

export interface Product {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  // POS integration fields
  external_id?: string;
  external_provider?: string;
  allergens?: string[];
  dietary_tags?: string[]; // vegetarian, vegan, gluten-free
  prep_time_minutes?: number;
  calories?: number;
  // Menu scheduling
  available_from?: string | null;
  available_until?: string | null;
  available_days?: string[] | null;
  // joined
  variants?: ProductVariant[];
  extras?: ProductExtra[];
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  price_delta: number;
  sort_order: number;
}

export interface ProductExtra {
  id: string;
  product_id: string;
  name: string;
  price: number;
  sort_order: number;
}

export interface Table {
  id: string;
  restaurant_id: string;
  name: string;
  qr_code_value: string;
  is_active: boolean;
  created_at: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type OrderType = 'dine_in' | 'pickup' | 'delivery';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'partial_refund';

export interface Order {
  id: string;
  restaurant_id: string;
  table_id: string | null;
  order_number: string;
  status: OrderStatus;
  customer_name: string;
  notes: string;
  total: number;
  created_at: string;
  // Extended fields
  order_type?: OrderType;
  external_order_id?: string;
  external_provider?: string;
  delivery_address?: string;
  delivery_fee?: number;
  tax_amount?: number;
  subtotal?: number;
  tip_amount?: number;
  payment_status?: PaymentStatus;
  payment_method?: string;
  stripe_payment_intent_id?: string;
  estimated_ready_at?: string;
  customer_phone?: string;
  customer_email?: string;
  // joined
  items?: OrderItem[];
  table?: Table;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  qty: number;
  unit_price: number;
  line_total: number;
  notes: string;
  // joined
  product?: Product;
  variant?: ProductVariant;
  extras?: OrderItemExtra[];
}

export interface OrderItemExtra {
  id: string;
  order_item_id: string;
  extra_id: string;
  price: number;
  // joined
  extra?: ProductExtra;
}

// ---- Cart (client-side) ----
export interface CartItem {
  product: Product;
  variant: ProductVariant | null;
  extras: ProductExtra[];
  qty: number;
  notes: string;
  lineTotal: number;
}
