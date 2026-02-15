/**
 * MENIUS — Toast POS Adapter
 * 
 * Connects to Toast POS API for:
 * - Menu synchronization (push/pull)
 * - Order forwarding
 * - Status tracking
 * 
 * Toast API docs: https://doc.toasttab.com/
 * 
 * NOTE: This is the structural foundation. API endpoints and
 * authentication flows will be completed when Toast API
 * credentials are available.
 */

import { PosAdapterBase } from '../pos-adapter-base';
import type { ToastConfig, PosMenuItem, PosOrder, SyncResult, IntegrationConfig } from '../types';

const TOAST_API_BASE = {
  sandbox: 'https://ws-sandbox-api.eng.toasttab.com',
  production: 'https://ws-api.toasttab.com',
};

export class ToastAdapter extends PosAdapterBase {
  provider = 'pos_toast' as const;

  private getBaseUrl(config: ToastConfig): string {
    return TOAST_API_BASE[config.environment || 'sandbox'];
  }

  private getHeaders(config: ToastConfig): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Toast-Restaurant-External-ID': config.restaurantGuid,
      'Authorization': `Bearer ${config.apiKey}`,
    };
  }

  async testConnection(config: IntegrationConfig): Promise<{ success: boolean; error?: string }> {
    const toastConfig = config as ToastConfig;
    const { valid, missing } = this.validateConfig(
      toastConfig as unknown as Record<string, unknown>,
      ['apiKey', 'restaurantGuid']
    );
    if (!valid) return { success: false, error: `Missing fields: ${missing.join(', ')}` };

    const result = await this.apiRequest(
      `${this.getBaseUrl(toastConfig)}/restaurants/v1/restaurants/${toastConfig.restaurantGuid}`,
      { headers: this.getHeaders(toastConfig) }
    );

    return { success: result.ok, error: result.error };
  }

  async pushMenu(config: IntegrationConfig, items: PosMenuItem[]): Promise<SyncResult> {
    const toastConfig = config as ToastConfig;
    const errors: { itemId: string; error: string }[] = [];
    let processed = 0;
    let failed = 0;

    for (const item of items) {
      // Toast uses a specific menu item format
      const toastItem = this.mapToToastItem(item);
      
      const result = await this.apiRequest(
        `${this.getBaseUrl(toastConfig)}/menus/v2/menus`,
        {
          method: 'POST',
          headers: this.getHeaders(toastConfig),
          body: JSON.stringify(toastItem),
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
    const toastConfig = config as ToastConfig;
    
    const result = await this.apiRequest(
      `${this.getBaseUrl(toastConfig)}/menus/v2/menus`,
      { headers: this.getHeaders(toastConfig) }
    );

    if (!result.ok) return { items: [], error: result.error };

    // Transform Toast menu format to our normalized format
    const toastMenus = result.data as { menus?: Array<{ groups?: Array<{ items?: unknown[] }> }> };
    const items: PosMenuItem[] = [];

    if (toastMenus?.menus) {
      for (const menu of toastMenus.menus) {
        for (const group of menu.groups ?? []) {
          for (const item of group.items ?? []) {
            items.push(this.mapFromToastItem(item));
          }
        }
      }
    }

    return { items };
  }

  async pushOrder(config: IntegrationConfig, order: PosOrder): Promise<{ externalId?: string; error?: string }> {
    const toastConfig = config as ToastConfig;
    const toastOrder = this.mapToToastOrder(order);

    const result = await this.apiRequest(
      `${this.getBaseUrl(toastConfig)}/orders/v2/orders`,
      {
        method: 'POST',
        headers: this.getHeaders(toastConfig),
        body: JSON.stringify(toastOrder),
      }
    );

    if (!result.ok) return { error: result.error };

    const response = result.data as { guid?: string };
    return { externalId: response?.guid };
  }

  async pullOrderStatus(config: IntegrationConfig, externalOrderId: string): Promise<{ status: string; error?: string }> {
    const toastConfig = config as ToastConfig;

    const result = await this.apiRequest(
      `${this.getBaseUrl(toastConfig)}/orders/v2/orders/${externalOrderId}`,
      { headers: this.getHeaders(toastConfig) }
    );

    if (!result.ok) return { status: 'unknown', error: result.error };

    const order = result.data as { status?: string };
    return { status: this.mapToastStatusToOurs(order?.status ?? '') };
  }

  // ---- Data mapping helpers ----

  private mapToToastItem(item: PosMenuItem): Record<string, unknown> {
    return {
      name: item.name,
      description: item.description || '',
      price: Math.round(item.price * 100), // Toast uses cents
      visibility: item.isAvailable ? 'ALL' : 'NONE',
    };
  }

  private mapFromToastItem(item: unknown): PosMenuItem {
    const i = item as Record<string, unknown>;
    return {
      externalId: (i.guid as string) || '',
      name: (i.name as string) || '',
      description: (i.description as string) || '',
      price: typeof i.price === 'number' ? i.price / 100 : 0,
      isAvailable: i.visibility === 'ALL',
    };
  }

  private mapToToastOrder(order: PosOrder): Record<string, unknown> {
    return {
      entityType: 'Order',
      externalId: order.orderNumber,
      diningOption: order.orderType === 'delivery' ? 'DELIVERY' 
        : order.orderType === 'pickup' ? 'TAKE_OUT' : 'DINE_IN',
      checks: [{
        selections: order.items.map(item => ({
          itemName: item.productName,
          quantity: item.quantity,
          price: Math.round(item.unitPrice * 100),
        })),
      }],
    };
  }

  private mapToastStatusToOurs(toastStatus: string): string {
    const statusMap: Record<string, string> = {
      'OPEN': 'pending',
      'APPROVED': 'confirmed',
      'IN_PROGRESS': 'preparing',
      'READY': 'ready',
      'COMPLETED': 'delivered',
      'CANCELLED': 'cancelled',
      'VOID': 'cancelled',
    };
    return statusMap[toastStatus] || 'pending';
  }
}
