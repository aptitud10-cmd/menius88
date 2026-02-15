import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { KitchenDisplay } from '@/components/kitchen/KitchenDisplay';

export default async function KitchenPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('default_restaurant_id')
    .eq('user_id', user.id)
    .single();

  if (!profile?.default_restaurant_id) redirect('/onboarding/create-restaurant');

  // Fetch active orders (pending, confirmed, preparing)
  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(*, product:products(name, image_url))')
    .eq('restaurant_id', profile.default_restaurant_id)
    .in('status', ['pending', 'confirmed', 'preparing', 'ready'])
    .order('created_at', { ascending: true });

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('name')
    .eq('id', profile.default_restaurant_id)
    .single();

  return (
    <KitchenDisplay
      initialOrders={orders ?? []}
      restaurantId={profile.default_restaurant_id}
      restaurantName={restaurant?.name ?? 'Cocina'}
    />
  );
}
