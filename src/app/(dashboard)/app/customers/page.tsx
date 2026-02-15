import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CustomersDashboard } from '@/components/dashboard/CustomersDashboard';

export default async function CustomersPage() {
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
      <h1 className="text-xl font-bold mb-6">Clientes</h1>
      <CustomersDashboard />
    </div>
  );
}
