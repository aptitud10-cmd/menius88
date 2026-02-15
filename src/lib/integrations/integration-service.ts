/**
 * MENIUS — Integration Service
 * 
 * Central registry and factory for all POS adapters and integrations.
 * This service is the single entry point for:
 * - Getting the right adapter for a POS provider
 * - Managing integration lifecycle (connect, sync, disconnect)
 * - Logging sync operations
 * 
 * ALL operations are tenant-scoped via restaurantId.
 */

import type { PosAdapter, PosProvider, IntegrationProvider, Integration } from './types';
import { ToastAdapter } from './adapters/toast-adapter';
import { SquareAdapter } from './adapters/square-adapter';
import { CloverAdapter } from './adapters/clover-adapter';
import { createClient } from '@/lib/supabase/server';

// ============================================================
// ADAPTER REGISTRY
// ============================================================

const adapterRegistry: Record<PosProvider, () => PosAdapter> = {
  pos_toast: () => new ToastAdapter(),
  pos_square: () => new SquareAdapter(),
  pos_clover: () => new CloverAdapter(),
};

/**
 * Get the POS adapter for a given provider.
 */
export function getPosAdapter(provider: PosProvider): PosAdapter {
  const factory = adapterRegistry[provider];
  if (!factory) {
    throw new Error(`Unknown POS provider: ${provider}`);
  }
  return factory();
}

/**
 * Check if a provider is a POS provider.
 */
export function isPosProvider(provider: string): provider is PosProvider {
  return provider in adapterRegistry;
}

// ============================================================
// INTEGRATION CRUD (tenant-scoped)
// ============================================================

/**
 * Get all integrations for a restaurant.
 */
export async function getIntegrations(restaurantId: string): Promise<Integration[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch integrations: ${error.message}`);
  return (data ?? []) as Integration[];
}

/**
 * Get a specific integration by provider for a restaurant.
 */
export async function getIntegration(
  restaurantId: string,
  provider: IntegrationProvider
): Promise<Integration | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('provider', provider)
    .single();

  if (error) return null;
  return data as Integration;
}

/**
 * Create or update an integration for a restaurant.
 */
export async function upsertIntegration(
  restaurantId: string,
  provider: IntegrationProvider,
  config: Record<string, unknown>,
  name?: string
): Promise<{ integration?: Integration; error?: string }> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('integrations')
    .upsert({
      restaurant_id: restaurantId,
      provider,
      name: name || provider,
      config,
      status: 'inactive',
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'restaurant_id,provider',
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { integration: data as Integration };
}

/**
 * Test a POS connection and update integration status.
 */
export async function testPosConnection(
  restaurantId: string,
  provider: PosProvider
): Promise<{ success: boolean; error?: string }> {
  const integration = await getIntegration(restaurantId, provider);
  if (!integration) return { success: false, error: 'Integration not configured' };

  const adapter = getPosAdapter(provider);
  const result = await adapter.testConnection(integration.config);

  // Update status based on test result
  const supabase = createClient();
  await supabase
    .from('integrations')
    .update({
      status: result.success ? 'active' : 'error',
      last_sync_status: result.success ? 'connected' : 'connection_failed',
      last_error: result.error || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', integration.id)
    .eq('restaurant_id', restaurantId); // Tenant guard

  return result;
}

/**
 * Delete an integration for a restaurant.
 */
export async function deleteIntegration(
  restaurantId: string,
  provider: IntegrationProvider
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase
    .from('integrations')
    .delete()
    .eq('restaurant_id', restaurantId)
    .eq('provider', provider);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ============================================================
// SYNC LOGGING
// ============================================================

/**
 * Log a POS sync operation.
 */
export async function logPosSync(
  integrationId: string,
  restaurantId: string,
  syncType: string,
  direction: 'inbound' | 'outbound',
  result: { itemsProcessed: number; itemsFailed: number; errors?: unknown[] }
): Promise<void> {
  const supabase = createClient();
  await supabase.from('pos_sync_log').insert({
    integration_id: integrationId,
    restaurant_id: restaurantId,
    sync_type: syncType,
    direction,
    status: result.itemsFailed === 0 ? 'success' : (result.itemsProcessed > 0 ? 'partial' : 'failed'),
    items_processed: result.itemsProcessed,
    items_failed: result.itemsFailed,
    error_details: result.errors || [],
    completed_at: new Date().toISOString(),
  });
}
