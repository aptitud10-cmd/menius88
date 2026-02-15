'use client';

import {
  DollarSign, TrendingUp, Users, Star,
  ShoppingBag, Activity,
} from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';

interface Props {
  recentOrders: Array<{ total: number; created_at: string; status: string; restaurant_id: string }>;
  planData: Array<{ subscription_plan: string }>;
  recentUsers: Array<{ created_at: string }>;
  totalReviews: number;
}

export function AdminMetrics({ recentOrders, planData, recentUsers, totalReviews }: Props) {
  // Revenue
  const totalRevenue = recentOrders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + Number(o.total), 0);

  const completedOrders = recentOrders.filter(o => o.status === 'delivered').length;
  const activeRestaurants = new Set(recentOrders.map(o => o.restaurant_id)).size;

  // Plan distribution
  const planCounts: Record<string, number> = {};
  planData.forEach(r => {
    const plan = r.subscription_plan ?? 'trial';
    planCounts[plan] = (planCounts[plan] ?? 0) + 1;
  });

  // Daily signups (last 7 days)
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });

  const dailySignups = last7.map(day => ({
    day,
    count: recentUsers.filter(u => u.created_at.startsWith(day)).length,
  }));

  // Daily revenue (last 7 days)
  const dailyRevenue = last7.map(day => ({
    day,
    revenue: recentOrders
      .filter(o => o.created_at.startsWith(day) && o.status !== 'cancelled')
      .reduce((s, o) => s + Number(o.total), 0),
  }));

  const maxRevenue = Math.max(...dailyRevenue.map(d => d.revenue), 1);
  const maxSignups = Math.max(...dailySignups.map(d => d.count), 1);

  const PLAN_COLORS: Record<string, string> = {
    trial: 'bg-amber-500',
    basic: 'bg-gray-400',
    pro: 'bg-blue-500',
    premium: 'bg-violet-500',
    enterprise: 'bg-emerald-500',
    cancelled: 'bg-red-500',
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">Métricas Globales</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Revenue (30d)', value: formatPrice(totalRevenue), icon: DollarSign, color: 'text-emerald-500' },
          { label: 'Órdenes completadas', value: completedOrders, icon: ShoppingBag, color: 'text-blue-500' },
          { label: 'Restaurantes activos', value: activeRestaurants, icon: Activity, color: 'text-violet-500' },
          { label: 'Nuevos usuarios (30d)', value: recentUsers.length, icon: Users, color: 'text-amber-500' },
        ].map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={cn('w-4 h-4', kpi.color)} />
                <span className="text-xs text-gray-500">{kpi.label}</span>
              </div>
              <p className="text-2xl font-bold text-white">{kpi.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue chart */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Revenue diario (7d)</h3>
          <div className="flex items-end gap-2 h-32">
            {dailyRevenue.map((d, i) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] text-gray-600">{formatPrice(d.revenue)}</span>
                <div
                  className="w-full bg-emerald-500/80 rounded-t-lg transition-all"
                  style={{ height: `${Math.max(4, (d.revenue / maxRevenue) * 100)}%` }}
                />
                <span className="text-[9px] text-gray-600">
                  {new Date(d.day).toLocaleDateString('es-MX', { weekday: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Signups chart */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Nuevos registros (7d)</h3>
          <div className="flex items-end gap-2 h-32">
            {dailySignups.map((d, i) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] text-gray-600">{d.count}</span>
                <div
                  className="w-full bg-blue-500/80 rounded-t-lg transition-all"
                  style={{ height: `${Math.max(4, (d.count / maxSignups) * 100)}%` }}
                />
                <span className="text-[9px] text-gray-600">
                  {new Date(d.day).toLocaleDateString('es-MX', { weekday: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Plan distribution */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Distribución de planes</h3>
        <div className="space-y-2.5">
          {Object.entries(planCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([plan, count]) => {
              const pct = planData.length > 0 ? (count / planData.length) * 100 : 0;
              return (
                <div key={plan} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-20 capitalize">{plan}</span>
                  <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', PLAN_COLORS[plan] ?? 'bg-gray-500')}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-12 text-right">{count} ({Math.round(pct)}%)</span>
                </div>
              );
            })}
        </div>
      </div>

      {/* More stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4 text-center">
          <Star className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-white">{totalReviews}</p>
          <p className="text-xs text-gray-500">Reseñas totales</p>
        </div>
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4 text-center">
          <TrendingUp className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-white">
            {recentOrders.length > 0 ? formatPrice(totalRevenue / Math.max(1, completedOrders)) : '$0'}
          </p>
          <p className="text-xs text-gray-500">Ticket promedio</p>
        </div>
      </div>
    </div>
  );
}
