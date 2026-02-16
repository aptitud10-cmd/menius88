import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { OrderTracker } from '@/components/public/OrderTracker';

interface PageProps {
  params: { slug: string; orderNumber: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createClient();
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('name, logo_url')
    .eq('slug', params.slug)
    .single();

  const title = restaurant
    ? `Pedido ${params.orderNumber} — ${restaurant.name}`
    : `Pedido ${params.orderNumber}`;

  return {
    title,
    description: `Sigue el estado de tu pedido ${params.orderNumber} en tiempo real`,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description: `Tu pedido está en camino`,
      ...(restaurant?.logo_url ? { images: [restaurant.logo_url] } : {}),
    },
  };
}

export default async function OrderTrackingPage({ params }: PageProps) {
  const supabase = createClient();

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, slug, logo_url, phone')
    .eq('slug', params.slug)
    .single();

  if (!restaurant) notFound();

  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(id, qty, unit_price, line_total, notes, product:products(name, image_url))')
    .eq('restaurant_id', restaurant.id)
    .eq('order_number', params.orderNumber)
    .single();

  if (!order) notFound();

  return (
    <OrderTracker
      restaurant={restaurant}
      order={order as any}
    />
  );
}
