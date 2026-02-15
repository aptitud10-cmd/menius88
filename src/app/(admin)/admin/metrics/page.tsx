import { createClient } from '@/lib/supabase/server';
import { AdminMetrics } from '@/components/admin/AdminMetrics';

export default async function AdminMetricsPage() {
  const supabase = createClient();
  const now = new Date();

  // Last 30 days of orders
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentOrders } = await supabase
    .from('orders')
    .select('total, created_at, status, restaurant_id')
    .gte('created_at', thirtyDaysAgo)
    .order('created_at');

  // Plan distribution
  const { data: planData } = await supabase
    .from('restaurants')
    .select('subscription_plan');

  // Recent signups (30 days)
  const { data: recentUsers } = await supabase
    .from('profiles')
    .select('created_at')
    .gte('created_at', thirtyDaysAgo)
    .order('created_at');

  // Reviews stats
  const { count: totalReviews } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true });

  return (
    <AdminMetrics
      recentOrders={recentOrders ?? []}
      planData={planData ?? []}
      recentUsers={recentUsers ?? []}
      totalReviews={totalReviews ?? 0}
    />
  );
}
