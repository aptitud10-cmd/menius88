import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ThemeEditor } from '@/components/dashboard/ThemeEditor';

export default async function ThemePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('default_restaurant_id')
    .eq('user_id', user.id)
    .single();

  if (!profile?.default_restaurant_id) redirect('/onboarding/create-restaurant');

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('name, slug, theme, logo_url, cover_image_url, tagline')
    .eq('id', profile.default_restaurant_id)
    .single();

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Editor de Tema</h1>
      <ThemeEditor
        slug={restaurant?.slug ?? ''}
        currentTheme={restaurant?.theme ?? null}
        restaurantName={restaurant?.name ?? ''}
        logoUrl={restaurant?.logo_url ?? null}
        coverUrl={restaurant?.cover_image_url ?? null}
        tagline={restaurant?.tagline ?? ''}
      />
    </div>
  );
}
