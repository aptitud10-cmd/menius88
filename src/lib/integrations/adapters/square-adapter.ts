/**
 * MENIUS — Square POS Adapter
 * 
 * Connects to Square API for:
 * - Catalog/menu synchronization
 * - Order forwarding
 * - Payment status tracking
 * 
 * Square API docs: https://developer.squareup.com/docs
 * 
 * NOTE: Structural foundation. Full implementation requires
 * Square API credentials and OAuth setup.
 */

import { PosAdapterBase } from '../pos-adapter-base';
import type { SquareConfig, PosMenuItem, PosOrder, SyncResult, IntegrationConfig } from '../types';

const SQUARE_API_BASE = {
  sandbox: 'https://connect.squareupsandbox.com/v2',
  production: 'https://connect.squareup.com/v2',
};

export class SquareAdapter extends PosAdapterBase {
  provider = 'pos_square' as const;

  private getBaseUrl(config: SquareConfig): string {
    return SQUARE_API_BASE[config.environment || 'sandbox'];
  }

  private getHeaders(config: SquareConfig): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.accessToken}`,
      'Square-Version': '2024-01-18',
    };
  }

  async testConnection(config: IntegrationConfig): Promise<{ success: boolean; error?: string }> {
    const sqConfig = config as SquareConfig;
    const { valid, missing } = this.validateConfig(
      sqConfig as unknown as Record<string, unknown>,
      ['accessToken', 'locationId']
    );
    if (!valid) return { success: false, error: `Missing fields: ${missing.join(', ')}` };

    const result = await this.apiRequest(
      `${this.getBaseUrl(sqConfig)}/locations/${sqConfig.locationId}`,
      { headers: this.getHeaders(sqConfig) }
    );

    return { success: result.ok, error: result.error };
  }

  async pushMenu(config: IntegrationConfig, items: PosMenuItem[]): Promise<SyncResult> {
    const sqConfig = config as SquareConfig;
    const errors: { itemId: string; error: string }[] = [];
    
    // Square uses batch upsert for catalog items
    const catalogObjects = items.map(item => this.mapToSquareCatalogObject(item));

    const result = await this.apiRequest(
      `${this.getBaseUrl(sqConfig)}/catalog/batch-upsert`,
      {
        method: 'POST',
        headers: this.getHeaders(sqConfig),
        body: JSON.stringify({
          idempotency_key: `menius-sync-${Date.now()}`,
          batches: [{ objects: catalogObjects }],
        }),
      }
    );

    if (!result.ok) {
      return {
        success: false,
        itemsProcessed: 0,
        itemsFailed: items.length,
        errors: [{ itemId: 'batch', error: result.error || 'Batch upsert failed' }],
      };
    }

    return {
      success: true,
      itemsProcessed: items.length,
      itemsFailed: 0,
      errors,
    };
  }

  async pullMenu(config: IntegrationConfig): Promise<{ items: PosMenuItem[]; error?: string }> {
    const sqConfig = config as SquareConfig;

    const result = await this.apiRequest(
      `${this.getBaseUrl(sqConfig)}/catalog/list?types=ITEM`,
      { headers: this.getHeaders(sqConfig) }
    );

    if (!result.ok) return { items: [], error: result.error };

    const response = result.data as { objects?: unknown[] };
    const items = (response?.objects ?? []).map(obj => this.mapFromSquareCatalogObject(obj));

    return { items };
  }

  async pushOrder(config: IntegrationConfig, order: PosOrder): Promise<{ externalId?: string; error?: string }> {
    const sqConfig = config as SquareConfig;
    const squareOrder = this.mapToSquareOrder(order, sqConfig.locationId);

    const result = await this.apiRequest(
      `${this.getBaseUrl(sqConfig)}/orders`,
      {
        method: 'POST',
        headers: this.getHeaders(sqConfig),
        body: JSON.stringify({
          idempotency_key: `menius-order-${order.orderNumber}`,
          order: squareOrder,
        }),
      }
    );

    if (!result.ok) return { error: result.error };

    const response = result.data as { order?: { id?: string } };
    return { externalId: response?.order?.id };
  }

  async pullOrderStatus(config: IntegrationConfig, externalOrderId: string): Promise<{ status: string; error?: string }> {
    const sqConfig = config as SquareConfig;

    const result = await this.apiRequest(
      `${this.getBaseUrl(sqConfig)}/orders/${externalOrderId}`,
      { headers: this.getHeaders(sqConfig) }
    );

    if (!result.ok) return { status: 'unknown', error: result.error };

    const response = result.data as { order?: { state?: string } };
    return { status: this.mapSquareStatusToOurs(response?.order?.state ?? '') };
  }

  // ---- Data mapping ----

  private mapToSquareCatalogObject(item: PosMenuItem): Record<string, unknown> {
    return {
      type: 'ITEM',
      id: item.externalId ? `#${item.externalId}` : `#menius-${Date.now()}`,
      item_data: {
        name: item.name,
        description: item.description || '',
        variations: [{
          type: 'ITEM_VARIATION',
          id: `#var-${item.externalId || Date.now()}`,
          item_variation_data: {
            name: 'Regular',
            pricing_type: 'FIXED_PRICING',
            price_money: {
              amount: Math.round(item.price * 100),
              currency: 'MXN',
            },
          },
        }],
      },
    };
  }

  private mapFromSquareCatalogObject(obj: unknown): PosMenuItem {
    const o = obj as Record<string, unknown>;
    const itemData = o.item_data as Record<string, unknown> | undefined;
    const variations = itemData?.variations as Array<Record<string, unknown>> | undefined;
    const firstVariation = variations?.[0];
    const varData = firstVariation?.item_variation_data as Record<string, unknown> | undefined;
    const priceMoney = varData?.price_money as { amount?: number } | undefined;

    return {
      externalId: (o.id as string) || '',
      name: (itemData?.name as string) || '',
      description: (itemData?.description as string) || '',
      price: priceMoney?.amount ? priceMoney.amount / 100 : 0,
      isAvailable: o.is_deleted !== true,
    };
  }

  private mapToSquareOrder(order: PosOrder, locationId: string): Record<string, unknown> {
    return {
      location_id: locationId,
      reference_id: order.orderNumber,
      line_items: order.items.map(item => ({
        name: item.productName,
        quantity: String(item.quantity),
        base_price_money: {
          amount: Math.round(item.unitPrice * 100),
          currency: 'MXN',
        },
      })),
      fulfillments: [{
        type: order.orderType === 'delivery' ? 'DELIVERY' 
          : order.orderType === 'pickup' ? 'PICKUP' : 'DINE_IN',
        state: 'PROPOSED',
      }],
    };
  }

  private mapSquareStatusToOurs(squareState: string): string {
    const statusMap: Record<string, string> = {
      'OPEN': 'pending',
      'COMPLETED': 'delivered',
      'CANCELED': 'cancelled',
    };
    return statusMap[squareState] || 'pending';
  }
}
