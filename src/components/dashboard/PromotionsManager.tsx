'use client';

import { useState, useEffect } from 'react';
import {
  Plus, X, Trash2, Percent, Tag, Eye, EyeOff, Copy, Check,
  Calendar, Hash, DollarSign,
} from 'lucide-react';
import { formatPrice, cn } from '@/lib/utils';

interface Promotion {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export function PromotionsManager() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [form, setForm] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    min_order_amount: '',
    max_uses: '',
    expires_at: '',
  });

  const fetchPromos = async () => {
    try {
      const res = await fetch('/api/tenant/promotions');
      if (res.ok) {
        const data = await res.json();
        setPromotions(data.promotions ?? []);
      }
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { fetchPromos(); }, []);

  const resetForm = () => {
    setForm({ code: '', description: '', discount_type: 'percentage', discount_value: '', min_order_amount: '', max_uses: '', expires_at: '' });
    setShowForm(false);
    setError('');
  };

  const handleCreate = async () => {
    if (!form.code.trim()) { setError('Código requerido'); return; }
    if (!form.discount_value || parseFloat(form.discount_value) <= 0) { setError('Valor de descuento requerido'); return; }

    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/tenant/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code,
          description: form.description,
          discount_type: form.discount_type,
          discount_value: parseFloat(form.discount_value),
          min_order_amount: form.min_order_amount ? parseFloat(form.min_order_amount) : 0,
          max_uses: form.max_uses ? parseInt(form.max_uses) : null,
          expires_at: form.expires_at || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPromotions(prev => [data.promotion, ...prev]);
      resetForm();
    } catch (err: any) {
      setError(err.message);
    }
    setSaving(false);
  };

  const handleToggle = async (promo: Promotion) => {
    await fetch('/api/tenant/promotions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: promo.id, is_active: !promo.is_active }),
    });
    setPromotions(prev => prev.map(p => p.id === promo.id ? { ...p, is_active: !p.is_active } : p));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta promoción?')) return;
    await fetch(`/api/tenant/promotions?id=${id}`, { method: 'DELETE' });
    setPromotions(prev => prev.filter(p => p.id !== id));
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 w-44 bg-gray-200 rounded-xl" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-white rounded-xl border border-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Add button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Nueva promoción
        </button>
      )}

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Crear promoción</h3>
            <button onClick={resetForm} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
              <X className="w-4 h-4" />
            </button>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Código *</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="BIENVENIDO20"
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Descripción</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="20% de descuento de bienvenida"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tipo</label>
              <select
                value={form.discount_type}
                onChange={(e) => setForm(prev => ({ ...prev, discount_type: e.target.value as any }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              >
                <option value="percentage">Porcentaje %</option>
                <option value="fixed">Monto fijo $</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Valor *</label>
              <input
                type="number"
                value={form.discount_value}
                onChange={(e) => setForm(prev => ({ ...prev, discount_value: e.target.value }))}
                placeholder={form.discount_type === 'percentage' ? '20' : '50'}
                min="0"
                step="0.01"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Pedido mín.</label>
              <input
                type="number"
                value={form.min_order_amount}
                onChange={(e) => setForm(prev => ({ ...prev, min_order_amount: e.target.value }))}
                placeholder="0"
                min="0"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Usos máx.</label>
              <input
                type="number"
                value={form.max_uses}
                onChange={(e) => setForm(prev => ({ ...prev, max_uses: e.target.value }))}
                placeholder="Ilimitado"
                min="1"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
          </div>

          <div className="sm:w-1/2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Expira</label>
            <input
              type="date"
              value={form.expires_at}
              onChange={(e) => setForm(prev => ({ ...prev, expires_at: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleCreate}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Creando...' : 'Crear promoción'}
            </button>
            <button onClick={resetForm} className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Promotions list */}
      {promotions.length === 0 && !showForm ? (
        <div className="text-center py-16 text-gray-400">
          <Percent className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sin promociones</p>
          <p className="text-sm mt-1 text-gray-300">Crea códigos de descuento para atraer más clientes</p>
        </div>
      ) : (
        <div className="space-y-2">
          {promotions.map(promo => {
            const isExpired = promo.expires_at && new Date(promo.expires_at) < new Date();
            const isMaxedOut = promo.max_uses && promo.current_uses >= promo.max_uses;

            return (
              <div
                key={promo.id}
                className={cn(
                  'bg-white rounded-xl border px-4 py-3.5 transition-all',
                  promo.is_active && !isExpired && !isMaxedOut ? 'border-gray-100' : 'border-gray-100 opacity-60'
                )}
              >
                <div className="flex items-center gap-3">
                  {/* Code badge */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyCode(promo.code, promo.id)}
                      className="font-mono font-bold text-sm bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1.5"
                    >
                      {copiedId === promo.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-gray-400" />}
                      {promo.code}
                    </button>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    {promo.description && (
                      <p className="text-sm text-gray-600 truncate">{promo.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600">
                        {promo.discount_type === 'percentage' ? (
                          <><Percent className="w-3 h-3" />{promo.discount_value}%</>
                        ) : (
                          <><DollarSign className="w-3 h-3" />{formatPrice(promo.discount_value)}</>
                        )}
                      </span>
                      {promo.min_order_amount > 0 && (
                        <span className="text-[10px] text-gray-400">Min. {formatPrice(promo.min_order_amount)}</span>
                      )}
                      {promo.max_uses && (
                        <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                          <Hash className="w-2.5 h-2.5" />{promo.current_uses}/{promo.max_uses} usos
                        </span>
                      )}
                      {promo.expires_at && (
                        <span className={cn(
                          'text-[10px] flex items-center gap-0.5',
                          isExpired ? 'text-red-500' : 'text-gray-400'
                        )}>
                          <Calendar className="w-2.5 h-2.5" />
                          {isExpired ? 'Expirado' : `Hasta ${new Date(promo.expires_at).toLocaleDateString('es-MX')}`}
                        </span>
                      )}
                      {isMaxedOut && (
                        <span className="text-[10px] text-red-500 font-medium">Agotado</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleToggle(promo)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                    >
                      {promo.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(promo.id)}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
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
