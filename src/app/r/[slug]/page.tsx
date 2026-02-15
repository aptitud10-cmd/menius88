import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PublicMenuClient } from '@/components/public/PublicMenuClient';

interface PageProps {
  params: { slug: string };
  searchParams: { table?: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createClient();
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('name, tagline, description, cuisine_type, cover_image_url')
    .eq('slug', params.slug)
    .single();

  if (!restaurant) return { title: 'No encontrado' };

  const description = restaurant.tagline
    || restaurant.description?.slice(0, 155)
    || `Pide en línea de ${restaurant.name}`;

  return {
    title: `${restaurant.name} — Menú | MENIUS`,
    description,
    openGraph: {
      title: `${restaurant.name} — Menú`,
      description,
      ...(restaurant.cover_image_url ? { images: [restaurant.cover_image_url] } : {}),
    },
  };
}

export default async function PublicMenuPage({ params, searchParams }: PageProps) {
  const supabase = createClient();

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!restaurant) notFound();

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .eq('is_active', true)
      .order('sort_order'),
    supabase
      .from('products')
      .select('*, product_variants(*), product_extras(*)')
      .eq('restaurant_id', restaurant.id)
      .eq('is_active', true)
      .order('sort_order'),
  ]);

  // Map joined fields to expected shape
  const mappedProducts = (products ?? []).map(p => ({
    ...p,
    variants: p.product_variants ?? [],
    extras: p.product_extras ?? [],
  }));

  return (
    <PublicMenuClient
      restaurant={restaurant}
      categories={categories ?? []}
      products={mappedProducts}
      tableName={searchParams.table ?? null}
    />
  );
}
