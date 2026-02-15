'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface Props {
  restaurant: {
    id: string;
    name: string;
    logo_url: string | null;
    theme: any;
    currency: string;
  };
  categories: Array<{ id: string; name: string; schedule_label?: string | null }>;
  products: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    image_url: string;
    category_id: string;
    dietary_tags?: string[];
  }>;
}

const DIETARY_ICONS: Record<string, string> = {
  vegetarian: '🥬',
  vegan: '🌱',
  'gluten-free': '🌾',
};

export function MenuDisplay({ restaurant, categories, products }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [time, setTime] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const theme = restaurant.theme ?? {};
  const primaryColor = theme.primaryColor ?? '#E11D48';
  const darkMode = theme.darkMode ?? true;
  const curr = restaurant.currency ?? 'MXN';
  const fmt = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: curr }).format(n);

  const itemsByCategory = categories.map(cat => ({
    category: cat,
    items: products.filter(p => p.category_id === cat.id),
  })).filter(g => g.items.length > 0);

  // Auto-rotate categories every 8 seconds
  useEffect(() => {
    if (itemsByCategory.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setActiveIdx(prev => (prev + 1) % itemsByCategory.length);
    }, 8000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [itemsByCategory.length]);

  // Clock
  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const t = setInterval(updateTime, 30000);
    return () => clearInterval(t);
  }, []);

  const current = itemsByCategory[activeIdx];
  if (!current) return null;

  return (
    <div className={cn('min-h-screen flex flex-col', darkMode ? 'bg-gray-950 text-white' : 'bg-white text-gray-900')}>
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 border-b" style={{ borderColor: darkMode ? '#1F2937' : '#F3F4F6' }}>
        <div className="flex items-center gap-4">
          {restaurant.logo_url && (
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/10">
              <Image src={restaurant.logo_url} alt="" width={48} height={48} className="object-cover w-full h-full" />
            </div>
          )}
          <h1 className="text-2xl font-bold" style={{ color: primaryColor }}>{restaurant.name}</h1>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold tabular-nums" style={{ color: primaryColor }}>{time}</p>
        </div>
      </header>

      {/* Category tabs */}
      <div className="flex items-center gap-2 px-8 py-3 overflow-x-auto" style={{ borderBottom: `1px solid ${darkMode ? '#1F2937' : '#F3F4F6'}` }}>
        {itemsByCategory.map((g, i) => (
          <button
            key={g.category.id}
            onClick={() => { setActiveIdx(i); if (intervalRef.current) clearInterval(intervalRef.current); }}
            className={cn(
              'px-5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all',
              i === activeIdx ? 'text-white shadow-lg' : (darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600')
            )}
            style={i === activeIdx ? { backgroundColor: primaryColor } : {}}
          >
            {g.category.name}
            {g.category.schedule_label && (
              <span className="ml-1.5 text-[10px] opacity-60">({g.category.schedule_label})</span>
            )}
          </button>
        ))}
      </div>

      {/* Products grid */}
      <div className="flex-1 p-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {current.items.map(product => (
            <div
              key={product.id}
              className={cn(
                'rounded-2xl overflow-hidden transition-all',
                darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-gray-50 border border-gray-100'
              )}
            >
              {product.image_url ? (
                <div className="relative h-40 overflow-hidden">
                  <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center" style={{ backgroundColor: primaryColor + '10' }}>
                  <span className="text-4xl opacity-30">🍽️</span>
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold leading-tight">{product.name}</h3>
                  {product.dietary_tags && product.dietary_tags.length > 0 && (
                    <div className="flex gap-0.5 flex-shrink-0">
                      {product.dietary_tags.map(t => (
                        <span key={t} className="text-xs">{DIETARY_ICONS[t] ?? ''}</span>
                      ))}
                    </div>
                  )}
                </div>
                {product.description && (
                  <p className={cn('text-xs mt-1 line-clamp-2', darkMode ? 'text-gray-500' : 'text-gray-400')}>
                    {product.description}
                  </p>
                )}
                <p className="text-xl font-bold mt-3" style={{ color: primaryColor }}>
                  {fmt(product.price)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="px-8 py-3 text-center border-t" style={{ borderColor: darkMode ? '#1F2937' : '#F3F4F6' }}>
        <div className="flex items-center justify-center gap-3">
          {itemsByCategory.map((_, i) => (
            <div key={i} className={cn('w-2 h-2 rounded-full transition-all',
              i === activeIdx ? 'w-6' : 'opacity-30'
            )} style={{ backgroundColor: i === activeIdx ? primaryColor : (darkMode ? '#6B7280' : '#D1D5DB') }} />
          ))}
        </div>
      </footer>
    </div>
  );
}
