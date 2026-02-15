import { createClient } from '@/lib/supabase/server';
import { AdminRestaurants } from '@/components/admin/AdminRestaurants';

export default async function AdminPage() {
  const supabase = createClient();

  // Fetch all restaurants
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('*')
    .order('created_at', { ascending: false });

  // Fetch owner profiles separately
  const ownerIds = Array.from(new Set((restaurants ?? []).map(r => r.owner_user_id)));
  const { data: ownerProfiles } = ownerIds.length > 0
    ? await supabase.from('profiles').select('user_id, full_name').in('user_id', ownerIds)
    : { data: [] };

  const ownerMap = new Map((ownerProfiles ?? []).map(p => [p.user_id, p]));
  const restaurantsWithOwner = (restaurants ?? []).map(r => ({
    ...r,
    owner: ownerMap.get(r.owner_user_id) ?? null,
  }));

  // Fetch aggregate stats
  const [
    { count: totalRestaurants },
    { count: totalOrders },
    { count: totalProducts },
    { count: totalUsers },
  ] = await Promise.all([
    supabase.from('restaurants').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
  ]);

  return (
    <AdminRestaurants
      restaurants={restaurantsWithOwner}
      stats={{
        totalRestaurants: totalRestaurants ?? 0,
        totalOrders: totalOrders ?? 0,
        totalProducts: totalProducts ?? 0,
        totalUsers: totalUsers ?? 0,
      }}
    />
  );
}
