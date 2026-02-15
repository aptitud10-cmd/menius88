'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getTenantContext, validateResourceOwnership } from '@/lib/tenant';
import { TenantError } from '@/lib/tenant-types';
import type { CreateRestaurantInput, CategoryInput, ProductInput, TableInput } from '@/lib/validations';

// ============================================================
// RESTAURANT CRUD
// ============================================================

export async function createRestaurant(data: CreateRestaurantInput) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  // Check slug is unique
  const { data: existing } = await supabase
    .from('restaurants')
    .select('id')
    .eq('slug', data.slug)
    .maybeSingle();

  if (existing) return { error: 'Ese slug ya está en uso' };

  const { data: restaurant, error } = await supabase
    .from('restaurants')
    .insert({
      name: data.name,
      slug: data.slug,
      owner_user_id: user.id,
      timezone: data.timezone,
      currency: data.currency,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  // Update profile with default restaurant
  await supabase
    .from('profiles')
    .upsert({
      user_id: user.id,
      default_restaurant_id: restaurant.id,
      role: 'owner',
    }, { onConflict: 'user_id' });

  redirect('/app/orders');
}

// ============================================================
// CATEGORY CRUD — ALL operations validate tenant ownership
// ============================================================

export async function createCategory(data: CategoryInput) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();

    const { error } = await supabase.from('categories').insert({
      restaurant_id: tenant.restaurantId, // Always from tenant context, NEVER from user input
      name: data.name,
      sort_order: data.sort_order,
      is_active: data.is_active,
    });

    if (error) return { error: error.message };
    revalidatePath('/app/menu/categories');
    return { success: true };
  } catch (e) {
    if (e instanceof TenantError) return { error: e.message };
    throw e;
  }
}

export async function updateCategory(id: string, data: CategoryInput) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();

    // CRITICAL: Verify this category belongs to the tenant BEFORE updating
    const isOwned = await validateResourceOwnership('categories', id, tenant.restaurantId);
    if (!isOwned) {
      return { error: 'No tiene permisos para modificar esta categoría' };
    }

    const { error } = await supabase
      .from('categories')
      .update({ name: data.name, sort_order: data.sort_order, is_active: data.is_active })
      .eq('id', id)
      .eq('restaurant_id', tenant.restaurantId); // Double-check with tenant filter

    if (error) return { error: error.message };
    revalidatePath('/app/menu/categories');
    return { success: true };
  } catch (e) {
    if (e instanceof TenantError) return { error: e.message };
    throw e;
  }
}

export async function deleteCategory(id: string) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();

    // CRITICAL: Verify ownership before deleting
    const isOwned = await validateResourceOwnership('categories', id, tenant.restaurantId);
    if (!isOwned) {
      return { error: 'No tiene permisos para eliminar esta categoría' };
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('restaurant_id', tenant.restaurantId); // Double-check with tenant filter

    if (error) return { error: error.message };
    revalidatePath('/app/menu/categories');
    return { success: true };
  } catch (e) {
    if (e instanceof TenantError) return { error: e.message };
    throw e;
  }
}

// ============================================================
// PRODUCT CRUD — ALL operations validate tenant ownership
// ============================================================

export async function createProduct(data: ProductInput) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();

    // Verify the category belongs to this tenant
    const categoryOwned = await validateResourceOwnership('categories', data.category_id, tenant.restaurantId);
    if (!categoryOwned) {
      return { error: 'Categoría no válida para este restaurante' };
    }

    const { error } = await supabase.from('products').insert({
      restaurant_id: tenant.restaurantId, // Always from tenant context
      category_id: data.category_id,
      name: data.name,
      description: data.description,
      price: data.price,
      is_active: data.is_active,
    });

    if (error) return { error: error.message };
    revalidatePath('/app/menu/products');
    return { success: true };
  } catch (e) {
    if (e instanceof TenantError) return { error: e.message };
    throw e;
  }
}

export async function updateProduct(id: string, data: Partial<ProductInput> & { image_url?: string }) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();

    // CRITICAL: Verify this product belongs to the tenant BEFORE updating
    const isOwned = await validateResourceOwnership('products', id, tenant.restaurantId);
    if (!isOwned) {
      return { error: 'No tiene permisos para modificar este producto' };
    }

    // If changing category, verify new category also belongs to tenant
    if (data.category_id) {
      const categoryOwned = await validateResourceOwnership('categories', data.category_id, tenant.restaurantId);
      if (!categoryOwned) {
        return { error: 'Categoría no válida para este restaurante' };
      }
    }

    const { error } = await supabase
      .from('products')
      .update(data)
      .eq('id', id)
      .eq('restaurant_id', tenant.restaurantId); // Double-check with tenant filter

    if (error) return { error: error.message };
    revalidatePath('/app/menu/products');
    return { success: true };
  } catch (e) {
    if (e instanceof TenantError) return { error: e.message };
    throw e;
  }
}

export async function deleteProduct(id: string) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();

    // CRITICAL: Verify ownership before deleting
    const isOwned = await validateResourceOwnership('products', id, tenant.restaurantId);
    if (!isOwned) {
      return { error: 'No tiene permisos para eliminar este producto' };
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('restaurant_id', tenant.restaurantId); // Double-check with tenant filter

    if (error) return { error: error.message };
    revalidatePath('/app/menu/products');
    return { success: true };
  } catch (e) {
    if (e instanceof TenantError) return { error: e.message };
    throw e;
  }
}

// ============================================================
// TABLE CRUD — ALL operations validate tenant ownership
// ============================================================

export async function createTable(data: TableInput) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();

    // Get restaurant slug for QR
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('slug')
      .eq('id', tenant.restaurantId)
      .single();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://menius.vercel.app';
    const qrValue = `${appUrl}/r/${restaurant?.slug}?table=${data.name}`;

    const { error } = await supabase.from('tables').insert({
      restaurant_id: tenant.restaurantId, // Always from tenant context
      name: data.name,
      qr_code_value: qrValue,
    });

    if (error) return { error: error.message };
    revalidatePath('/app/tables');
    return { success: true };
  } catch (e) {
    if (e instanceof TenantError) return { error: e.message };
    throw e;
  }
}

export async function deleteTable(id: string) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();

    // CRITICAL: Verify ownership before deleting
    const isOwned = await validateResourceOwnership('tables', id, tenant.restaurantId);
    if (!isOwned) {
      return { error: 'No tiene permisos para eliminar esta mesa' };
    }

    const { error } = await supabase
      .from('tables')
      .delete()
      .eq('id', id)
      .eq('restaurant_id', tenant.restaurantId); // Double-check with tenant filter

    if (error) return { error: error.message };
    revalidatePath('/app/tables');
    return { success: true };
  } catch (e) {
    if (e instanceof TenantError) return { error: e.message };
    throw e;
  }
}

// ============================================================
// ORDER MANAGEMENT — ALL operations validate tenant ownership
// ============================================================

export async function updateOrderStatus(orderId: string, status: string) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();

    // CRITICAL: Verify this order belongs to the tenant BEFORE updating
    const isOwned = await validateResourceOwnership('orders', orderId, tenant.restaurantId);
    if (!isOwned) {
      return { error: 'No tiene permisos para modificar esta orden' };
    }

    // Validate status is a valid transition
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return { error: 'Estado de orden inválido' };
    }

    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .eq('restaurant_id', tenant.restaurantId); // Double-check with tenant filter

    if (error) return { error: error.message };
    revalidatePath('/app/orders');
    return { success: true };
  } catch (e) {
    if (e instanceof TenantError) return { error: e.message };
    throw e;
  }
}
