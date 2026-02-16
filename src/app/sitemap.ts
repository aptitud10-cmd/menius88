import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://menius.vercel.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient();

  // Fetch all active restaurants
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('slug, created_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  const restaurantPages: MetadataRoute.Sitemap = (restaurants ?? []).map((r) => ({
    url: `${BASE_URL}/r/${r.slug}`,
    lastModified: new Date(r.created_at),
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }));

  return [...staticPages, ...restaurantPages];
}
