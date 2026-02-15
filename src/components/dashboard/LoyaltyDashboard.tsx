'use client';

import { useState, useEffect } from 'react';
import {
  Heart, Gift, Users, DollarSign, Settings, Save, Check,
  Star, TrendingUp, Phone, Award,
} from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';

interface LoyaltyCustomer {
  id: string;
  phone: string;
  name: string;
  total_points: number;
  total_spent: number;
  total_orders: number;
  created_at: string;
}

interface LoyaltyConfig {
  enabled: boolean;
  pointsPerDollar: number;
  redeemThreshold: number;
  redeemValue: number;
}

export function LoyaltyDashboard() {
  const [customers, setCustomers] = useState<LoyaltyCustomer[]>([]);
  const [config, setConfig] = useState<LoyaltyConfig>({ enabled: false, pointsPerDollar: 10, redeemThreshold: 100, redeemValue: 5 });
  const [stats, setStats] = useState({ total: 0, totalPoints: 0, totalSpent: 0 });
  const [loading, setLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/tenant/loyalty')
      .then(r => r.json())
      .then(d => {
        setCustomers(d.customers ?? []);
        setConfig(d.config ?? { enabled: false, pointsPerDollar: 10, redeemThreshold: 100, redeemValue: 5 });
        setStats(d.stats ?? { total: 0, totalPoints: 0, totalSpent: 0 });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSaveConfig = async () => {
    setSaving(true);
    await fetch('/api/tenant/loyalty', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setSaving(false);
  };

  const handleAddPoints = async (customerId: string, points: number) => {
    await fetch('/api/tenant/loyalty', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: customerId, points }),
    });
    setCustomers(prev => prev.map(c =>
      c.id === customerId ? { ...c, total_points: c.total_points + points } : c
    ));
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}
        </div>
        {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-white rounded-xl border border-gray-100" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toggle + config */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center">
              <Heart className="w-5 h-5 text-pink-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Programa de Lealtad</h3>
              <p className="text-xs text-gray-400">Recompensa a tus clientes frecuentes</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setConfig(prev => ({ ...prev, enabled: !prev.enabled })); }}
              className={cn(
                'w-11 h-6 rounded-full transition-colors relative',
                config.enabled ? 'bg-pink-500' : 'bg-gray-200'
              )}
            >
              <div className={cn(
                'w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm',
                config.enabled ? 'left-[22px]' : 'left-0.5'
              )} />
            </button>
          </div>
        </div>

        {showConfig && (
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Puntos por $1</label>
                <input
                  type="number"
                  value={config.pointsPerDollar}
                  onChange={(e) => setConfig(prev => ({ ...prev, pointsPerDollar: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Puntos para canjear</label>
                <input
                  type="number"
                  value={config.redeemThreshold}
                  onChange={(e) => setConfig(prev => ({ ...prev, redeemThreshold: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Valor del canje ($)</label>
                <input
                  type="number"
                  value={config.redeemValue}
                  onChange={(e) => setConfig(prev => ({ ...prev, redeemValue: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400">
              Ejemplo: Cliente gasta $100 → gana {config.pointsPerDollar * 100} puntos → al llegar a {config.redeemThreshold} puntos canjea ${config.redeemValue} de descuento
            </p>
            <button
              onClick={handleSaveConfig}
              disabled={saving}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium transition-all',
                saved ? 'bg-emerald-600' : 'bg-pink-500 hover:bg-pink-600 disabled:opacity-50'
              )}
            >
              {saved ? <><Check className="w-3.5 h-3.5" /> Guardado</> : <><Save className="w-3.5 h-3.5" /> {saving ? 'Guardando...' : 'Guardar'}</>}
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Clientes', value: stats.total, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Puntos activos', value: stats.totalPoints.toLocaleString(), icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Revenue generado', value: formatPrice(stats.totalSpent), icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', s.bg)}>
                  <Icon className={cn('w-4 h-4', s.color)} />
                </div>
                <span className="text-xs text-gray-400 font-medium">{s.label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Customers list */}
      {customers.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Clientes frecuentes</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {customers.map((customer, idx) => (
              <div key={customer.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center flex-shrink-0">
                  {idx < 3 ? (
                    <Award className={cn('w-4 h-4', idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-gray-400' : 'text-amber-700')} />
                  ) : (
                    <span className="text-xs font-bold text-gray-400">{idx + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{customer.name || 'Sin nombre'}</p>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400">
                    <span className="flex items-center gap-0.5"><Phone className="w-2.5 h-2.5" />{customer.phone}</span>
                    <span>{customer.total_orders} pedidos</span>
                    <span>{formatPrice(customer.total_spent)}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-pink-600">{customer.total_points} pts</p>
                  {customer.total_points >= config.redeemThreshold && (
                    <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                      🎁 Puede canjear
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleAddPoints(customer.id, 50)}
                  className="flex-shrink-0 px-2 py-1 rounded-lg bg-pink-50 text-pink-600 text-xs font-medium hover:bg-pink-100 transition-colors"
                  title="Dar 50 puntos bonus"
                >
                  <Gift className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <Heart className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sin clientes registrados</p>
          <p className="text-sm text-gray-300 mt-1">Los clientes se registran automaticamente al hacer pedidos con su teléfono</p>
        </div>
      )}
    </div>
  );
}
