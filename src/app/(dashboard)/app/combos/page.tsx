import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CombosManager } from '@/components/dashboard/CombosManager';

export default async function CombosPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('default_restaurant_id')
    .eq('user_id', user.id)
    .single();

  if (!profile?.default_restaurant_id) redirect('/onboarding/create-restaurant');

  const { data: products } = await supabase
    .from('products')
    .select('id, name, price, image_url, category_id')
    .eq('restaurant_id', profile.default_restaurant_id)
    .eq('is_active', true)
    .order('name');

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('restaurant_id', profile.default_restaurant_id)
    .eq('is_active', true)
    .order('sort_order');

  return <CombosManager products={products ?? []} categories={categories ?? []} />;
}
