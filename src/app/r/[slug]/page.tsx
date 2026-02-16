import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PublicMenuClient } from '@/components/public/PublicMenuClient';
import { RestaurantJsonLd, MenuJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd';

interface PageProps {
  params: { slug: string };
  searchParams: { table?: string; lang?: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://menius.vercel.app';
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('name, tagline, description, cuisine_type, cover_image_url, logo_url, address, phone')
    .eq('slug', params.slug)
    .single();

  if (!restaurant) return { title: 'No encontrado' };

  const title = restaurant.cuisine_type
    ? `${restaurant.name} — ${restaurant.cuisine_type} | Menú Digital`
    : `${restaurant.name} — Menú Digital | Pide en Línea`;

  const description = restaurant.tagline
    || restaurant.description?.slice(0, 155)
    || `Explora el menú de ${restaurant.name} y pide en línea. Menú digital con QR, sin comisiones.`;

  const canonicalUrl = `${appUrl}/r/${params.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: 'website',
      title: `${restaurant.name} — Menú Digital`,
      description,
      url: canonicalUrl,
      siteName: 'MENIUS',
      locale: 'es_MX',
      ...(restaurant.cover_image_url ? {
        images: [{
          url: restaurant.cover_image_url,
          width: 1200,
          height: 630,
          alt: `Menú de ${restaurant.name}`,
        }],
      } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${restaurant.name} — Menú Digital`,
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

  const [{ data: categories }, { data: products }, { data: combos }] = await Promise.all([
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
    supabase
      .from('combos')
      .select('*, combo_items(*, product:products(id, name, price, image_url))')
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

  // Fetch review stats for structured data
  const { data: reviews } = await supabase
    .from('reviews')
    .select('rating')
    .eq('restaurant_id', restaurant.id)
    .eq('is_visible', true);

  const reviewCount = reviews?.length ?? 0;
  const avgRating = reviewCount > 0
    ? reviews!.reduce((s, r) => s + r.rating, 0) / reviewCount
    : 0;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://menius.vercel.app';

  // Build category->products map for Menu JSON-LD
  const menuCategories = mappedCategories.map(c => ({
    name: c.name,
    products: mappedProducts
      .filter(p => p.category_id === c.id)
      .map(p => ({ name: p.name, description: p.description, price: p.price, image_url: p.image_url })),
  }));

  return (
    <>
      <RestaurantJsonLd
        name={restaurant.name}
        slug={restaurant.slug}
        description={restaurant.description || restaurant.tagline}
        cuisineType={restaurant.cuisine_type}
        address={restaurant.address}
        phone={restaurant.phone}
        email={restaurant.email}
        website={restaurant.website}
        logoUrl={restaurant.logo_url}
        coverImageUrl={restaurant.cover_image_url}
        operatingHours={restaurant.operating_hours}
        averageRating={avgRating}
        reviewCount={reviewCount}
        appUrl={appUrl}
      />
      <MenuJsonLd
        restaurantName={restaurant.name}
        slug={restaurant.slug}
        categories={menuCategories}
        currency={restaurant.currency ?? 'MXN'}
        appUrl={appUrl}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'MENIUS', url: appUrl },
          { name: restaurant.name, url: `${appUrl}/r/${restaurant.slug}` },
        ]}
      />
      <PublicMenuClient
        restaurant={restaurant}
        categories={mappedCategories}
        products={mappedProducts}
        combos={combos ?? []}
        tableName={searchParams.table ?? null}
        currentLanguage={requestedLang}
        supportedLanguages={supportedLangs}
        reservationConfig={restaurant.reservation_config ?? null}
      />
    </>
  );
}
