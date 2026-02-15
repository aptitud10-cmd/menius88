import { createClient } from '@/lib/supabase/server';
import { getTenantContext } from '@/lib/tenant';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/tenant/orders/poll?since=ISO_DATE
 * Returns orders created or updated after the given timestamp
 */
export async function GET(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since');

    if (!since) {
      return NextResponse.json({ error: 'since parameter required' }, { status: 400 });
    }

    const supabase = createClient();

    // Fetch orders updated since last poll
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, order_items(*, product:products(name, image_url))')
      .eq('restaurant_id', tenant.restaurantId)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      orders: orders ?? [],
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
