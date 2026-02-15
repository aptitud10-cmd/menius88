'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, RefreshCw,
  Star, Percent, Clock, Heart, ArrowUpRight,
} from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';

interface AnalyticsData {
  kpis: {
    revenue: number;
    prevRevenue: number;
    revenueChange: number;
    totalOrders: number;
    prevOrders: number;
    avgTicket: number;
    tips: number;
    cancelRate: number;
    uniqueCustomers: number;
    returningCustomers: number;
    retentionRate: number;
    avgRating: number;
    totalReviews: number;
  };
  charts: {
    daily: Array<{ date: string; revenue: number; orders: number }>;
    hourly: Array<{ hour: number; orders: number }>;
    orderTypes: Record<string, number>;
    topProducts: Array<{ name: string; qty: number; revenue: number }>;
  };
}

export function AdvancedAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/tenant/analytics?days=${days}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [days]);

  if (loading || !data) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-4 gap-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}</div>
        <div className="h-48 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  const k = data.kpis;
  const maxDailyRevenue = Math.max(...data.charts.daily.map(d => d.revenue), 1);
  const maxHourly = Math.max(...data.charts.hourly.map(h => h.orders), 1);
  const orderTypeLabels: Record<string, string> = { dine_in: '🍽️ En mesa', pickup: '🥡 Llevar', delivery: '🛵 Delivery' };
  const totalOrderTypes = Object.values(data.charts.orderTypes).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="space-y-5">
      {/* Period selector */}
      <div className="flex gap-1.5">
        {[7, 14, 30, 60, 90].map(d => (
          <button key={d} onClick={() => setDays(d)}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              days === d ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {d}d
          </button>
        ))}
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Revenue', value: formatPrice(k.revenue), icon: DollarSign,
            change: k.revenueChange, color: 'text-emerald-500', bg: 'bg-emerald-50',
          },
          {
            label: 'Pedidos', value: k.totalOrders, icon: ShoppingBag,
            change: k.prevOrders > 0 ? ((k.totalOrders - k.prevOrders) / k.prevOrders) * 100 : 0,
            color: 'text-blue-500', bg: 'bg-blue-50',
          },
          {
            label: 'Ticket promedio', value: formatPrice(k.avgTicket), icon: TrendingUp,
            color: 'text-violet-500', bg: 'bg-violet-50',
          },
          {
            label: 'Propinas', value: formatPrice(k.tips), icon: Heart,
            color: 'text-pink-500', bg: 'bg-pink-50',
          },
        ].map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', kpi.bg)}>
                  <Icon className={cn('w-4 h-4', kpi.color)} />
                </div>
                {kpi.change !== undefined && kpi.change !== 0 && (
                  <span className={cn('text-[10px] font-semibold flex items-center gap-0.5 px-1.5 py-0.5 rounded-full',
                    kpi.change > 0 ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
                  )}>
                    {kpi.change > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                    {Math.abs(kpi.change).toFixed(1)}%
                  </span>
                )}
              </div>
              <p className="text-xl font-bold text-gray-900">{kpi.value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      {/* Customer metrics row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Clientes únicos', value: k.uniqueCustomers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Recurrentes', value: k.returningCustomers, icon: RefreshCw, color: 'text-violet-500', bg: 'bg-violet-50' },
          { label: 'Retención', value: `${k.retentionRate.toFixed(1)}%`, icon: Percent, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Rating', value: k.avgRating > 0 ? `${k.avgRating} ⭐ (${k.totalReviews})` : 'Sin reseñas', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
        ].map(m => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="bg-white rounded-2xl border border-gray-100 p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center', m.bg)}>
                  <Icon className={cn('w-3 h-3', m.color)} />
                </div>
                <span className="text-[10px] text-gray-400 font-medium">{m.label}</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{m.value}</p>
            </div>
          );
        })}
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Revenue diario</h3>
        <div className="flex items-end gap-[2px] h-32">
          {data.charts.daily.map((d, i) => (
            <div key={i} className="flex-1 group relative">
              <div
                className="w-full rounded-t bg-brand-500 group-hover:bg-brand-600 transition-colors"
                style={{ height: `${(d.revenue / maxDailyRevenue) * 100}%`, minHeight: d.revenue > 0 ? '2px' : '0' }}
              />
              <div className="hidden group-hover:block absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] px-2 py-1 rounded whitespace-nowrap z-10">
                {d.date.slice(5)} · {formatPrice(d.revenue)} · {d.orders} pedidos
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Peak hours */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" /> Horas pico
          </h3>
          <div className="flex items-end gap-1 h-24">
            {data.charts.hourly.filter(h => h.hour >= 7 && h.hour <= 23).map(h => (
              <div key={h.hour} className="flex-1 group relative">
                <div
                  className="w-full rounded-t bg-violet-400 group-hover:bg-violet-500 transition-colors"
                  style={{ height: `${(h.orders / maxHourly) * 100}%`, minHeight: h.orders > 0 ? '2px' : '0' }}
                />
                <div className="hidden group-hover:block absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] px-2 py-1 rounded whitespace-nowrap z-10">
                  {h.hour}:00 · {h.orders}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1 text-[9px] text-gray-400">
            <span>7am</span><span>12pm</span><span>6pm</span><span>11pm</span>
          </div>
        </div>

        {/* Order type distribution */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Tipos de pedido</h3>
          <div className="space-y-2.5">
            {Object.entries(data.charts.orderTypes).map(([type, count]) => {
              const pct = (count / totalOrderTypes) * 100;
              return (
                <div key={type}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">{orderTypeLabels[type] ?? type}</span>
                    <span className="text-xs text-gray-400">{count} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {Object.keys(data.charts.orderTypes).length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">Sin datos</p>
            )}
          </div>
        </div>
      </div>

      {/* Top products */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Top 10 productos</h3>
        {data.charts.topProducts.length > 0 ? (
          <div className="space-y-2">
            {data.charts.topProducts.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className={cn(
                  'w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0',
                  i < 3 ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-400'
                )}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                  <p className="text-[10px] text-gray-400">{p.qty} vendidos</p>
                </div>
                <span className="text-sm font-bold text-gray-900 flex-shrink-0">{formatPrice(p.revenue)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 text-center py-4">Sin datos de ventas</p>
        )}
      </div>
    </div>
  );
}
