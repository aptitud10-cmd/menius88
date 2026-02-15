/**
 * MENIUS — POS Adapter Base Class
 * 
 * Provides common functionality for all POS adapters.
 * Each specific adapter (Toast, Square, Clover) extends this class.
 */

import type { PosAdapter, PosProvider, IntegrationConfig, PosMenuItem, PosOrder, SyncResult } from './types';

export abstract class PosAdapterBase implements PosAdapter {
  abstract provider: PosProvider;

  abstract testConnection(config: IntegrationConfig): Promise<{ success: boolean; error?: string }>;
  abstract pushMenu(config: IntegrationConfig, items: PosMenuItem[]): Promise<SyncResult>;
  abstract pullMenu(config: IntegrationConfig): Promise<{ items: PosMenuItem[]; error?: string }>;
  abstract pushOrder(config: IntegrationConfig, order: PosOrder): Promise<{ externalId?: string; error?: string }>;
  abstract pullOrderStatus(config: IntegrationConfig, externalOrderId: string): Promise<{ status: string; error?: string }>;

  /**
   * Validates that required config fields are present.
   * Each adapter defines which fields are required.
   */
  protected validateConfig(config: Record<string, unknown>, requiredFields: string[]): { valid: boolean; missing: string[] } {
    const missing = requiredFields.filter(field => !config[field]);
    return { valid: missing.length === 0, missing };
  }

  /**
   * Standard HTTP request with error handling.
   * Subclasses use this for API calls to their POS.
   */
  protected async apiRequest(
    url: string,
    options: RequestInit & { timeout?: number } = {}
  ): Promise<{ ok: boolean; status: number; data: unknown; error?: string }> {
    const { timeout = 10000, ...fetchOptions } = options;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        return {
          ok: false,
          status: response.status,
          data,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return { ok: true, status: response.status, data };
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { ok: false, status: 0, data: null, error: 'Request timed out' };
      }
      return { ok: false, status: 0, data: null, error: String(err) };
    }
  }
}
