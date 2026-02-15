import { createClient } from '@/lib/supabase/server';
import { getTenantContext } from '@/lib/tenant';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/tenant/customers - List customers with stats
 */
export async function GET(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') ?? '';
    const sort = searchParams.get('sort') ?? 'recent';

    let query = supabase
      .from('customers')
      .select('*')
      .eq('restaurant_id', tenant.restaurantId);

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (sort === 'recent') query = query.order('last_order_at', { ascending: false, nullsFirst: false });
    else if (sort === 'spent') query = query.order('total_spent', { ascending: false });
    else if (sort === 'orders') query = query.order('total_orders', { ascending: false });
    else query = query.order('created_at', { ascending: false });

    const { data: customers, error } = await query.limit(200);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const total = customers?.length ?? 0;
    const totalSpent = customers?.reduce((s, c) => s + Number(c.total_spent), 0) ?? 0;
    const totalOrders = customers?.reduce((s, c) => s + c.total_orders, 0) ?? 0;
    const returning = customers?.filter(c => c.total_orders > 1).length ?? 0;

    return NextResponse.json({
      customers: customers ?? [],
      stats: { total, totalSpent, totalOrders, returning, avgOrderValue: totalOrders > 0 ? totalSpent / totalOrders : 0 },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

/**
 * GET /api/tenant/customers/[phone] — Get customer detail + order history
 * We use query param ?phone=... since dynamic routes would need a folder
 */
export async function POST(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();
    const { phone } = await request.json();

    if (!phone) return NextResponse.json({ error: 'Phone required' }, { status: 400 });

    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('restaurant_id', tenant.restaurantId)
      .eq('phone', phone)
      .single();

    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

    // Fetch order history
    const { data: orders } = await supabase
      .from('orders')
      .select('id, order_number, status, total, order_type, created_at, tip_amount')
      .eq('restaurant_id', tenant.restaurantId)
      .eq('customer_phone', phone)
      .order('created_at', { ascending: false })
      .limit(50);

    return NextResponse.json({ customer, orders: orders ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

/**
 * PATCH /api/tenant/customers - Update customer notes
 */
export async function PATCH(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();
    const { id, notes } = await request.json();

    if (!id) return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });

    await supabase
      .from('customers')
      .update({ notes: notes ?? '' })
      .eq('id', id)
      .eq('restaurant_id', tenant.restaurantId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
