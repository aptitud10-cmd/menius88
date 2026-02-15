import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PaymentPage } from '@/components/public/PaymentPage';

interface PageProps {
  params: { slug: string; orderNumber: string };
  searchParams: { cancelled?: string };
}

export default async function OrderPaymentPage({ params, searchParams }: PageProps) {
  const supabase = createClient();

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, slug, logo_url, currency, theme')
    .eq('slug', params.slug)
    .single();

  if (!restaurant) notFound();

  const { data: order } = await supabase
    .from('orders')
    .select('*, items:order_items(*, product:products(name, image_url))')
    .eq('restaurant_id', restaurant.id)
    .eq('order_number', params.orderNumber)
    .single();

  if (!order) notFound();

  return (
    <PaymentPage
      restaurant={restaurant}
      order={order}
      cancelled={searchParams.cancelled === 'true'}
    />
  );
}
