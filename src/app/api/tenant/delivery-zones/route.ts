import { createClient } from '@/lib/supabase/server';
import { getTenantContext } from '@/lib/tenant';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/tenant/delivery-zones - List delivery zones
 */
export async function GET() {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();

    const { data: zones, error } = await supabase
      .from('delivery_zones')
      .select('*')
      .eq('restaurant_id', tenant.restaurantId)
      .order('sort_order');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ zones: zones ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

/**
 * POST /api/tenant/delivery-zones - Create delivery zone
 */
export async function POST(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();
    const body = await request.json();

    const { data: zone, error } = await supabase
      .from('delivery_zones')
      .insert({
        restaurant_id: tenant.restaurantId,
        name: body.name ?? 'Nueva zona',
        min_distance_km: body.min_distance_km ?? 0,
        max_distance_km: body.max_distance_km ?? 5,
        delivery_fee: body.delivery_fee ?? 0,
        min_order_amount: body.min_order_amount ?? 0,
        estimated_minutes: body.estimated_minutes ?? 30,
        is_active: true,
        sort_order: body.sort_order ?? 0,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ zone });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

/**
 * PATCH /api/tenant/delivery-zones - Update delivery zone
 */
export async function PATCH(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();
    const { id, ...updates } = await request.json();

    if (!id) return NextResponse.json({ error: 'Zone ID required' }, { status: 400 });

    const allowed = ['name', 'min_distance_km', 'max_distance_km', 'delivery_fee', 'min_order_amount', 'estimated_minutes', 'is_active', 'sort_order'];
    const updateData: Record<string, any> = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) updateData[key] = updates[key];
    }

    const { data: zone, error } = await supabase
      .from('delivery_zones')
      .update(updateData)
      .eq('id', id)
      .eq('restaurant_id', tenant.restaurantId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ zone });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

/**
 * DELETE /api/tenant/delivery-zones - Delete delivery zone
 */
export async function DELETE(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();
    const { id } = await request.json();

    await supabase
      .from('delivery_zones')
      .delete()
      .eq('id', id)
      .eq('restaurant_id', tenant.restaurantId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
