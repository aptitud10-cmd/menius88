import { createClient } from '@/lib/supabase/server';
import { getTenantContext } from '@/lib/tenant';
import { logAudit } from '@/lib/audit';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/tenant/combos - List all combos with items
 */
export async function GET() {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();

    const { data: combos } = await supabase
      .from('combos')
      .select('*, combo_items(*, product:products(id, name, price, image_url))')
      .eq('restaurant_id', tenant.restaurantId)
      .order('sort_order');

    return NextResponse.json({ combos: combos ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

/**
 * POST /api/tenant/combos - Create a combo
 */
export async function POST(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();
    const body = await request.json();

    const { name, description, image_url, combo_price, items } = body;

    if (!name || !combo_price || !items?.length) {
      return NextResponse.json({ error: 'name, combo_price, and items required' }, { status: 400 });
    }

    // Calculate original price from products
    const productIds = items.map((i: any) => i.product_id);
    const { data: products } = await supabase
      .from('products')
      .select('id, price')
      .in('id', productIds)
      .eq('restaurant_id', tenant.restaurantId);

    const priceMap = new Map((products ?? []).map(p => [p.id, parseFloat(p.price)]));
    const originalPrice = items.reduce((s: number, i: any) => s + (priceMap.get(i.product_id) ?? 0) * (i.quantity ?? 1), 0);

    const { data: combo, error } = await supabase
      .from('combos')
      .insert({
        restaurant_id: tenant.restaurantId,
        name,
        description: description ?? '',
        image_url: image_url ?? '',
        original_price: originalPrice,
        combo_price,
        is_active: true,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Insert combo items
    if (items.length > 0) {
      await supabase.from('combo_items').insert(
        items.map((i: any, idx: number) => ({
          combo_id: combo.id,
          product_id: i.product_id,
          quantity: i.quantity ?? 1,
          sort_order: idx,
        }))
      );
    }

    logAudit({
      restaurantId: tenant.restaurantId,
      userId: tenant.userId,
      userEmail: tenant.userEmail,
      action: 'create',
      entityType: 'product',
      entityId: combo.id,
      details: { name, combo_price, itemCount: items.length },
    });

    return NextResponse.json({ combo });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

/**
 * PATCH /api/tenant/combos - Toggle combo active status
 */
export async function PATCH(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();
    const { id, is_active } = await request.json();

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const { error } = await supabase
      .from('combos')
      .update({ is_active })
      .eq('id', id)
      .eq('restaurant_id', tenant.restaurantId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

/**
 * DELETE /api/tenant/combos?id=xxx
 */
export async function DELETE(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const { error } = await supabase
      .from('combos')
      .delete()
      .eq('id', id)
      .eq('restaurant_id', tenant.restaurantId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
