import { createClient } from '@/lib/supabase/server';
import { getTenantContext } from '@/lib/tenant';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/tenant/promotions - List all promotions
 */
export async function GET() {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();

    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('restaurant_id', tenant.restaurantId)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ promotions: data ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

/**
 * POST /api/tenant/promotions - Create a promotion
 */
export async function POST(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();
    const body = await request.json();

    const { code, description, discount_type, discount_value, min_order_amount, max_uses, expires_at } = body;

    if (!code || !discount_type || discount_value == null) {
      return NextResponse.json({ error: 'code, discount_type, and discount_value are required' }, { status: 400 });
    }

    if (!['percentage', 'fixed'].includes(discount_type)) {
      return NextResponse.json({ error: 'discount_type must be percentage or fixed' }, { status: 400 });
    }

    if (discount_type === 'percentage' && (discount_value < 0 || discount_value > 100)) {
      return NextResponse.json({ error: 'Percentage must be between 0 and 100' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('promotions')
      .insert({
        restaurant_id: tenant.restaurantId,
        code: code.toUpperCase().trim(),
        description: description ?? '',
        discount_type,
        discount_value,
        min_order_amount: min_order_amount ?? 0,
        max_uses: max_uses || null,
        expires_at: expires_at || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Ya existe una promoción con ese código' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ promotion: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

/**
 * PATCH /api/tenant/promotions - Update a promotion
 */
export async function PATCH(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const allowedFields = ['description', 'is_active', 'max_uses', 'expires_at', 'min_order_amount'];
    const filtered: Record<string, any> = {};
    for (const key of allowedFields) {
      if (key in updates) filtered[key] = updates[key];
    }
    filtered.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('promotions')
      .update(filtered)
      .eq('id', id)
      .eq('restaurant_id', tenant.restaurantId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

/**
 * DELETE /api/tenant/promotions?id=xxx
 */
export async function DELETE(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const { error } = await supabase
      .from('promotions')
      .delete()
      .eq('id', id)
      .eq('restaurant_id', tenant.restaurantId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
