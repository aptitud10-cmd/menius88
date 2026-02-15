/**
 * Tenant Orders API
 * 
 * Protected API endpoint for order management.
 * All requests are validated against the tenant context.
 * Owners can only see and manage their own restaurant's orders.
 * 
 * Security: Requires authentication. Tenant isolation enforced at
 * both application layer (getTenantContext) and database layer (RLS).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext, validateResourceOwnership } from '@/lib/tenant';
import { TenantError } from '@/lib/tenant-types';
import { createClient } from '@/lib/supabase/server';

// GET /api/tenant/orders — List tenant's orders
export async function GET(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    let query = supabase
      .from('orders')
      .select('*, order_items(*, product:products(name))', { count: 'exact' })
      .eq('restaurant_id', tenant.restaurantId) // TENANT FILTER
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: orders, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      orders: orders ?? [],
      total: count ?? 0,
      limit,
      offset,
    });
  } catch (e) {
    if (e instanceof TenantError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/tenant/orders — Update order status
export async function PATCH(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();
    const body = await request.json();

    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'orderId and status are required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // CRITICAL: Verify order belongs to this tenant
    const isOwned = await validateResourceOwnership('orders', orderId, tenant.restaurantId);
    if (!isOwned) {
      console.error(
        `[SECURITY] Cross-tenant order update attempt: ` +
        `user ${tenant.userId} tried to update order ${orderId} ` +
        `which does not belong to restaurant ${tenant.restaurantId}`
      );
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 } // Return 404, not 403, to avoid information leakage
      );
    }

    const { data: order, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .eq('restaurant_id', tenant.restaurantId) // Double-check
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ order });
  } catch (e) {
    if (e instanceof TenantError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
