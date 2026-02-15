/**
 * MENIUS — Integrations Module
 * 
 * Public API for the integrations system.
 * Import from '@/lib/integrations' to access all integration functionality.
 */

// Types
export type {
  IntegrationProvider,
  PosProvider,
  NotificationProvider,
  AutomationProvider,
  PaymentProvider,
  IntegrationStatus,
  IntegrationConfig,
  ToastConfig,
  SquareConfig,
  CloverConfig,
  TwilioConfig,
  WebhookConfig,
  PosAdapter,
  PosMenuItem,
  PosOrder,
  PosOrderItem,
  PosModifier,
  PosModifierOption,
  SyncResult,
  WebhookEventType,
  WebhookPayload,
  NotificationPayload,
  Integration,
} from './types';

// Integration Service (CRUD + POS factory)
export {
  getPosAdapter,
  isPosProvider,
  getIntegrations,
  getIntegration,
  upsertIntegration,
  testPosConnection,
  deleteIntegration,
  logPosSync,
} from './integration-service';

// Webhook Service
export {
  dispatchWebhookEvent,
  processInboundWebhook,
  generateWebhookSignature,
  verifyWebhookSignature,
} from './webhook-service';
