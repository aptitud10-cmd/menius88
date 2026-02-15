import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SettingsForm } from '@/components/dashboard/SettingsForm';

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('default_restaurant_id, full_name')
    .eq('user_id', user.id)
    .single();

  if (!profile?.default_restaurant_id) redirect('/onboarding/create-restaurant');

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', profile.default_restaurant_id)
    .single();

  if (!restaurant) redirect('/onboarding/create-restaurant');

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Configuración</h1>
      <SettingsForm
        restaurant={restaurant}
        userEmail={user.email ?? ''}
        userName={profile.full_name}
      />
    </div>
  );
}
