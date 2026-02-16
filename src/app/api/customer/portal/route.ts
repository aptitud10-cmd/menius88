import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/customer/portal - Customer lookup by phone
 * Returns order history, loyalty points, and gift card balances
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { restaurant_id, phone } = body;

  if (!restaurant_id || !phone) {
    return NextResponse.json({ error: 'restaurant_id and phone required' }, { status: 400 });
  }

  const supabase = createClient();
  const cleanPhone = phone.replace(/\D/g, '').slice(-10);

  // Fetch recent orders
  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, status, total, order_type, created_at, tip_amount')
    .eq('restaurant_id', restaurant_id)
    .ilike('customer_phone', `%${cleanPhone}`)
    .order('created_at', { ascending: false })
    .limit(20);

  // Fetch loyalty info
  const { data: loyalty } = await supabase
    .from('loyalty_customers')
    .select('*')
    .eq('restaurant_id', restaurant_id)
    .ilike('phone', `%${cleanPhone}`)
    .maybeSingle();

  // Fetch loyalty config
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('loyalty_config, name')
    .eq('id', restaurant_id)
    .single();

  // Fetch active gift cards
  const { data: giftCards } = await supabase
    .from('gift_cards')
    .select('code, remaining_amount, expires_at, status')
    .eq('restaurant_id', restaurant_id)
    .eq('status', 'active')
    .gt('remaining_amount', 0);

  return NextResponse.json({
    orders: orders ?? [],
    loyalty: loyalty ?? null,
    loyaltyConfig: restaurant?.loyalty_config ?? null,
    restaurantName: restaurant?.name ?? '',
    giftCards: giftCards ?? [],
    totalOrders: orders?.length ?? 0,
    totalSpent: orders?.reduce((s, o) => s + (parseFloat(o.total) || 0), 0) ?? 0,
  });
}
