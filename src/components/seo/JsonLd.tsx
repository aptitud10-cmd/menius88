/**
 * JSON-LD Structured Data Components
 * Implements Schema.org markup for Google rich results:
 * - Restaurant schema
 * - Menu schema
 * - Review/AggregateRating schema
 * - BreadcrumbList schema
 */

interface RestaurantJsonLdProps {
  name: string;
  slug: string;
  description?: string;
  cuisineType?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  operatingHours?: { day: string; open: string; close: string; closed: boolean }[];
  priceRange?: string;
  averageRating?: number;
  reviewCount?: number;
  appUrl: string;
}

const DAY_MAP: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

export function RestaurantJsonLd({
  name, slug, description, cuisineType, address, phone, email, website,
  logoUrl, coverImageUrl, operatingHours, priceRange, averageRating, reviewCount, appUrl,
}: RestaurantJsonLdProps) {
  const openingHours = (operatingHours ?? [])
    .filter(h => !h.closed)
    .map(h => `${DAY_MAP[h.day] ?? h.day} ${h.open}-${h.close}`);

  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name,
    url: `${appUrl}/r/${slug}`,
    ...(description && { description }),
    ...(cuisineType && { servesCuisine: cuisineType }),
    ...(address && { address: { '@type': 'PostalAddress', streetAddress: address } }),
    ...(phone && { telephone: phone }),
    ...(email && { email }),
    ...(website && { sameAs: website }),
    ...(logoUrl && { logo: logoUrl }),
    ...(coverImageUrl && { image: coverImageUrl }),
    ...(priceRange && { priceRange }),
    ...(openingHours.length > 0 && { openingHours }),
    acceptsReservations: 'True',
    menu: `${appUrl}/r/${slug}`,
  };

  if (averageRating && reviewCount && reviewCount > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: averageRating.toFixed(1),
      reviewCount,
      bestRating: '5',
      worstRating: '1',
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface MenuJsonLdProps {
  restaurantName: string;
  slug: string;
  categories: { name: string; products: { name: string; description?: string; price: number; image_url?: string }[] }[];
  currency: string;
  appUrl: string;
}

export function MenuJsonLd({ restaurantName, slug, categories, currency, appUrl }: MenuJsonLdProps) {
  const menuSections = categories.map(cat => ({
    '@type': 'MenuSection',
    name: cat.name,
    hasMenuItem: cat.products.map(p => ({
      '@type': 'MenuItem',
      name: p.name,
      ...(p.description && { description: p.description }),
      ...(p.image_url && { image: p.image_url }),
      offers: {
        '@type': 'Offer',
        price: p.price.toFixed(2),
        priceCurrency: currency,
      },
    })),
  }));

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    name: `Menú de ${restaurantName}`,
    url: `${appUrl}/r/${slug}`,
    hasMenuSection: menuSections,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface BreadcrumbJsonLdProps {
  items: { name: string; url: string }[];
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface WebsiteJsonLdProps {
  appUrl: string;
}

export function WebsiteJsonLd({ appUrl }: WebsiteJsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'MENIUS',
    url: appUrl,
    description: 'Plataforma de menús digitales premium para restaurantes. Pedidos en tiempo real, analytics, cero comisiones.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${appUrl}/r/{slug}`,
      },
      'query-input': 'required name=slug',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
