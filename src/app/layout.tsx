import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://menius.vercel.app'),
  title: {
    default: 'MENIUS — Menús digitales premium para restaurantes',
    template: '%s | MENIUS',
  },
  description: 'La plataforma que transforma la experiencia de tu restaurante. Menú digital con QR, pedidos en tiempo real, analytics, cero comisiones.',
  keywords: ['menú digital', 'restaurante', 'QR', 'pedidos online', 'SaaS', 'MENIUS'],
  authors: [{ name: 'MENIUS' }],
  creator: 'MENIUS',
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    siteName: 'MENIUS',
    title: 'MENIUS — Menús digitales premium para restaurantes',
    description: 'Menú digital con QR, pedidos en tiempo real, analytics. Sin comisiones.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MENIUS — Menús digitales premium',
    description: 'Transforma la experiencia de tu restaurante con menús digitales premium.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#7c3aed',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600&family=Sora:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MENIUS" />
      </head>
      <body className="bg-charcoal-950 text-gray-100 antialiased font-body">
        {children}
      </body>
    </html>
  );
}
