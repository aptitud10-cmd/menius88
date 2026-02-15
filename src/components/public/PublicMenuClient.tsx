'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag, X, Minus, Plus, Trash2, Send, MapPin, Clock, Phone,
  ChevronDown, Sparkles, Leaf, Wheat, Star, ArrowLeft, Check,
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { formatPrice, cn } from '@/lib/utils';
import type { Restaurant, Category, Product, ProductVariant, ProductExtra, DaySchedule } from '@/types';

interface PublicMenuClientProps {
  restaurant: Restaurant;
  categories: Category[];
  products: Product[];
  tableName: string | null;
  currentLanguage?: string;
  supportedLanguages?: string[];
}

// ---- Dietary tag icons ----
const DIETARY_ICONS: Record<string, { icon: typeof Leaf; label: string; color: string }> = {
  vegetarian: { icon: Leaf, label: 'Vegetariano', color: 'text-green-600 bg-green-50' },
  vegan: { icon: Sparkles, label: 'Vegano', color: 'text-emerald-600 bg-emerald-50' },
  'gluten-free': { icon: Wheat, label: 'Sin Gluten', color: 'text-amber-600 bg-amber-50' },
};

function isOpenNow(hours?: DaySchedule[]): { open: boolean; until?: string } {
  if (!hours || hours.length === 0) return { open: true };
  const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const now = new Date();
  const dayName = days[now.getDay()];
  const todaySchedule = hours.find(h => h.day.toLowerCase() === dayName);
  if (!todaySchedule || todaySchedule.closed) return { open: false };
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  if (currentTime >= todaySchedule.open && currentTime <= todaySchedule.close) {
    return { open: true, until: todaySchedule.close };
  }
  return { open: false };
}

const LANG_FLAGS: Record<string, string> = {
  es: '🇲🇽', en: '🇺🇸', fr: '🇫🇷', de: '🇩🇪', pt: '🇧🇷', it: '🇮🇹', ja: '🇯🇵', zh: '🇨🇳', ko: '🇰🇷',
};

export function PublicMenuClient({ restaurant, categories, products, tableName, currentLanguage = 'es', supportedLanguages = ['es'] }: PublicMenuClientProps) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? '');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [allergenFilters, setAllergenFilters] = useState<string[]>([]);
  const [dietaryFilters, setDietaryFilters] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const catBarRef = useRef<HTMLDivElement>(null);

  const totalItems = useCartStore((s) => s.totalItems);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const setOpen = useCartStore((s) => s.setOpen);
  const isOpen = useCartStore((s) => s.isOpen);

  const status = isOpenNow(restaurant.operating_hours);
  const hasCover = !!restaurant.cover_image_url;

  const handleCategorySelect = useCallback((catId: string) => {
    setActiveCategory(catId);
    const el = sectionRefs.current[catId];
    if (el) {
      const offset = hasCover ? 180 : 120;
      const y = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    // Scroll category pill into view
    const catBar = catBarRef.current;
    if (catBar) {
      const pill = catBar.querySelector(`[data-cat="${catId}"]`) as HTMLElement;
      if (pill) {
        pill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [hasCover]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActiveCategory(e.target.id);
        }
      },
      { rootMargin: '-140px 0px -60% 0px' }
    );
    Object.values(sectionRefs.current).forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  const filteredProducts = products.filter(p => {
    // Exclude products with any selected allergen
    if (allergenFilters.length > 0 && p.allergens?.some(a => allergenFilters.includes(a))) return false;
    // Include only products matching dietary filter
    if (dietaryFilters.length > 0 && !dietaryFilters.every(d => p.dietary_tags?.includes(d))) return false;
    return true;
  });

  const itemsByCategory = categories.map((cat) => ({
    category: cat,
    items: filteredProducts.filter((p) => p.category_id === cat.id),
  }));

  const totalProducts = filteredProducts.length;
  const hasActiveFilters = allergenFilters.length > 0 || dietaryFilters.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* ===== Hero Section ===== */}
      {hasCover ? (
        <div className="relative h-52 sm:h-64 overflow-hidden">
          <Image
            src={restaurant.cover_image_url!}
            alt={restaurant.name}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
            <div className="max-w-2xl mx-auto">
              {restaurant.logo_url && (
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 overflow-hidden mb-3 shadow-lg">
                  <Image src={restaurant.logo_url} alt="" width={56} height={56} className="object-cover w-full h-full" />
                </div>
              )}
              <h1 className="text-2xl font-bold tracking-tight">{restaurant.name}</h1>
              {restaurant.tagline && (
                <p className="text-white/80 text-sm mt-0.5">{restaurant.tagline}</p>
              )}
              <div className="flex items-center gap-3 mt-2 text-xs text-white/70">
                {restaurant.cuisine_type && (
                  <span className="bg-white/15 backdrop-blur-sm px-2 py-0.5 rounded-full">{restaurant.cuisine_type}</span>
                )}
                <span className={cn(
                  'px-2 py-0.5 rounded-full font-medium',
                  status.open ? 'bg-emerald-500/20 text-emerald-200' : 'bg-red-500/20 text-red-200'
                )}>
                  {status.open ? `Abierto${status.until ? ` hasta ${status.until}` : ''}` : 'Cerrado'}
                </span>
                {tableName && (
                  <span className="bg-white/15 backdrop-blur-sm px-2 py-0.5 rounded-full">{tableName}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <header className="bg-white border-b border-gray-100">
          <div className="max-w-2xl mx-auto px-4 py-5">
            <div className="flex items-center gap-3">
              {restaurant.logo_url && (
                <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                  <Image src={restaurant.logo_url} alt="" width={48} height={48} className="object-cover w-full h-full" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-gray-900 truncate">{restaurant.name}</h1>
                {restaurant.tagline && <p className="text-sm text-gray-500 truncate">{restaurant.tagline}</p>}
              </div>
              <span className={cn(
                'flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium',
                status.open ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
              )}>
                {status.open ? 'Abierto' : 'Cerrado'}
              </span>
            </div>
            {/* Info chips */}
            <div className="flex items-center gap-2 mt-3 text-xs text-gray-500 flex-wrap">
              {restaurant.cuisine_type && (
                <span className="bg-gray-100 px-2 py-0.5 rounded-full">{restaurant.cuisine_type}</span>
              )}
              {restaurant.address && (
                <button onClick={() => setShowInfo(true)} className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full hover:bg-gray-200 transition-colors">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate max-w-[120px]">{restaurant.address}</span>
                </button>
              )}
              {tableName && (
                <span className="bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full font-medium">{tableName}</span>
              )}
            </div>
          </div>
        </header>
      )}

      {/* ===== Sticky Navigation ===== */}
      <div className={cn(
        'sticky z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm',
        hasCover ? 'top-0' : 'top-0'
      )}>
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          {/* Language selector */}
          {supportedLanguages.length > 1 && (
            <div className="flex-shrink-0 ml-2">
              <select
                value={currentLanguage}
                onChange={(e) => {
                  const url = new URL(window.location.href);
                  url.searchParams.set('lang', e.target.value);
                  window.location.href = url.toString();
                }}
                className="text-xs bg-gray-100 border-0 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                {supportedLanguages.map(l => (
                  <option key={l} value={l}>{LANG_FLAGS[l] ?? '🌐'} {l.toUpperCase()}</option>
                ))}
              </select>
            </div>
          )}

          {/* Filter button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex-shrink-0 relative p-2.5 ml-1 rounded-lg transition-colors',
              hasActiveFilters ? 'bg-brand-50 text-brand-600' : 'text-gray-600'
            )}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {hasActiveFilters && (
              <span className="absolute -top-0 -right-0 w-4 h-4 flex items-center justify-center rounded-full bg-brand-600 text-white text-[8px] font-bold">
                {allergenFilters.length + dietaryFilters.length}
              </span>
            )}
          </button>

          {/* Cart button in nav */}
          <button
            onClick={() => setOpen(true)}
            className="flex-shrink-0 relative p-2.5"
          >
            <ShoppingBag className="w-5 h-5 text-gray-600" />
            {totalItems() > 0 && (
              <span className="absolute -top-0 -right-0 w-5 h-5 flex items-center justify-center rounded-full bg-brand-600 text-white text-[10px] font-bold animate-[scaleIn_0.2s_ease-out]">
                {totalItems()}
              </span>
            )}
          </button>
          {/* Category pills */}
          <div ref={catBarRef} className="flex-1 py-2.5 flex gap-1.5 overflow-x-auto scrollbar-hide pr-4">
            {categories.map((cat) => {
              const count = products.filter(p => p.category_id === cat.id).length;
              return (
                <button
                  key={cat.id}
                  data-cat={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className={cn(
                    'flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap',
                    activeCategory === cat.id
                      ? 'bg-gray-900 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {cat.name}
                  {count > 0 && <span className="ml-1 opacity-60">{count}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== Allergen/Dietary Filters ===== */}
      {showFilters && (
        <div className="bg-white border-b border-gray-100 shadow-sm animate-[slideDown_0.2s_ease-out]">
          <div className="max-w-2xl mx-auto px-4 py-3 space-y-3">
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Filtros dietéticos</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'vegetarian', label: '🥬 Vegetariano' },
                  { id: 'vegan', label: '🌱 Vegano' },
                  { id: 'gluten-free', label: '🌾 Sin Gluten' },
                ].map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => setDietaryFilters(prev =>
                      prev.includes(tag.id) ? prev.filter(f => f !== tag.id) : [...prev, tag.id]
                    )}
                    className={cn(
                      'text-xs px-3 py-1.5 rounded-full font-medium transition-all border',
                      dietaryFilters.includes(tag.id)
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    )}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Excluir alérgenos</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'gluten', label: 'Gluten' },
                  { id: 'lactose', label: 'Lácteos' },
                  { id: 'nuts', label: 'Frutos secos' },
                  { id: 'shellfish', label: 'Mariscos' },
                  { id: 'eggs', label: 'Huevo' },
                  { id: 'soy', label: 'Soja' },
                  { id: 'fish', label: 'Pescado' },
                  { id: 'peanuts', label: 'Cacahuate' },
                ].map(a => (
                  <button
                    key={a.id}
                    onClick={() => setAllergenFilters(prev =>
                      prev.includes(a.id) ? prev.filter(f => f !== a.id) : [...prev, a.id]
                    )}
                    className={cn(
                      'text-xs px-3 py-1.5 rounded-full font-medium transition-all border',
                      allergenFilters.includes(a.id)
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    )}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
            {hasActiveFilters && (
              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-gray-500">{totalProducts} productos encontrados</p>
                <button
                  onClick={() => { setAllergenFilters([]); setDietaryFilters([]); }}
                  className="text-xs text-brand-600 font-medium hover:text-brand-700"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== Menu Items ===== */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        {totalProducts === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Este menú aún no tiene productos</p>
            <p className="text-sm mt-1 text-gray-300">Los productos aparecerán aquí cuando el restaurante los agregue</p>
          </div>
        ) : (
          itemsByCategory.map(({ category, items }) =>
            items.length > 0 ? (
              <div
                key={category.id}
                id={category.id}
                ref={(el) => { sectionRefs.current[category.id] = el; }}
                className="mb-8"
              >
                <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  {category.name}
                  <span className="text-xs font-normal text-gray-400">{items.length}</span>
                </h2>
                <div className="grid grid-cols-1 gap-2.5">
                  {items.map((item) => (
                    <ProductCard
                      key={item.id}
                      product={item}
                      onSelect={() => setSelectedProduct(item)}
                    />
                  ))}
                </div>
              </div>
            ) : null
          )
        )}
      </div>

      {/* ===== Floating Cart Button ===== */}
      {totalItems() > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-gradient-to-t from-white via-white/95 to-transparent pt-10 pointer-events-none">
          <div className="max-w-2xl mx-auto pointer-events-auto">
            <button
              onClick={() => setOpen(true)}
              className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-gray-900 text-white shadow-2xl shadow-black/20 hover:bg-gray-800 active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                  {totalItems()}
                </div>
                <span className="font-semibold text-sm">Ver carrito</span>
              </div>
              <span className="font-bold">{formatPrice(totalPrice())}</span>
            </button>
          </div>
        </div>
      )}

      {/* ===== Restaurant Info Modal ===== */}
      {showInfo && (
        <InfoModal restaurant={restaurant} status={status} onClose={() => setShowInfo(false)} />
      )}

      {/* ===== Product Detail Modal ===== */}
      {selectedProduct && (
        <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}

      {/* ===== Cart Drawer ===== */}
      {isOpen && <CartDrawer restaurant={restaurant} tableName={tableName} />}

      {/* ===== Custom styles ===== */}
      <style jsx global>{`
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes scaleIn { from { transform: scale(0); } to { transform: scale(1); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

// =========================================================
// Product Card
// =========================================================
function ProductCard({ product, onSelect }: { product: Product; onSelect: () => void }) {
  const dietaryTags = product.dietary_tags ?? [];
  const addItem = useCartStore((s) => s.addItem);

  const hasVariants = (product.variants?.length ?? 0) > 0;
  const hasExtras = (product.extras?.length ?? 0) > 0;
  const needsModal = hasVariants || hasExtras;

  const handleQuickAdd = (e: React.MouseEvent) => {
    if (needsModal) return;
    e.stopPropagation();
    addItem(product, null, [], 1, '');
  };

  return (
    <button
      onClick={onSelect}
      className="w-full flex gap-3.5 p-3 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 text-left group transition-all active:scale-[0.99]"
    >
      {product.image_url ? (
        <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="96px"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Quick-add overlay */}
          {!needsModal && (
            <div
              onClick={handleQuickAdd}
              className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center"
            >
              <span className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
                <Plus className="w-4 h-4 text-gray-700" />
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="relative w-24 h-24 flex-shrink-0 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <span className="text-3xl opacity-40">
            {product.name.slice(0, 1).toUpperCase()}
          </span>
        </div>
      )}

      <div className="flex-1 min-w-0 py-0.5 flex flex-col">
        <h3 className="font-semibold text-[15px] text-gray-900 truncate">{product.name}</h3>
        {product.description && (
          <p className="text-xs text-gray-400 line-clamp-2 mt-0.5 leading-relaxed">{product.description}</p>
        )}

        {/* Tags */}
        {dietaryTags.length > 0 && (
          <div className="flex items-center gap-1 mt-1.5">
            {dietaryTags.slice(0, 3).map(tag => {
              const config = DIETARY_ICONS[tag];
              if (!config) return null;
              const TagIcon = config.icon;
              return (
                <span key={tag} className={cn('inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium', config.color)}>
                  <TagIcon className="w-2.5 h-2.5" />
                  {config.label}
                </span>
              );
            })}
          </div>
        )}

        <div className="mt-auto pt-1.5 flex items-center justify-between">
          <p className="text-base font-bold text-gray-900">{formatPrice(Number(product.price))}</p>
          {product.prep_time_minutes && (
            <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
              <Clock className="w-3 h-3" />
              {product.prep_time_minutes} min
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// =========================================================
// Product Modal
// =========================================================
function ProductModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const [qty, setQty] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedExtras, setSelectedExtras] = useState<ProductExtra[]>([]);
  const [notes, setNotes] = useState('');
  const addItem = useCartStore((s) => s.addItem);

  const variants = product.variants ?? [];
  const extras = product.extras ?? [];
  const dietaryTags = product.dietary_tags ?? [];
  const allergens = product.allergens ?? [];

  const unitPrice = Number(product.price) + (selectedVariant?.price_delta ?? 0) + selectedExtras.reduce((s, e) => s + Number(e.price), 0);

  const handleAdd = () => {
    addItem(product, selectedVariant, selectedExtras, qty, notes);
    onClose();
  };

  const toggleExtra = (extra: ProductExtra) => {
    setSelectedExtras((prev) =>
      prev.find((e) => e.id === extra.id) ? prev.filter((e) => e.id !== extra.id) : [...prev, extra]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-[fadeIn_0.15s_ease-out]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto animate-[slideUp_0.3s_ease-out]">
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white transition-colors">
          <X className="w-4 h-4" />
        </button>

        {/* Image */}
        {product.image_url ? (
          <div className="relative w-full aspect-[16/10] bg-gray-100">
            <Image src={product.image_url} alt={product.name} fill sizes="512px" className="object-cover" />
          </div>
        ) : (
          <div className="w-full h-24 bg-gradient-to-br from-gray-50 to-gray-100" />
        )}

        <div className="p-5 pb-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
              {product.description && <p className="text-sm text-gray-500 mt-1 leading-relaxed">{product.description}</p>}
            </div>
            <p className="text-xl font-bold text-gray-900 flex-shrink-0">{formatPrice(Number(product.price))}</p>
          </div>

          {/* Tags & Info */}
          {(dietaryTags.length > 0 || allergens.length > 0 || product.calories) && (
            <div className="flex flex-wrap items-center gap-1.5 mt-3">
              {dietaryTags.map(tag => {
                const config = DIETARY_ICONS[tag];
                if (!config) return null;
                const TagIcon = config.icon;
                return (
                  <span key={tag} className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium', config.color)}>
                    <TagIcon className="w-3 h-3" />
                    {config.label}
                  </span>
                );
              })}
              {product.calories && (
                <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-lg">{product.calories} kcal</span>
              )}
              {allergens.length > 0 && (
                <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg">
                  Alérgenos: {allergens.join(', ')}
                </span>
              )}
            </div>
          )}

          {/* Variants */}
          {variants.length > 0 && (
            <div className="mt-5">
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Elige tu opción</label>
              <div className="space-y-1.5">
                {variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(selectedVariant?.id === v.id ? null : v)}
                    className={cn(
                      'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all text-left',
                      selectedVariant?.id === v.id
                        ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                        selectedVariant?.id === v.id ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
                      )}>
                        {selectedVariant?.id === v.id && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm font-medium">{v.name}</span>
                    </div>
                    {v.price_delta > 0 && (
                      <span className="text-sm font-medium text-gray-500">+{formatPrice(Number(v.price_delta))}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Extras */}
          {extras.length > 0 && (
            <div className="mt-5">
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Extras</label>
              <div className="space-y-1.5">
                {extras.map((ex) => {
                  const isSelected = !!selectedExtras.find((e) => e.id === ex.id);
                  return (
                    <button
                      key={ex.id}
                      onClick={() => toggleExtra(ex)}
                      className={cn(
                        'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all text-left',
                        isSelected
                          ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all',
                          isSelected ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
                        )}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-sm font-medium">{ex.name}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-500">+{formatPrice(Number(ex.price))}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="mt-5">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instrucciones especiales (sin cebolla, bien cocido...)"
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 resize-none placeholder:text-gray-400"
            />
          </div>

          {/* Quantity + Add to cart */}
          <div className="flex items-center gap-3 mt-5">
            <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-1.5 py-1.5">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-6 text-center font-bold text-sm">{qty}</span>
              <button
                onClick={() => setQty(qty + 1)}
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={handleAdd}
              className="flex-1 py-3 rounded-xl bg-gray-900 text-white font-semibold shadow-lg shadow-black/10 hover:bg-gray-800 active:scale-[0.98] transition-all"
            >
              Agregar · {formatPrice(unitPrice * qty)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================
// Restaurant Info Modal
// =========================================================
function InfoModal({ restaurant, status, onClose }: { restaurant: Restaurant; status: { open: boolean; until?: string }; onClose: () => void }) {
  const hours = restaurant.operating_hours ?? [];
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-[fadeIn_0.15s_ease-out]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-y-auto animate-[slideUp_0.3s_ease-out] p-6">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors">
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-lg font-bold mb-4">{restaurant.name}</h2>

        {restaurant.description && (
          <p className="text-sm text-gray-500 mb-4 leading-relaxed">{restaurant.description}</p>
        )}

        {/* Contact */}
        <div className="space-y-2.5 mb-5">
          {restaurant.address && (
            <div className="flex items-start gap-2.5 text-sm">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-600">{restaurant.address}</span>
            </div>
          )}
          {restaurant.phone && (
            <a href={`tel:${restaurant.phone}`} className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-gray-900">
              <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
              {restaurant.phone}
            </a>
          )}
        </div>

        {/* Hours */}
        {hours.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              Horarios
            </h3>
            <div className="space-y-1.5">
              {hours.map((h, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 capitalize">{h.day}</span>
                  {h.closed ? (
                    <span className="text-gray-400">Cerrado</span>
                  ) : (
                    <span className="font-medium text-gray-700">{h.open} - {h.close}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =========================================================
// Cart Drawer (Premium)
// =========================================================
function CartDrawer({ restaurant, tableName }: { restaurant: Restaurant; tableName: string | null }) {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const setOpen = useCartStore((s) => s.setOpen);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQty = useCartStore((s) => s.updateQty);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const totalItems = useCartStore((s) => s.totalItems);
  const clearCart = useCartStore((s) => s.clearCart);

  const [showCheckout, setShowCheckout] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<{ order_number: string; order_id: string } | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState<{ promotion_id: string; code: string; description: string; discount_amount: number; discount_type: string; discount_value: number } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [orderType, setOrderType] = useState<'dine_in' | 'pickup' | 'delivery'>(tableName ? 'dine_in' : 'pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [tipPercent, setTipPercent] = useState(0);
  const [customTip, setCustomTip] = useState('');

  const orderConfig = restaurant.order_config;
  const taxRate = orderConfig?.taxRate ?? 0;
  const deliveryEnabled = orderConfig?.deliveryEnabled ?? false;
  const pickupEnabled = orderConfig?.pickupEnabled ?? true;
  const dineInEnabled = orderConfig?.dineInEnabled ?? true;
  const deliveryFee = orderType === 'delivery' ? (orderConfig?.deliveryFee ?? 0) : 0;
  const subtotal = totalPrice();
  const discountAmount = promoApplied?.discount_amount ?? 0;
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const taxAmount = afterDiscount * (taxRate / 100);
  const tipAmount = customTip ? parseFloat(customTip) || 0 : (afterDiscount * tipPercent / 100);
  const grandTotal = afterDiscount + taxAmount + deliveryFee + tipAmount;

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError('');
    try {
      const res = await fetch('/api/orders/validate-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurant_id: restaurant.id, code: promoCode, subtotal }),
      });
      const data = await res.json();
      if (data.valid) {
        setPromoApplied(data);
      } else {
        setPromoError(data.error || 'Código no válido');
        setPromoApplied(null);
      }
    } catch {
      setPromoError('Error al validar código');
    }
    setPromoLoading(false);
  };

  const handleSendOrder = async () => {
    if (!customerName.trim()) return;
    if (orderType === 'delivery' && !deliveryAddress.trim()) return;
    setSubmitting(true);

    try {
      const scheduledFor = isScheduled && scheduledDate && scheduledTime
        ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
        : undefined;

      const orderPayload = {
        restaurant_id: restaurant.id,
        customer_name: customerName,
        customer_phone: customerPhone || undefined,
        notes: orderNotes,
        order_type: orderType,
        delivery_address: orderType === 'delivery' ? deliveryAddress : undefined,
        discount_code: promoApplied?.code || undefined,
        promotion_id: promoApplied?.promotion_id || undefined,
        discount_amount: discountAmount || undefined,
        tip_amount: tipAmount > 0 ? tipAmount : undefined,
        is_scheduled: isScheduled || undefined,
        scheduled_for: scheduledFor,
        items: items.map((item) => ({
          product_id: item.product.id,
          variant_id: item.variant?.id ?? null,
          qty: item.qty,
          unit_price: Number(item.product.price) + (item.variant?.price_delta ?? 0),
          line_total: item.lineTotal,
          notes: item.notes,
          extras: item.extras.map((ex) => ({
            extra_id: ex.id,
            price: Number(ex.price),
          })),
        })),
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al enviar el pedido');
      }

      setOrderResult({
        order_number: result.order.order_number,
        order_id: result.order.id,
      });
      clearCart();
    } catch (err) {
      console.error('Error placing order:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // ===== Order confirmation =====
  if (orderResult) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center animate-[fadeIn_0.15s_ease-out]">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="relative w-full max-w-sm mx-4 bg-white rounded-3xl p-8 text-center animate-[slideUp_0.3s_ease-out] shadow-2xl">
          {/* Success animation */}
          <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
              <Check className="w-7 h-7 text-emerald-600" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">¡Pedido enviado!</h2>
          <p className="text-sm text-gray-500 mb-4">Tu pedido está en camino a la cocina</p>

          <div className="bg-gray-50 rounded-2xl p-4 mb-5">
            <p className="text-xs text-gray-400 mb-0.5">Número de pedido</p>
            <p className="font-mono font-bold text-2xl text-gray-900">{orderResult.order_number}</p>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => {
                router.push(`/r/${restaurant.slug}/order/${orderResult.order_number}`);
              }}
              className="w-full py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-colors"
            >
              Seguir mi pedido
            </button>
            <button
              onClick={() => { setOpen(false); setOrderResult(null); }}
              className="w-full py-2.5 rounded-xl text-gray-500 font-medium text-sm hover:bg-gray-50 transition-colors"
            >
              Volver al menú
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-[fadeIn_0.15s_ease-out]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-md bg-white h-full flex flex-col animate-[slideInRight_0.3s_ease-out] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          {showCheckout ? (
            <button onClick={() => setShowCheckout(false)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Volver
            </button>
          ) : (
            <h2 className="text-lg font-bold">Carrito <span className="text-sm font-normal text-gray-400">({totalItems()} items)</span></h2>
          )}
          <button onClick={() => setOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!showCheckout ? (
          <>
            {/* Cart items */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <ShoppingBag className="w-10 h-10 mb-3 opacity-30" />
                  <p className="font-medium">Tu carrito está vacío</p>
                  <p className="text-xs text-gray-300 mt-1">Agrega productos del menú</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex gap-3 p-3.5 rounded-xl bg-gray-50/80 border border-gray-100">
                      {/* Thumbnail */}
                      {item.product.image_url ? (
                        <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                          <Image src={item.product.image_url} alt={item.product.name} fill sizes="64px" className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 flex-shrink-0 rounded-lg bg-gray-100 flex items-center justify-center text-xl text-gray-300">
                          {item.product.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate text-gray-900">{item.product.name}</h4>
                        {item.variant && <p className="text-xs text-gray-400">{item.variant.name}</p>}
                        {item.extras.length > 0 && (
                          <p className="text-xs text-gray-400">+{item.extras.map((e) => e.name).join(', ')}</p>
                        )}
                        {item.notes && <p className="text-xs text-gray-400 italic mt-0.5">"{item.notes}"</p>}

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-bold text-gray-900">{formatPrice(item.lineTotal)}</span>
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center gap-0.5 bg-white rounded-lg border border-gray-200 px-0.5 py-0.5">
                              <button onClick={() => updateQty(idx, item.qty - 1)} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors">
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-6 text-center text-xs font-bold">{item.qty}</span>
                              <button onClick={() => updateQty(idx, item.qty + 1)} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors">
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <button onClick={() => removeItem(idx)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-gray-100 px-5 py-4 space-y-3 bg-white">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  {taxRate > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Impuesto ({taxRate}%)</span>
                      <span className="font-medium">{formatPrice(taxAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1.5 border-t border-gray-100">
                    <span className="font-semibold">Total</span>
                    <span className="text-xl font-bold">{formatPrice(grandTotal)}</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowCheckout(true)}
                  className="w-full py-3.5 rounded-xl bg-gray-900 text-white font-semibold shadow-lg shadow-black/10 hover:bg-gray-800 active:scale-[0.98] transition-all"
                >
                  Continuar
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Checkout form */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
              {/* Order type selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de pedido</label>
                <div className="grid grid-cols-3 gap-2">
                  {dineInEnabled && (
                    <button
                      onClick={() => setOrderType('dine_in')}
                      className={cn(
                        'px-3 py-2.5 rounded-xl text-xs font-semibold text-center transition-all border',
                        orderType === 'dine_in'
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      )}
                    >
                      🍽️ Comer aquí
                    </button>
                  )}
                  {pickupEnabled && (
                    <button
                      onClick={() => setOrderType('pickup')}
                      className={cn(
                        'px-3 py-2.5 rounded-xl text-xs font-semibold text-center transition-all border',
                        orderType === 'pickup'
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      )}
                    >
                      🥡 Para llevar
                    </button>
                  )}
                  {deliveryEnabled && (
                    <button
                      onClick={() => setOrderType('delivery')}
                      className={cn(
                        'px-3 py-2.5 rounded-xl text-xs font-semibold text-center transition-all border',
                        orderType === 'delivery'
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      )}
                    >
                      🛵 Delivery
                    </button>
                  )}
                </div>
                {tableName && orderType === 'dine_in' && (
                  <p className="text-xs text-gray-400 mt-1.5">Mesa: {tableName}</p>
                )}
              </div>

              {/* Delivery address */}
              {orderType === 'delivery' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Dirección de entrega *</label>
                  <textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Calle, número, colonia, referencias..."
                    rows={2}
                    className="w-full px-3.5 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 resize-none transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tu nombre *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="¿Cómo te llamas?"
                  className="w-full px-3.5 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Teléfono <span className="font-normal text-gray-400">(opcional)</span></label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Para notificarte cuando esté listo"
                  className="w-full px-3.5 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notas <span className="font-normal text-gray-400">(opcional)</span></label>
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Instrucciones especiales para la cocina..."
                  rows={2}
                  className="w-full px-3.5 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 resize-none transition-all"
                />
              </div>

              {/* Promo code */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Código de descuento <span className="font-normal text-gray-400">(opcional)</span></label>
                {promoApplied ? (
                  <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-bold text-emerald-700">{promoApplied.code}</span>
                      <span className="text-xs text-emerald-600">-{formatPrice(promoApplied.discount_amount)}</span>
                    </div>
                    <button onClick={() => { setPromoApplied(null); setPromoCode(''); }} className="text-xs text-emerald-600 hover:text-emerald-800 font-medium">
                      Quitar
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(''); }}
                      placeholder="CÓDIGO"
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-all"
                    />
                    <button
                      onClick={handleApplyPromo}
                      disabled={promoLoading || !promoCode.trim()}
                      className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
                    >
                      {promoLoading ? '...' : 'Aplicar'}
                    </button>
                  </div>
                )}
                {promoError && <p className="text-xs text-red-500 mt-1">{promoError}</p>}
              </div>

              {/* Tip selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Propina <span className="font-normal text-gray-400">(opcional)</span></label>
                <div className="flex gap-2">
                  {[0, 10, 15, 20].map(pct => (
                    <button
                      key={pct}
                      onClick={() => { setTipPercent(pct); setCustomTip(''); }}
                      className={cn(
                        'flex-1 py-2 rounded-xl text-sm font-medium transition-all border',
                        tipPercent === pct && !customTip
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      )}
                    >
                      {pct === 0 ? 'Sin' : `${pct}%`}
                    </button>
                  ))}
                  <input
                    type="number"
                    value={customTip}
                    onChange={(e) => { setCustomTip(e.target.value); setTipPercent(0); }}
                    placeholder="$"
                    min="0"
                    className="w-20 px-3 py-2 rounded-xl border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                  />
                </div>
              </div>

              {/* Schedule order */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">Programar pedido</label>
                  <button
                    onClick={() => setIsScheduled(!isScheduled)}
                    className={cn(
                      'text-xs px-3 py-1 rounded-lg font-medium transition-colors',
                      isScheduled ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    )}
                  >
                    {isScheduled ? 'Programado' : 'Para ahora'}
                  </button>
                </div>
                {isScheduled && (
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 10)}
                      className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                    />
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-28 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                    />
                  </div>
                )}
              </div>

              {/* Order summary */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Resumen</h4>
                {items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.qty}x {item.product.name}</span>
                    <span className="font-medium text-gray-700">{formatPrice(item.lineTotal)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-200 pt-2 mt-2 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {promoApplied && (
                    <div className="flex justify-between text-sm text-emerald-600">
                      <span>Descuento ({promoApplied.code})</span>
                      <span>-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  {deliveryFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Envío</span>
                      <span>{formatPrice(deliveryFee)}</span>
                    </div>
                  )}
                  {taxRate > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Impuesto</span>
                      <span>{formatPrice(taxAmount)}</span>
                    </div>
                  )}
                  {tipAmount > 0 && (
                    <div className="flex justify-between text-sm text-brand-600">
                      <span>Propina</span>
                      <span>{formatPrice(tipAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base pt-1">
                    <span>Total</span>
                    <span>{formatPrice(grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="border-t border-gray-100 px-5 py-4 bg-white">
              <button
                onClick={handleSendOrder}
                disabled={submitting || !customerName.trim()}
                className="w-full py-3.5 rounded-xl bg-gray-900 text-white font-semibold shadow-lg shadow-black/10 hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando...
                  </span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Confirmar pedido · {formatPrice(grandTotal)}
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
