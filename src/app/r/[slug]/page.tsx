import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PublicMenuClient } from '@/components/public/PublicMenuClient';

interface PageProps {
  params: { slug: string };
  searchParams: { table?: string; lang?: string };
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

  // Fetch translations if a non-default language is requested
  const requestedLang = searchParams.lang ?? restaurant.default_language ?? 'es';
  const supportedLangs: string[] = restaurant.supported_languages ?? ['es'];
  const needsTranslation = requestedLang !== (restaurant.default_language ?? 'es') && supportedLangs.includes(requestedLang);

  let productTransMap: Record<string, { name: string; description: string }> = {};
  let categoryTransMap: Record<string, { name: string }> = {};

  if (needsTranslation) {
    const productIds = (products ?? []).map(p => p.id);
    const categoryIds = (categories ?? []).map(c => c.id);

    const [{ data: pTrans }, { data: cTrans }] = await Promise.all([
      productIds.length > 0
        ? supabase.from('product_translations').select('*').in('product_id', productIds).eq('language', requestedLang)
        : { data: [] },
      categoryIds.length > 0
        ? supabase.from('category_translations').select('*').in('category_id', categoryIds).eq('language', requestedLang)
        : { data: [] },
    ]);

    (pTrans ?? []).forEach((t: any) => { productTransMap[t.product_id] = { name: t.name, description: t.description ?? '' }; });
    (cTrans ?? []).forEach((t: any) => { categoryTransMap[t.category_id] = { name: t.name }; });
  }

  // Map joined fields + apply translations
  const mappedProducts = (products ?? []).map(p => ({
    ...p,
    name: productTransMap[p.id]?.name || p.name,
    description: productTransMap[p.id]?.description || p.description,
    variants: p.product_variants ?? [],
    extras: p.product_extras ?? [],
  }));

  const mappedCategories = (categories ?? []).map(c => ({
    ...c,
    name: categoryTransMap[c.id]?.name || c.name,
  }));

  return (
    <PublicMenuClient
      restaurant={restaurant}
      categories={mappedCategories}
      products={mappedProducts}
      tableName={searchParams.table ?? null}
      currentLanguage={requestedLang}
      supportedLanguages={supportedLangs}
      reservationConfig={restaurant.reservation_config ?? null}
    />
  );
}
