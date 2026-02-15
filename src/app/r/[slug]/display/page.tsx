import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { MenuDisplay } from '@/components/public/MenuDisplay';

interface PageProps {
  params: { slug: string };
}

export default async function DisplayPage({ params }: PageProps) {
  const supabase = createClient();

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, logo_url, theme, currency')
    .eq('slug', params.slug)
    .single();

  if (!restaurant) notFound();

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, schedule_label')
      .eq('restaurant_id', restaurant.id)
      .eq('is_active', true)
      .order('sort_order'),
    supabase
      .from('products')
      .select('id, name, description, price, image_url, category_id, dietary_tags')
      .eq('restaurant_id', restaurant.id)
      .eq('is_active', true)
      .order('sort_order'),
  ]);

  return (
    <MenuDisplay
      restaurant={restaurant}
      categories={categories ?? []}
      products={products ?? []}
    />
  );
}
