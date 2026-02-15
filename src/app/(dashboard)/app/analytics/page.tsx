import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AnalyticsDashboard } from '@/components/dashboard/AnalyticsDashboard';

export default async function AnalyticsPage() {
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

  // Fetch 30 days of orders
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: orders } = await supabase
    .from('orders')
    .select('id, total, status, created_at, order_items(qty, unit_price, product:products(name, category_id))')
    .eq('restaurant_id', restaurantId)
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: false });

  // Products with sales data
  const { data: products } = await supabase
    .from('products')
    .select('id, name, price, is_active, category_id')
    .eq('restaurant_id', restaurantId);

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('restaurant_id', restaurantId);

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Analytics</h1>
      <AnalyticsDashboard
        orders={(orders ?? []) as any[]}
        products={(products ?? []) as any[]}
        categories={(categories ?? []) as any[]}
      />
    </div>
  );
}
