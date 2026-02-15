import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MENIUS — Menus digitales premium para restaurantes',
  description: 'La plataforma que transforma la experiencia de tu restaurante. Menu digital con QR, pedidos en tiempo real, cero comisiones.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600&family=Sora:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-charcoal-950 text-gray-100 antialiased font-body">
        {children}
      </body>
    </html>
  );
}
