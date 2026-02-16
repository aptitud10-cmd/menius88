'use client';

import { useState, useEffect } from 'react';
import { Package, Plus, X, Trash2, Eye, EyeOff, DollarSign, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category_id: string;
}

interface Category {
  id: string;
  name: string;
}

interface ComboItem {
  product_id: string;
  quantity: number;
  product?: Product;
}

interface Combo {
  id: string;
  name: string;
  description: string;
  image_url: string;
  original_price: number;
  combo_price: number;
  is_active: boolean;
  combo_items: (ComboItem & { product: Product })[];
}

export function CombosManager({ products, categories }: { products: Product[]; categories: Category[] }) {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [comboPrice, setComboPrice] = useState('');
  const [selectedItems, setSelectedItems] = useState<{ product_id: string; quantity: number }[]>([]);
  const [catFilter, setCatFilter] = useState('all');

  const fetchCombos = async () => {
    try {
      const res = await fetch('/api/tenant/combos');
      if (res.ok) {
        const data = await res.json();
        setCombos(data.combos ?? []);
      }
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { fetchCombos(); }, []);

  const originalPrice = selectedItems.reduce((sum, item) => {
    const p = products.find(p => p.id === item.product_id);
    return sum + (p ? parseFloat(String(p.price)) * item.quantity : 0);
  }, 0);

  const savings = originalPrice - parseFloat(comboPrice || '0');
  const savingsPercent = originalPrice > 0 ? (savings / originalPrice * 100) : 0;

  const addProduct = (productId: string) => {
    const existing = selectedItems.find(i => i.product_id === productId);
    if (existing) {
      setSelectedItems(prev => prev.map(i => i.product_id === productId ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setSelectedItems(prev => [...prev, { product_id: productId, quantity: 1 }]);
    }
  };

  const removeProduct = (productId: string) => {
    setSelectedItems(prev => prev.filter(i => i.product_id !== productId));
  };

  const handleCreate = async () => {
    if (!name || !comboPrice || selectedItems.length < 2) return;
    setCreating(true);
    try {
      const res = await fetch('/api/tenant/combos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, combo_price: parseFloat(comboPrice), items: selectedItems }),
      });
      if (res.ok) {
        setShowForm(false);
        setName('');
        setDescription('');
        setComboPrice('');
        setSelectedItems([]);
        fetchCombos();
      }
    } catch { /* silent */ }
    setCreating(false);
  };

  const toggleActive = async (combo: Combo) => {
    await fetch('/api/tenant/combos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: combo.id, is_active: !combo.is_active }),
    });
    setCombos(prev => prev.map(c => c.id === combo.id ? { ...c, is_active: !c.is_active } : c));
  };

  const deleteCombo = async (id: string) => {
    if (!confirm('¿Eliminar este combo?')) return;
    await fetch(`/api/tenant/combos?id=${id}`, { method: 'DELETE' });
    setCombos(prev => prev.filter(c => c.id !== id));
  };

  const fmt = (n: number) => `$${n.toFixed(2)}`;

  const filteredProducts = catFilter === 'all' ? products : products.filter(p => p.category_id === catFilter);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 w-40 bg-gray-100 dark:bg-gray-800 rounded-xl" />
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-brand-600" />
            Combos del Menú
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{combos.length} combos creados</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors">
            <Plus className="w-4 h-4" /> Nuevo combo
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Crear combo</h3>
            <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Nombre *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Combo Familiar"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Precio del combo *</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="number" value={comboPrice} onChange={e => setComboPrice(e.target.value)} placeholder="19.99" min="0.01" step="0.01"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Descripción</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Incluye hamburguesa, papas y bebida"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
          </div>

          {/* Selected items */}
          {selectedItems.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Productos en el combo ({selectedItems.length})</p>
              {selectedItems.map(item => {
                const p = products.find(pp => pp.id === item.product_id);
                if (!p) return null;
                return (
                  <div key={item.product_id} className="flex items-center gap-2 bg-brand-50 dark:bg-brand-950/30 rounded-lg px-3 py-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white flex-1">{p.name}</span>
                    <span className="text-xs text-gray-500">x{item.quantity}</span>
                    <span className="text-xs font-semibold">{fmt(parseFloat(String(p.price)) * item.quantity)}</span>
                    <button onClick={() => removeProduct(item.product_id)} className="p-0.5 text-red-400 hover:text-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
              {originalPrice > 0 && comboPrice && (
                <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/30 rounded-xl px-3 py-2">
                  <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                    Original: {fmt(originalPrice)} → Combo: {fmt(parseFloat(comboPrice))}
                  </span>
                  <span className="text-xs font-bold text-emerald-600">
                    Ahorro: {savingsPercent.toFixed(0)}%
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Product picker */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Agregar productos</p>
              <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                className="text-[10px] px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800">
                <option value="all">Todas las categorías</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto">
              {filteredProducts.map(p => {
                const isSelected = selectedItems.some(i => i.product_id === p.id);
                return (
                  <button key={p.id} onClick={() => addProduct(p.id)}
                    className={cn(
                      'text-left px-3 py-2 rounded-lg border text-xs transition-all',
                      isSelected
                        ? 'border-brand-300 bg-brand-50 dark:bg-brand-950/30 dark:border-brand-700'
                        : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                    )}>
                    <span className="font-medium text-gray-900 dark:text-white block truncate">{p.name}</span>
                    <span className="text-gray-500">{fmt(parseFloat(String(p.price)))}</span>
                    {isSelected && <Check className="inline w-3 h-3 text-brand-600 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          <button onClick={handleCreate} disabled={creating || !name || !comboPrice || selectedItems.length < 2}
            className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors">
            {creating ? 'Creando...' : 'Crear combo'}
          </button>
        </div>
      )}

      {/* Combos list */}
      {combos.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sin combos</p>
          <p className="text-sm mt-1">Crea combos para ofrecer descuentos</p>
        </div>
      ) : (
        <div className="space-y-2">
          {combos.map(combo => {
            const discount = combo.original_price > 0
              ? ((combo.original_price - combo.combo_price) / combo.original_price * 100).toFixed(0)
              : '0';
            return (
              <div key={combo.id} className={cn(
                'bg-white dark:bg-gray-900 rounded-xl border px-4 py-3 transition-all',
                combo.is_active ? 'border-gray-100 dark:border-gray-800' : 'border-gray-100 dark:border-gray-800 opacity-50'
              )}>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center flex-shrink-0">
                    <Package className="w-6 h-6 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">{combo.name}</h4>
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">
                        -{discount}%
                      </span>
                    </div>
                    {combo.description && <p className="text-xs text-gray-500 mt-0.5">{combo.description}</p>}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-400 line-through">{fmt(parseFloat(String(combo.original_price)))}</span>
                      <span className="text-sm font-bold text-brand-600">{fmt(parseFloat(String(combo.combo_price)))}</span>
                      <span className="text-[10px] text-gray-400">
                        {combo.combo_items?.length ?? 0} productos
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleActive(combo)}
                      className={cn('p-1.5 rounded-lg transition-colors', combo.is_active ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950' : 'text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800')}>
                      {combo.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button onClick={() => deleteCombo(combo.id)}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
