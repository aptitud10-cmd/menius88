import { createClient } from '@/lib/supabase/server';
import { getTenantContext } from '@/lib/tenant';
import { getStripe, isStripeConfigured } from '@/lib/stripe';
import { NextRequest, NextResponse } from 'next/server';

// Map plan IDs to Stripe price IDs (configure in env)
const PLAN_PRICES: Record<string, { monthly: string; annual: string }> = {
  basic: {
    monthly: process.env.STRIPE_PRICE_BASIC_MONTHLY ?? '',
    annual: process.env.STRIPE_PRICE_BASIC_ANNUAL ?? '',
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY ?? '',
    annual: process.env.STRIPE_PRICE_PRO_ANNUAL ?? '',
  },
  premium: {
    monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY ?? '',
    annual: process.env.STRIPE_PRICE_PREMIUM_ANNUAL ?? '',
  },
  enterprise: {
    monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY ?? '',
    annual: process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL ?? '',
  },
};

/**
 * POST /api/payments/subscribe - Create subscription checkout
 */
export async function POST(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const { plan, billing_period } = await request.json();

    if (!plan || !billing_period) {
      return NextResponse.json({ error: 'plan and billing_period required' }, { status: 400 });
    }

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({
        error: 'Stripe no configurado. Configura STRIPE_SECRET_KEY en las variables de entorno.',
        mode: 'not_configured',
      }, { status: 400 });
    }

    const priceConfig = PLAN_PRICES[plan];
    if (!priceConfig) {
      return NextResponse.json({ error: 'Plan no válido' }, { status: 400 });
    }

    const priceId = billing_period === 'annual' ? priceConfig.annual : priceConfig.monthly;
    if (!priceId) {
      return NextResponse.json({ error: 'Precio de Stripe no configurado para este plan' }, { status: 400 });
    }

    const supabase = createClient();

    // Get or create Stripe customer
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('stripe_customer_id, name')
      .eq('id', tenant.restaurantId)
      .single();

    let customerId = restaurant?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: tenant.userEmail,
        name: restaurant?.name ?? undefined,
        metadata: {
          restaurant_id: tenant.restaurantId,
          user_id: tenant.userId,
        },
      });
      customerId = customer.id;

      await supabase
        .from('restaurants')
        .update({ stripe_customer_id: customerId })
        .eq('id', tenant.restaurantId);
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${baseUrl}/app/billing?success=true&plan=${plan}`,
      cancel_url: `${baseUrl}/app/billing?cancelled=true`,
      metadata: {
        restaurant_id: tenant.restaurantId,
        plan,
        billing_period,
      },
    });

    return NextResponse.json({ url: session.url, session_id: session.id });
  } catch (error: any) {
    console.error('[SUBSCRIBE] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
