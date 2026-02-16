'use server';

import { createClient } from '@/lib/supabase/server';

export type AuditAction =
  | 'create' | 'update' | 'delete'
  | 'login' | 'logout'
  | 'status_change' | 'toggle'
  | 'export' | 'import'
  | 'invite' | 'revoke'
  | 'payment' | 'refund'
  | 'config_change';

export type AuditEntity =
  | 'product' | 'category' | 'order' | 'table'
  | 'staff' | 'invitation' | 'promotion'
  | 'review' | 'reservation' | 'customer'
  | 'restaurant' | 'inventory' | 'expense'
  | 'delivery_zone' | 'translation' | 'menu'
  | 'loyalty' | 'waitlist' | 'theme' | 'settings'
  | 'subscription' | 'payment_link';

interface AuditEntry {
  restaurantId: string;
  userId: string;
  userEmail: string;
  action: AuditAction;
  entityType: AuditEntity;
  entityId?: string;
  details?: Record<string, any>;
}

/**
 * Log an audit event. Fire-and-forget (non-blocking).
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.from('audit_log').insert({
      restaurant_id: entry.restaurantId,
      user_id: entry.userId,
      user_email: entry.userEmail,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId ?? null,
      details: entry.details ?? {},
    });
  } catch {
    // Audit logging should never block operations
  }
}
