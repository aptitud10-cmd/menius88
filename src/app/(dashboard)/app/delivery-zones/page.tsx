import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DeliveryZonesManager } from '@/components/dashboard/DeliveryZonesManager';

export default async function DeliveryZonesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('default_restaurant_id')
    .eq('user_id', user.id)
    .single();

  if (!profile?.default_restaurant_id) redirect('/onboarding/create-restaurant');

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Zonas de Delivery</h1>
      <DeliveryZonesManager />
    </div>
  );
}
