'use server';

/**
 * MENIUS Multi-Tenant Context Utility
 * 
 * This module provides tenant isolation at the application layer.
 * Every server action that reads or writes tenant data MUST use
 * getTenantContext() to ensure proper data isolation.
 * 
 * Security layers:
 * 1. Supabase RLS (database layer) - enforced by PostgreSQL
 * 2. This tenant context (application layer) - defense-in-depth
 * 3. Middleware (request layer) - route protection
 */

import { createClient } from '@/lib/supabase/server';
import type { TenantContext } from '@/lib/tenant-types';
import { TenantError } from '@/lib/tenant-types';

/**
 * Gets the authenticated user's tenant context.
 * This is the SINGLE SOURCE OF TRUTH for tenant identity.
 * 
 * @throws TenantError if user is not authenticated or has no restaurant
 * @returns TenantContext with userId, restaurantId, and role
 */
export async function getTenantContext(): Promise<TenantContext> {
  const supabase = createClient();
  
  // Use getUser() NOT getSession() — getUser() validates with Supabase Auth server
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new TenantError('No autenticado', 'AUTH_REQUIRED');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('default_restaurant_id, role')
    .eq('user_id', user.id)
    .single();

  if (profileError || !profile) {
    throw new TenantError('Perfil no encontrado', 'PROFILE_NOT_FOUND');
  }

  if (!profile.default_restaurant_id) {
    throw new TenantError('No tiene restaurante asignado', 'NO_RESTAURANT');
  }

  // CRITICAL: Verify the user actually owns this restaurant
  const { data: restaurant, error: restaurantError } = await supabase
    .from('restaurants')
    .select('id')
    .eq('id', profile.default_restaurant_id)
    .eq('owner_user_id', user.id)
    .single();

  if (restaurantError || !restaurant) {
    throw new TenantError(
      'No tiene permisos sobre este restaurante',
      'UNAUTHORIZED_TENANT'
    );
  }

  return {
    userId: user.id,
    userEmail: user.email ?? '',
    restaurantId: profile.default_restaurant_id,
    role: profile.role,
  };
}

/**
 * Validates that a specific resource belongs to the tenant.
 * Use this before any update/delete operation on a resource.
 * 
 * @param table The table name to check
 * @param resourceId The UUID of the resource
 * @param restaurantId The tenant's restaurant ID
 * @returns true if the resource belongs to the tenant
 */
export async function validateResourceOwnership(
  table: 'categories' | 'products' | 'tables' | 'orders',
  resourceId: string,
  restaurantId: string
): Promise<boolean> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from(table)
    .select('id')
    .eq('id', resourceId)
    .eq('restaurant_id', restaurantId)
    .single();

  return !error && !!data;
}

/**
 * Validates that a product belongs to the tenant.
 * Used for operations on product_variants and product_extras.
 */
export async function validateProductOwnership(
  productId: string,
  restaurantId: string
): Promise<boolean> {
  return validateResourceOwnership('products', productId, restaurantId);
}

/**
 * Validates that an order belongs to the tenant.
 * Used for order status updates and management.
 */
export async function validateOrderOwnership(
  orderId: string,
  restaurantId: string
): Promise<boolean> {
  return validateResourceOwnership('orders', orderId, restaurantId);
}
