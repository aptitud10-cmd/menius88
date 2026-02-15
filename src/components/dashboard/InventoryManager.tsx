'use client';

import { useState, useEffect } from 'react';
import {
  Package, AlertTriangle, XCircle, Search, Plus, Minus,
  ToggleLeft, ToggleRight, TrendingDown, BarChart3, RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductInventory {
  id: string;
  name: string;
  image_url: string | null;
  is_active: boolean;
  track_inventory: boolean;
  stock_quantity: number;
  low_stock_threshold: number;
  category_id: string;
}

interface Stats {
  total: number;
  tracked: number;
  lowStock: number;
  outOfStock: number;
}

export function InventoryManager() {
  const [products, setProducts] = useState<ProductInventory[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, tracked: 0, lowStock: 0, outOfStock: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'tracked' | 'low' | 'out'>('all');
  const [restockId, setRestockId] = useState<string | null>(null);
  const [restockQty, setRestockQty] = useState('');

  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/tenant/inventory');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products ?? []);
        setStats(data.stats ?? { total: 0, tracked: 0, lowStock: 0, outOfStock: 0 });
      }
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { fetchInventory(); }, []);

  const toggleTracking = async (product: ProductInventory) => {
    await fetch('/api/tenant/inventory', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: product.id, track_inventory: !product.track_inventory }),
    });
    setProducts(prev => prev.map(p =>
      p.id === product.id ? { ...p, track_inventory: !p.track_inventory } : p
    ));
  };

  const handleRestock = async (productId: string) => {
    const qty = parseInt(restockQty);
    if (!qty || qty <= 0) return;

    const res = await fetch('/api/tenant/inventory', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, action: 'restock', quantity: qty }),
    });
    const data = await res.json();

    if (data.success) {
      setProducts(prev => prev.map(p =>
        p.id === productId ? { ...p, stock_quantity: data.new_quantity } : p
      ));
      setRestockId(null);
      setRestockQty('');
    }
  };

  const handleSetStock = async (productId: string, quantity: number) => {
    const res = await fetch('/api/tenant/inventory', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, action: 'adjustment', quantity }),
    });
    const data = await res.json();

    if (data.success) {
      setProducts(prev => prev.map(p =>
        p.id === productId ? { ...p, stock_quantity: data.new_quantity } : p
      ));
    }
  };

  const filtered = products.filter(p => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === 'all' ? true :
      filter === 'tracked' ? p.track_inventory :
      filter === 'low' ? (p.track_inventory && p.stock_quantity <= p.low_stock_threshold && p.stock_quantity > 0) :
      filter === 'out' ? (p.track_inventory && p.stock_quantity <= 0) : true;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}
        </div>
        {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-white rounded-xl border border-gray-100" />)}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, icon: Package, color: 'text-gray-500', bg: 'bg-gray-50', onClick: () => setFilter('all') },
          { label: 'Con inventario', value: stats.tracked, icon: BarChart3, color: 'text-blue-500', bg: 'bg-blue-50', onClick: () => setFilter('tracked') },
          { label: 'Stock bajo', value: stats.lowStock, icon: TrendingDown, color: 'text-amber-500', bg: 'bg-amber-50', onClick: () => setFilter('low') },
          { label: 'Agotados', value: stats.outOfStock, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', onClick: () => setFilter('out') },
        ].map(s => {
          const Icon = s.icon;
          return (
            <button
              key={s.label}
              onClick={s.onClick}
              className={cn(
                'bg-white rounded-2xl border p-4 text-left transition-all',
                filter === (s.label === 'Total' ? 'all' : s.label === 'Con inventario' ? 'tracked' : s.label === 'Stock bajo' ? 'low' : 'out')
                  ? 'border-brand-300 ring-1 ring-brand-100' : 'border-gray-100 hover:border-gray-200'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', s.bg)}>
                  <Icon className={cn('w-3.5 h-3.5', s.color)} />
                </div>
                <span className="text-xs text-gray-400">{s.label}</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar producto..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
      </div>

      {/* Products list */}
      <div className="space-y-1.5">
        {filtered.map(product => {
          const isLow = product.track_inventory && product.stock_quantity <= product.low_stock_threshold && product.stock_quantity > 0;
          const isOut = product.track_inventory && product.stock_quantity <= 0;

          return (
            <div key={product.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3">
              <div className="flex items-center gap-3">
                {/* Name */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                    {isOut && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 uppercase">Agotado</span>
                    )}
                    {isLow && !isOut && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 uppercase">Bajo</span>
                    )}
                  </div>
                </div>

                {/* Stock display */}
                {product.track_inventory && (
                  <div className="flex items-center gap-2">
                    {restockId === product.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={restockQty}
                          onChange={(e) => setRestockQty(e.target.value)}
                          placeholder="Qty"
                          min="1"
                          autoFocus
                          className="w-16 px-2 py-1 rounded-lg border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                          onKeyDown={(e) => { if (e.key === 'Enter') handleRestock(product.id); if (e.key === 'Escape') { setRestockId(null); setRestockQty(''); } }}
                        />
                        <button
                          onClick={() => handleRestock(product.id)}
                          className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700"
                        >
                          +
                        </button>
                        <button
                          onClick={() => { setRestockId(null); setRestockQty(''); }}
                          className="px-2 py-1 rounded-lg bg-gray-100 text-gray-500 text-xs hover:bg-gray-200"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => product.stock_quantity > 0 && handleSetStock(product.id, product.stock_quantity - 1)}
                          className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 text-gray-500"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className={cn(
                          'text-sm font-bold w-10 text-center',
                          isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-gray-900'
                        )}>
                          {product.stock_quantity}
                        </span>
                        <button
                          onClick={() => { setRestockId(product.id); setRestockQty(''); }}
                          className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center hover:bg-emerald-100 text-emerald-600"
                          title="Reabastecer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* Track toggle */}
                <button
                  onClick={() => toggleTracking(product)}
                  className={cn(
                    'flex-shrink-0 transition-colors',
                    product.track_inventory ? 'text-brand-600' : 'text-gray-300'
                  )}
                  title={product.track_inventory ? 'Desactivar inventario' : 'Activar inventario'}
                >
                  {product.track_inventory ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sin productos</p>
        </div>
      )}
    </div>
  );
}
