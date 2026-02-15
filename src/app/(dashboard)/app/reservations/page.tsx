import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ReservationsDashboard } from '@/components/dashboard/ReservationsDashboard';

export default async function ReservationsPage() {
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
      <h1 className="text-xl font-bold mb-6">Reservaciones</h1>
      <ReservationsDashboard />
    </div>
  );
}
