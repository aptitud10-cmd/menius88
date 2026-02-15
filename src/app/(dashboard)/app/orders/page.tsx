import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { OrdersBoard } from '@/components/orders/OrdersBoard';

export default async function OrdersPage() {
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

  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(*, product:products(name, image_url))')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div>
      <OrdersBoard
        initialOrders={orders ?? []}
        restaurantId={restaurantId}
      />
    </div>
  );
}
