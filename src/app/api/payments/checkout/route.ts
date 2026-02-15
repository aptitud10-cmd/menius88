import { createClient } from '@/lib/supabase/server';
import { getStripe, isStripeConfigured } from '@/lib/stripe';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/payments/checkout - Create a Stripe Checkout session for an order
 */
export async function POST(request: NextRequest) {
  try {
    const { order_id, restaurant_id, success_url, cancel_url } = await request.json();

    if (!order_id || !restaurant_id) {
      return NextResponse.json({ error: 'order_id and restaurant_id required' }, { status: 400 });
    }

    const supabase = createClient();

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, items:order_items(*, product:products(name))')
      .eq('id', order_id)
      .eq('restaurant_id', restaurant_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    if (order.payment_status === 'paid') {
      return NextResponse.json({ error: 'Este pedido ya fue pagado' }, { status: 400 });
    }

    // Fetch restaurant
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('name, slug, currency, stripe_connect_account_id')
      .eq('id', restaurant_id)
      .single();

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurante no encontrado' }, { status: 404 });
    }

    const stripe = getStripe();
    if (!stripe) {
      // Stripe not configured — return a simulated payment link
      const payUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/r/${restaurant.slug}/pay/${order.order_number}`;
      return NextResponse.json({
        url: payUrl,
        payment_link: payUrl,
        mode: 'simulated',
        message: 'Stripe no configurado. Usa el link de pago simulado.',
      });
    }

    // Build line items from order
    const lineItems: any[] = (order.items ?? []).map((item: any) => ({
      price_data: {
        currency: (restaurant.currency ?? 'MXN').toLowerCase(),
        product_data: {
          name: item.product?.name ?? 'Producto',
        },
        unit_amount: Math.round(item.unit_price * 100),
      },
      quantity: item.qty,
    }));

    // Add delivery fee if any
    if (order.delivery_fee > 0) {
      lineItems.push({
        price_data: {
          currency: (restaurant.currency ?? 'MXN').toLowerCase(),
          product_data: { name: 'Envío' },
          unit_amount: Math.round(order.delivery_fee * 100),
        },
        quantity: 1,
      });
    }

    // Add tip if any
    if (order.tip_amount > 0) {
      lineItems.push({
        price_data: {
          currency: (restaurant.currency ?? 'MXN').toLowerCase(),
          product_data: { name: 'Propina' },
          unit_amount: Math.round(order.tip_amount * 100),
        },
        quantity: 1,
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const sessionParams: any = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: success_url || `${baseUrl}/r/${restaurant.slug}/order/${order.order_number}?paid=true`,
      cancel_url: cancel_url || `${baseUrl}/r/${restaurant.slug}/pay/${order.order_number}?cancelled=true`,
      metadata: {
        order_id: order.id,
        restaurant_id: restaurant_id,
        order_number: order.order_number,
      },
      customer_email: order.customer_email || undefined,
    };

    // If restaurant has Stripe Connect, use it
    if (restaurant.stripe_connect_account_id) {
      sessionParams.payment_intent_data = {
        transfer_data: {
          destination: restaurant.stripe_connect_account_id,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    // Save checkout session ID to order
    await supabase
      .from('orders')
      .update({ stripe_payment_intent_id: session.id, payment_method: 'stripe' })
      .eq('id', order_id);

    return NextResponse.json({
      url: session.url,
      session_id: session.id,
      mode: 'live',
    });
  } catch (error: any) {
    console.error('[PAYMENT] Checkout error:', error);
    return NextResponse.json({ error: error.message || 'Error creating payment' }, { status: 500 });
  }
}
