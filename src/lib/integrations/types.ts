/**
 * MENIUS Integration Service — Type Definitions
 * 
 * These types define the contract for all external integrations.
 * Every POS adapter, webhook handler, and notification service
 * must implement these interfaces.
 * 
 * All integrations are tenant-scoped: every operation requires
 * a restaurantId to ensure data isolation.
 */

// ============================================================
// PROVIDER TYPES
// ============================================================

export type PosProvider = 'pos_toast' | 'pos_square' | 'pos_clover';
export type NotificationProvider = 'twilio_sms' | 'twilio_whatsapp' | 'email_sendgrid' | 'email_resend';
export type AutomationProvider = 'n8n' | 'zapier';
export type PaymentProvider = 'stripe_connect';
export type IntegrationProvider = PosProvider | NotificationProvider | AutomationProvider | PaymentProvider | 'custom_webhook';

export type IntegrationStatus = 'active' | 'inactive' | 'error' | 'pending_auth';

// ============================================================
// INTEGRATION CONFIG (stored in DB as JSONB)
// ============================================================

export interface ToastConfig {
  apiKey: string;
  restaurantGuid: string;
  environment: 'sandbox' | 'production';
  managementGroupGuid?: string;
}

export interface SquareConfig {
  accessToken: string;
  locationId: string;
  environment: 'sandbox' | 'production';
  applicationId?: string;
}

export interface CloverConfig {
  apiToken: string;
  merchantId: string;
  environment: 'sandbox' | 'production';
  appId?: string;
}

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;       // for SMS
  whatsappNumber?: string;  // for WhatsApp
}

export interface WebhookConfig {
  url: string;
  secret: string;
  headers?: Record<string, string>;
}

export type IntegrationConfig = 
  | ToastConfig 
  | SquareConfig 
  | CloverConfig 
  | TwilioConfig 
  | WebhookConfig
  | Record<string, unknown>;

// ============================================================
// POS DATA MODELS (Normalized)
// ============================================================

/** A menu item as understood by any POS system */
export interface PosMenuItem {
  externalId: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  imageUrl?: string;
  isAvailable: boolean;
  modifiers?: PosModifier[];
}

export interface PosModifier {
  externalId: string;
  name: string;
  price: number;
  isRequired: boolean;
  options: PosModifierOption[];
}

export interface PosModifierOption {
  externalId: string;
  name: string;
  price: number;
}

/** An order as understood by any POS system */
export interface PosOrder {
  externalId?: string;
  orderNumber: string;
  status: string;
  items: PosOrderItem[];
  customerName?: string;
  customerPhone?: string;
  orderType: 'dine_in' | 'pickup' | 'delivery';
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  createdAt: string;
}

export interface PosOrderItem {
  externalProductId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  modifiers?: { name: string; price: number }[];
  notes?: string;
}

// ============================================================
// POS ADAPTER INTERFACE
// ============================================================

/**
 * Every POS adapter must implement this interface.
 * This ensures a consistent API regardless of which POS is used.
 */
export interface PosAdapter {
  /** Provider identifier */
  provider: PosProvider;

  /** Test the connection to the POS */
  testConnection(config: IntegrationConfig): Promise<{ success: boolean; error?: string }>;

  /** Push a menu to the POS (our menu → POS) */
  pushMenu(config: IntegrationConfig, items: PosMenuItem[]): Promise<SyncResult>;

  /** Pull menu from POS (POS → our format) */
  pullMenu(config: IntegrationConfig): Promise<{ items: PosMenuItem[]; error?: string }>;

  /** Push an order to the POS (new online order → POS) */
  pushOrder(config: IntegrationConfig, order: PosOrder): Promise<{ externalId?: string; error?: string }>;

  /** Pull order status from POS */
  pullOrderStatus(config: IntegrationConfig, externalOrderId: string): Promise<{ status: string; error?: string }>;
}

export interface SyncResult {
  success: boolean;
  itemsProcessed: number;
  itemsFailed: number;
  errors: { itemId: string; error: string }[];
}

// ============================================================
// WEBHOOK EVENT TYPES
// ============================================================

export type WebhookEventType =
  | 'order.created'
  | 'order.updated'
  | 'order.cancelled'
  | 'menu.updated'
  | 'product.created'
  | 'product.updated'
  | 'restaurant.updated'
  | 'payment.received'
  | 'payment.refunded'
  | '*';

export interface WebhookPayload {
  event: WebhookEventType;
  restaurantId: string;
  timestamp: string;
  data: Record<string, unknown>;
}

// ============================================================
// NOTIFICATION TYPES
// ============================================================

export interface NotificationPayload {
  channel: 'in_app' | 'email' | 'sms' | 'whatsapp' | 'push';
  to: string;  // email, phone number, or user ID
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

// ============================================================
// INTEGRATION RECORD (as stored in DB)
// ============================================================

export interface Integration {
  id: string;
  restaurant_id: string;
  provider: IntegrationProvider;
  name: string;
  status: IntegrationStatus;
  config: IntegrationConfig;
  data_mapping: Record<string, unknown>;
  last_sync_at: string | null;
  last_sync_status: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}
