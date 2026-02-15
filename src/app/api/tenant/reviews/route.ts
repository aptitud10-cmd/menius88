import { createClient } from '@/lib/supabase/server';
import { getTenantContext } from '@/lib/tenant';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/tenant/reviews - Get all reviews for the restaurant (owner view)
 */
export async function GET() {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();

    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('restaurant_id', tenant.restaurantId)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const total = reviews?.length ?? 0;
    const visible = reviews?.filter(r => r.is_visible).length ?? 0;
    const avg = total > 0
      ? reviews!.reduce((sum: number, r: any) => sum + r.rating, 0) / total
      : 0;
    const distribution = [0, 0, 0, 0, 0];
    reviews?.forEach((r: any) => { distribution[r.rating - 1]++; });

    return NextResponse.json({
      reviews: reviews ?? [],
      stats: {
        total,
        visible,
        average: Math.round(avg * 10) / 10,
        distribution,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

/**
 * PATCH /api/tenant/reviews - Toggle visibility or add owner response
 */
export async function PATCH(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();
    const body = await request.json();
    const { id } = body;

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const updateData: Record<string, any> = {};
    if (body.is_visible !== undefined) updateData.is_visible = body.is_visible;
    if (body.owner_response !== undefined) {
      updateData.owner_response = body.owner_response;
      updateData.responded_at = body.owner_response ? new Date().toISOString() : null;
    }

    const { error } = await supabase
      .from('reviews')
      .update(updateData)
      .eq('id', id)
      .eq('restaurant_id', tenant.restaurantId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

/**
 * DELETE /api/tenant/reviews?id=xxx
 */
export async function DELETE(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id)
      .eq('restaurant_id', tenant.restaurantId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
