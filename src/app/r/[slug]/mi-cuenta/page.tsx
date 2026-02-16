import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { CustomerPortal } from '@/components/public/CustomerPortal';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createClient();
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('name')
    .eq('slug', params.slug)
    .single();

  return {
    title: restaurant ? `Mi Cuenta — ${restaurant.name}` : 'Mi Cuenta',
    description: 'Consulta tu historial de pedidos, puntos de lealtad y tarjetas de regalo',
    robots: { index: false, follow: false },
  };
}

export default async function CustomerPortalPage({ params }: PageProps) {
  const supabase = createClient();
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, slug, logo_url, theme, loyalty_config')
    .eq('slug', params.slug)
    .single();

  if (!restaurant) notFound();

  return (
    <CustomerPortal
      restaurantId={restaurant.id}
      restaurantName={restaurant.name}
      slug={restaurant.slug}
      logoUrl={restaurant.logo_url}
      theme={restaurant.theme}
      loyaltyEnabled={restaurant.loyalty_config?.enabled ?? false}
    />
  );
}
