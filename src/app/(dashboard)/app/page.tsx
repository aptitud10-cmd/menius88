import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('default_restaurant_id')
    .eq('user_id', user.id)
    .single();

  if (!profile?.default_restaurant_id) redirect('/onboarding/create-restaurant');

  const restaurantId = profile.default_restaurant_id;

  // Fetch all data in parallel
  const [
    { data: restaurant },
    { data: todayOrders },
    { data: weekOrders },
    { data: recentOrders },
    { data: products },
    { data: categories },
  ] = await Promise.all([
    supabase
      .from('restaurants')
      .select('name, slug, subscription_plan, trial_ends_at, created_at')
      .eq('id', restaurantId)
      .single(),
    // Today's orders
    supabase
      .from('orders')
      .select('id, total, status, created_at')
      .eq('restaurant_id', restaurantId)
      .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
      .order('created_at', { ascending: false }),
    // This week's orders (last 7 days)
    supabase
      .from('orders')
      .select('id, total, status, created_at')
      .eq('restaurant_id', restaurantId)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false }),
    // Recent orders with items
    supabase
      .from('orders')
      .select('*, order_items(qty, product:products(name))')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })
      .limit(10),
    // Products count
    supabase
      .from('products')
      .select('id, name, is_active')
      .eq('restaurant_id', restaurantId),
    // Categories count
    supabase
      .from('categories')
      .select('id, is_active')
      .eq('restaurant_id', restaurantId),
  ]);

  // Calculate stats
  const today = todayOrders ?? [];
  const week = weekOrders ?? [];

  const todayRevenue = today
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + Number(o.total), 0);

  const weekRevenue = week
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + Number(o.total), 0);

  const todayOrderCount = today.filter(o => o.status !== 'cancelled').length;
  const weekOrderCount = week.filter(o => o.status !== 'cancelled').length;

  const activeOrders = today.filter(o =>
    ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)
  ).length;

  const avgOrderValue = todayOrderCount > 0 ? todayRevenue / todayOrderCount : 0;

  // Daily revenue for the week (for chart)
  const dailyRevenue: { day: string; revenue: number; orders: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    const dayOrders = week.filter(o => {
      const orderDate = new Date(o.created_at).toISOString().split('T')[0];
      return orderDate === dateStr && o.status !== 'cancelled';
    });
    dailyRevenue.push({
      day: date.toLocaleDateString('es-MX', { weekday: 'short' }),
      revenue: dayOrders.reduce((s, o) => s + Number(o.total), 0),
      orders: dayOrders.length,
    });
  }

  return (
    <DashboardOverview
      restaurantName={restaurant?.name ?? ''}
      restaurantSlug={restaurant?.slug ?? ''}
      todayRevenue={todayRevenue}
      weekRevenue={weekRevenue}
      todayOrderCount={todayOrderCount}
      weekOrderCount={weekOrderCount}
      activeOrders={activeOrders}
      avgOrderValue={avgOrderValue}
      dailyRevenue={dailyRevenue}
      recentOrders={(recentOrders ?? []) as any[]}
      productCount={products?.length ?? 0}
      activeProductCount={products?.filter(p => p.is_active).length ?? 0}
      categoryCount={categories?.length ?? 0}
    />
  );
}
