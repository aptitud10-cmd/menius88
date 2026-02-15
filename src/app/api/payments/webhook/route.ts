import { getStripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/payments/webhook - Handle Stripe webhook events
 */
export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 400 });
    }

    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature || !STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.error('[WEBHOOK] Signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const supabase = createClient();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const orderId = session.metadata?.order_id;
        const restaurantId = session.metadata?.restaurant_id;

        if (orderId) {
          // Update order payment status
          await supabase
            .from('orders')
            .update({
              payment_status: 'paid',
              payment_method: 'stripe',
              stripe_payment_intent_id: session.payment_intent || session.id,
            })
            .eq('id', orderId);

          console.log(`[WEBHOOK] Order ${orderId} marked as paid`);
        }
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as any;
        const orderId = session.metadata?.order_id;
        if (orderId) {
          console.log(`[WEBHOOK] Checkout expired for order ${orderId}`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        // Subscription billing
        const invoice = event.data.object as any;
        const customerId = invoice.customer;
        console.log(`[WEBHOOK] Invoice paid for customer ${customerId}`);
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer;
        const status = subscription.status;

        // Find restaurant by stripe_customer_id and update plan
        if (status === 'canceled' || status === 'unpaid') {
          await supabase
            .from('restaurants')
            .update({ subscription_plan: 'cancelled' })
            .eq('stripe_customer_id', customerId);
        }
        console.log(`[WEBHOOK] Subscription ${event.type} for ${customerId}: ${status}`);
        break;
      }

      default:
        console.log(`[WEBHOOK] Unhandled event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[WEBHOOK] Error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
