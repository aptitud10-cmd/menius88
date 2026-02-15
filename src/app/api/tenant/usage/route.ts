import { createClient } from '@/lib/supabase/server';
import { getTenantContext } from '@/lib/tenant';
import { NextResponse } from 'next/server';
import { getPlanConfig } from '@/lib/plans';
import type { SubscriptionPlan } from '@/types';

/**
 * GET /api/tenant/usage - Get current usage vs plan limits
 */
export async function GET() {
  try {
    const tenant = await getTenantContext();
    const supabase = createClient();

    // Fetch restaurant plan info
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('subscription_plan, trial_ends_at')
      .eq('id', tenant.restaurantId)
      .single();

    const plan = (restaurant?.subscription_plan ?? 'trial') as SubscriptionPlan;
    const config = getPlanConfig(plan);

    // Get current counts in parallel
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [
      { count: productCount },
      { count: categoryCount },
      { count: orderCount },
      { count: staffCount },
      { count: promoCount },
    ] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('restaurant_id', tenant.restaurantId),
      supabase.from('categories').select('*', { count: 'exact', head: true }).eq('restaurant_id', tenant.restaurantId),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('restaurant_id', tenant.restaurantId).gte('created_at', startOfMonth),
      supabase.from('restaurant_staff').select('*', { count: 'exact', head: true }).eq('restaurant_id', tenant.restaurantId),
      supabase.from('promotions').select('*', { count: 'exact', head: true }).eq('restaurant_id', tenant.restaurantId),
    ]);

    return NextResponse.json({
      plan,
      plan_name: config.name,
      trial_ends_at: restaurant?.trial_ends_at,
      limits: config.limits,
      usage: {
        products: productCount ?? 0,
        categories: categoryCount ?? 0,
        orders_per_month: orderCount ?? 0,
        staff_members: staffCount ?? 0,
        promotions: promoCount ?? 0,
      },
      features: config.features,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
