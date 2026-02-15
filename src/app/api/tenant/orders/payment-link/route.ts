import { createClient } from '@/lib/supabase/server';
import { getTenantContext } from '@/lib/tenant';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/tenant/orders/payment-link - Generate a payment link for an order
 */
export async function POST(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();
    const { order_id } = await request.json();

    if (!order_id) {
      return NextResponse.json({ error: 'order_id required' }, { status: 400 });
    }

    // Verify order belongs to tenant
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, order_number, total, payment_status')
      .eq('id', order_id)
      .eq('restaurant_id', tenant.restaurantId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    if (order.payment_status === 'paid') {
      return NextResponse.json({ error: 'Este pedido ya fue pagado' }, { status: 400 });
    }

    // Fetch restaurant slug
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('slug')
      .eq('id', tenant.restaurantId)
      .single();

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const paymentLink = `${baseUrl}/r/${restaurant?.slug}/pay/${order.order_number}`;

    return NextResponse.json({
      payment_link: paymentLink,
      order_number: order.order_number,
      total: order.total,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
