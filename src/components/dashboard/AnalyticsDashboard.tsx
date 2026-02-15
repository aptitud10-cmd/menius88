'use client';

import { useState, useMemo } from 'react';
import { formatPrice, cn } from '@/lib/utils';
import {
  TrendingUp, TrendingDown, DollarSign,
  ShoppingBag, BarChart3, Clock, Star,
} from 'lucide-react';

interface AnalyticsProps {
  orders: Array<{
    id: string;
    total: number;
    status: string;
    created_at: string;
    order_items?: Array<{
      qty: number;
      unit_price: number;
      product?: { name: string; category_id: string };
    }>;
  }>;
  products: Array<{
    id: string;
    name: string;
    price: number;
    is_active: boolean;
    category_id: string;
  }>;
  categories: Array<{ id: string; name: string }>;
}

type Period = '7d' | '14d' | '30d';

export function AnalyticsDashboard({ orders, products, categories }: AnalyticsProps) {
  const [period, setPeriod] = useState<Period>('7d');

  const periodDays = { '7d': 7, '14d': 14, '30d': 30 };
  const days = periodDays[period];

  const filteredOrders = useMemo(() => {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return orders.filter(o => new Date(o.created_at) >= cutoff && o.status !== 'cancelled');
  }, [orders, days]);

  const prevOrders = useMemo(() => {
    const start = new Date(Date.now() - 2 * days * 24 * 60 * 60 * 1000);
    const end = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= start && d < end && o.status !== 'cancelled';
    });
  }, [orders, days]);

  // KPIs
  const totalRevenue = filteredOrders.reduce((s, o) => s + Number(o.total), 0);
  const prevRevenue = prevOrders.reduce((s, o) => s + Number(o.total), 0);
  const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

  const orderCount = filteredOrders.length;
  const prevOrderCount = prevOrders.length;
  const orderChange = prevOrderCount > 0 ? ((orderCount - prevOrderCount) / prevOrderCount) * 100 : 0;

  const avgTicket = orderCount > 0 ? totalRevenue / orderCount : 0;
  const prevAvgTicket = prevOrderCount > 0 ? prevRevenue / prevOrderCount : 0;
  const ticketChange = prevAvgTicket > 0 ? ((avgTicket - prevAvgTicket) / prevAvgTicket) * 100 : 0;

  // Daily chart data
  const dailyData = useMemo(() => {
    const data: { date: string; label: string; revenue: number; orders: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayOrders = filteredOrders.filter(o =>
        new Date(o.created_at).toISOString().split('T')[0] === dateStr
      );
      data.push({
        date: dateStr,
        label: date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }),
        revenue: dayOrders.reduce((s, o) => s + Number(o.total), 0),
        orders: dayOrders.length,
      });
    }
    return data;
  }, [filteredOrders, days]);

  const maxDailyRevenue = Math.max(...dailyData.map(d => d.revenue), 1);

  // Top products
  const topProducts = useMemo(() => {
    const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
    for (const order of filteredOrders) {
      for (const item of order.order_items ?? []) {
        const name = item.product?.name ?? 'Desconocido';
        if (!productSales[name]) productSales[name] = { name, qty: 0, revenue: 0 };
        productSales[name].qty += item.qty;
        productSales[name].revenue += item.qty * Number(item.unit_price);
      }
    }
    return Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }, [filteredOrders]);

  // Orders by hour
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, orders: 0 }));
    for (const order of filteredOrders) {
      const h = new Date(order.created_at).getHours();
      hours[h].orders++;
    }
    return hours;
  }, [filteredOrders]);

  const maxHourlyOrders = Math.max(...hourlyData.map(h => h.orders), 1);

  // Status distribution
  const statusDist = useMemo(() => {
    const dist: Record<string, number> = {};
    for (const o of filteredOrders) {
      dist[o.status] = (dist[o.status] || 0) + 1;
    }
    return dist;
  }, [filteredOrders]);

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-200 p-1 w-fit">
        {(['7d', '14d', '30d'] as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              period === p ? 'bg-brand-600 text-white' : 'text-gray-500 hover:bg-gray-50'
            )}
          >
            {p === '7d' ? '7 días' : p === '14d' ? '14 días' : '30 días'}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KPICard
          label="Ingresos"
          value={formatPrice(totalRevenue)}
          change={revenueChange}
          icon={DollarSign}
        />
        <KPICard
          label="Órdenes"
          value={String(orderCount)}
          change={orderChange}
          icon={ShoppingBag}
        />
        <KPICard
          label="Ticket promedio"
          value={formatPrice(avgTicket)}
          change={ticketChange}
          icon={BarChart3}
        />
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Ingresos por día</h3>
        <div className="flex items-end gap-1 h-40">
          {dailyData.map((d, i) => {
            const height = (d.revenue / maxDailyRevenue) * 100;
            const isToday = i === dailyData.length - 1;
            const showLabel = days <= 14 || i % Math.ceil(days / 10) === 0 || isToday;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="relative w-full">
                  <div
                    className={cn(
                      'w-full rounded-t transition-all group-hover:opacity-80',
                      isToday ? 'bg-brand-500' : 'bg-brand-200',
                      d.revenue === 0 && 'min-h-[2px] bg-gray-100'
                    )}
                    style={{ height: `${Math.max(height, 2)}%` }}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-gray-800 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap">
                      {formatPrice(d.revenue)} · {d.orders} ord.
                    </div>
                  </div>
                </div>
                {showLabel && (
                  <span className={cn(
                    'text-[9px] font-medium truncate max-w-full',
                    isToday ? 'text-brand-600' : 'text-gray-400'
                  )}>
                    {d.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top products */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            Productos más vendidos
          </h3>
          {topProducts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sin datos aún</p>
          ) : (
            <div className="space-y-2.5">
              {topProducts.map((p, i) => {
                const maxQty = topProducts[0]?.qty ?? 1;
                return (
                  <div key={p.name} className="flex items-center gap-3">
                    <span className="w-5 text-xs font-bold text-gray-400 text-right">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-medium text-gray-700 truncate">{p.name}</span>
                        <span className="text-xs font-semibold text-gray-900 ml-2">{formatPrice(p.revenue)}</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-500 rounded-full transition-all"
                          style={{ width: `${(p.qty / maxQty) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400">{p.qty} vendidos</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Peak hours */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            Horas pico
          </h3>
          <div className="flex items-end gap-0.5 h-32">
            {hourlyData.filter((_, i) => i >= 8 && i <= 23).map(h => {
              const height = (h.orders / maxHourlyOrders) * 100;
              const isPeak = h.orders === maxHourlyOrders && h.orders > 0;
              return (
                <div key={h.hour} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="relative w-full">
                    <div
                      className={cn(
                        'w-full rounded-t transition-all',
                        isPeak ? 'bg-blue-500' : h.orders > 0 ? 'bg-blue-200' : 'bg-gray-100',
                        'min-h-[2px]'
                      )}
                      style={{ height: `${Math.max(height, 2)}%` }}
                    />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="bg-gray-800 text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap">
                        {h.orders} ord.
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px] text-gray-400">{h.hour}h</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ label, value, change, icon: Icon }: {
  label: string;
  value: string;
  change: number;
  icon: typeof DollarSign;
}) {
  const isPositive = change >= 0;
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
          <Icon className="w-4 h-4 text-gray-400" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {change !== 0 && (
        <div className={cn(
          'flex items-center gap-1 mt-1 text-xs font-medium',
          isPositive ? 'text-emerald-600' : 'text-red-500'
        )}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {isPositive ? '+' : ''}{change.toFixed(1)}% vs periodo anterior
        </div>
      )}
    </div>
  );
}
