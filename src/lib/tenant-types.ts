/**
 * MENIUS Multi-Tenant Types
 * 
 * Shared types and error class for tenant context.
 * Separated from 'use server' module because only async functions
 * can be exported from server action modules.
 */

export interface TenantContext {
  userId: string;
  userEmail: string;
  restaurantId: string;
  role: string;
}

export class TenantError extends Error {
  public code: string;
  
  constructor(message: string, code: string) {
    super(message);
    this.name = 'TenantError';
    this.code = code;
  }
}
