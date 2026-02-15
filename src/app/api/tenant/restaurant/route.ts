/**
 * Tenant Restaurant API
 * 
 * Protected API endpoint for restaurant management operations.
 * All requests are validated against the tenant context.
 * 
 * Security: Requires authentication. Tenant ID is injected by middleware.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/tenant';
import { TenantError } from '@/lib/tenant-types';
import { createClient } from '@/lib/supabase/server';

// GET /api/tenant/restaurant — Get current tenant's restaurant info
export async function GET() {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();

    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', tenant.restaurantId)
      .eq('owner_user_id', tenant.userId)
      .single();

    if (error || !restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      restaurant,
      tenant: {
        userId: tenant.userId,
        restaurantId: tenant.restaurantId,
        role: tenant.role,
      }
    });
  } catch (e) {
    if (e instanceof TenantError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/tenant/restaurant — Update current tenant's restaurant
export async function PATCH(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();
    const body = await request.json();

    // Only allow updating specific fields
    const allowedFields = ['name', 'timezone', 'currency', 'logo_url'];
    const updateData: Record<string, unknown> = {};
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .update(updateData)
      .eq('id', tenant.restaurantId)
      .eq('owner_user_id', tenant.userId) // Double-check ownership
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ restaurant });
  } catch (e) {
    if (e instanceof TenantError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
