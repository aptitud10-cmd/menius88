/**
 * MENIUS — Clover POS Adapter
 * 
 * Connects to Clover API for:
 * - Inventory/menu synchronization
 * - Order forwarding
 * - Status tracking
 * 
 * Clover API docs: https://docs.clover.com/reference
 * 
 * NOTE: Structural foundation. Full implementation requires
 * Clover API credentials and OAuth app setup.
 */

import { PosAdapterBase } from '../pos-adapter-base';
import type { CloverConfig, PosMenuItem, PosOrder, SyncResult, IntegrationConfig } from '../types';

const CLOVER_API_BASE = {
  sandbox: 'https://sandbox.dev.clover.com/v3',
  production: 'https://api.clover.com/v3',
};

export class CloverAdapter extends PosAdapterBase {
  provider = 'pos_clover' as const;

  private getBaseUrl(config: CloverConfig): string {
    return `${CLOVER_API_BASE[config.environment || 'sandbox']}/merchants/${config.merchantId}`;
  }

  private getHeaders(config: CloverConfig): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiToken}`,
    };
  }

  async testConnection(config: IntegrationConfig): Promise<{ success: boolean; error?: string }> {
    const clConfig = config as CloverConfig;
    const { valid, missing } = this.validateConfig(
      clConfig as unknown as Record<string, unknown>,
      ['apiToken', 'merchantId']
    );
    if (!valid) return { success: false, error: `Missing fields: ${missing.join(', ')}` };

    const result = await this.apiRequest(
      this.getBaseUrl(clConfig),
      { headers: this.getHeaders(clConfig) }
    );

    return { success: result.ok, error: result.error };
  }

  async pushMenu(config: IntegrationConfig, items: PosMenuItem[]): Promise<SyncResult> {
    const clConfig = config as CloverConfig;
    const errors: { itemId: string; error: string }[] = [];
    let processed = 0;
    let failed = 0;

    for (const item of items) {
      const cloverItem = this.mapToCloverItem(item);

      const result = await this.apiRequest(
        `${this.getBaseUrl(clConfig)}/items`,
        {
          method: 'POST',
          headers: this.getHeaders(clConfig),
          body: JSON.stringify(cloverItem),
        }
      );

      if (result.ok) {
        processed++;
      } else {
        failed++;
        errors.push({ itemId: item.externalId, error: result.error || 'Unknown error' });
      }
    }

    return { success: failed === 0, itemsProcessed: processed, itemsFailed: failed, errors };
  }

  async pullMenu(config: IntegrationConfig): Promise<{ items: PosMenuItem[]; error?: string }> {
    const clConfig = config as CloverConfig;

    const result = await this.apiRequest(
      `${this.getBaseUrl(clConfig)}/items?expand=categories`,
      { headers: this.getHeaders(clConfig) }
    );

    if (!result.ok) return { items: [], error: result.error };

    const response = result.data as { elements?: unknown[] };
    const items = (response?.elements ?? []).map(el => this.mapFromCloverItem(el));

    return { items };
  }

  async pushOrder(config: IntegrationConfig, order: PosOrder): Promise<{ externalId?: string; error?: string }> {
    const clConfig = config as CloverConfig;

    // Clover requires creating an order first, then adding line items
    const result = await this.apiRequest(
      `${this.getBaseUrl(clConfig)}/atomic_order/orders`,
      {
        method: 'POST',
        headers: this.getHeaders(clConfig),
        body: JSON.stringify(this.mapToCloverOrder(order)),
      }
    );

    if (!result.ok) return { error: result.error };

    const response = result.data as { id?: string };
    return { externalId: response?.id };
  }

  async pullOrderStatus(config: IntegrationConfig, externalOrderId: string): Promise<{ status: string; error?: string }> {
    const clConfig = config as CloverConfig;

    const result = await this.apiRequest(
      `${this.getBaseUrl(clConfig)}/orders/${externalOrderId}`,
      { headers: this.getHeaders(clConfig) }
    );

    if (!result.ok) return { status: 'unknown', error: result.error };

    const response = result.data as { state?: string };
    return { status: this.mapCloverStatusToOurs(response?.state ?? '') };
  }

  // ---- Data mapping ----

  private mapToCloverItem(item: PosMenuItem): Record<string, unknown> {
    return {
      name: item.name,
      price: Math.round(item.price * 100), // Clover uses cents
      hidden: !item.isAvailable,
      autoManage: true,
    };
  }

  private mapFromCloverItem(el: unknown): PosMenuItem {
    const item = el as Record<string, unknown>;
    return {
      externalId: (item.id as string) || '',
      name: (item.name as string) || '',
      description: '',
      price: typeof item.price === 'number' ? item.price / 100 : 0,
      isAvailable: item.hidden !== true,
    };
  }

  private mapToCloverOrder(order: PosOrder): Record<string, unknown> {
    return {
      orderCart: {
        lineItems: order.items.map(item => ({
          name: item.productName,
          price: Math.round(item.unitPrice * 100),
          unitQty: item.quantity * 1000, // Clover uses thousandths
        })),
      },
      note: order.notes || `MENIUS Order: ${order.orderNumber}`,
    };
  }

  private mapCloverStatusToOurs(cloverState: string): string {
    const statusMap: Record<string, string> = {
      'open': 'pending',
      'locked': 'preparing',
      'paid': 'delivered',
    };
    return statusMap[cloverState] || 'pending';
  }
}
