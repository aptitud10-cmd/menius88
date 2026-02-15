import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/orders/status?restaurant_id=xxx&order_number=yyy
 * Public endpoint for customers to poll order status (used by OrderTracker)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get('restaurant_id');
  const orderNumber = searchParams.get('order_number');

  if (!restaurantId || !orderNumber) {
    return NextResponse.json(
      { error: 'restaurant_id and order_number are required' },
      { status: 400 }
    );
  }

  const supabase = createClient();

  const { data: order, error } = await supabase
    .from('orders')
    .select('status, estimated_ready_at')
    .eq('restaurant_id', restaurantId)
    .eq('order_number', orderNumber)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json({
    status: order.status,
    estimated_ready_at: order.estimated_ready_at ?? null,
  });
}
