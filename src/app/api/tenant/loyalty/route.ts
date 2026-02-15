import { createClient } from '@/lib/supabase/server';
import { getTenantContext } from '@/lib/tenant';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/tenant/loyalty - Get loyalty customers + config
 */
export async function GET() {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();

    const [{ data: customers }, { data: restaurant }] = await Promise.all([
      supabase
        .from('loyalty_customers')
        .select('*')
        .eq('restaurant_id', tenant.restaurantId)
        .order('total_points', { ascending: false }),
      supabase
        .from('restaurants')
        .select('loyalty_config')
        .eq('id', tenant.restaurantId)
        .single(),
    ]);

    const config = restaurant?.loyalty_config ?? { enabled: false, pointsPerDollar: 10, redeemThreshold: 100, redeemValue: 5 };

    return NextResponse.json({
      customers: customers ?? [],
      config,
      stats: {
        total: customers?.length ?? 0,
        totalPoints: customers?.reduce((s, c) => s + c.total_points, 0) ?? 0,
        totalSpent: customers?.reduce((s, c) => s + Number(c.total_spent), 0) ?? 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

/**
 * PATCH /api/tenant/loyalty - Update loyalty config
 */
export async function PATCH(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();
    const body = await request.json();

    await supabase
      .from('restaurants')
      .update({ loyalty_config: body })
      .eq('id', tenant.restaurantId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

/**
 * POST /api/tenant/loyalty - Add bonus points to a customer
 */
export async function POST(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();
    const { customer_id, points, description } = await request.json();

    if (!customer_id || !points) {
      return NextResponse.json({ error: 'customer_id and points required' }, { status: 400 });
    }

    // Update customer points
    const { data: customer } = await supabase
      .from('loyalty_customers')
      .select('total_points')
      .eq('id', customer_id)
      .eq('restaurant_id', tenant.restaurantId)
      .single();

    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

    await supabase
      .from('loyalty_customers')
      .update({ total_points: customer.total_points + points })
      .eq('id', customer_id);

    await supabase
      .from('loyalty_transactions')
      .insert({
        customer_id,
        restaurant_id: tenant.restaurantId,
        type: points > 0 ? 'bonus' : 'redeem',
        points,
        description: description ?? (points > 0 ? 'Bonus manual' : 'Canje de puntos'),
      });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
