'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, Plus, Store } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  subscription_plan: string;
}

interface Props {
  currentName: string;
  currentId: string;
}

export function RestaurantSwitcher({ currentName, currentId }: Props) {
  const [open, setOpen] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchRestaurants = async () => {
    if (restaurants.length > 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/tenant/restaurants');
      if (res.ok) {
        const data = await res.json();
        setRestaurants(data.restaurants ?? []);
      }
    } catch { /* silent */ }
    setLoading(false);
  };

  const handleOpen = () => {
    if (!open) fetchRestaurants();
    setOpen(!open);
  };

  const handleSwitch = async (id: string) => {
    if (id === currentId) { setOpen(false); return; }
    setSwitching(id);
    try {
      const res = await fetch('/api/tenant/restaurants/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId: id }),
      });
      if (res.ok) {
        router.refresh();
        setOpen(false);
      }
    } catch { /* silent */ }
    setSwitching(null);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left group"
      >
        <div className="w-6 h-6 rounded-md bg-brand-50 dark:bg-brand-950 flex items-center justify-center flex-shrink-0">
          <Store className="w-3.5 h-3.5 text-brand-600" />
        </div>
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate flex-1">{currentName}</span>
        <ChevronDown className={cn('w-3 h-3 text-gray-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden">
          {loading ? (
            <div className="px-3 py-4 text-center">
              <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <>
              <div className="max-h-48 overflow-y-auto">
                {restaurants.map(r => (
                  <button
                    key={r.id}
                    onClick={() => handleSwitch(r.id)}
                    disabled={switching === r.id}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
                      r.id === currentId && 'bg-brand-50/50 dark:bg-brand-950/30'
                    )}
                  >
                    {r.logo_url ? (
                      <img src={r.logo_url} alt="" className="w-6 h-6 rounded-md object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-6 h-6 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                        <Store className="w-3 h-3 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{r.name}</p>
                      <p className="text-[10px] text-gray-400 truncate">/{r.slug}</p>
                    </div>
                    {r.id === currentId && <Check className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />}
                    {switching === r.id && (
                      <div className="w-3.5 h-3.5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
              <div className="border-t border-gray-100 dark:border-gray-800">
                <a
                  href="/onboarding/create-restaurant"
                  className="flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar restaurante
                </a>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
