'use client';

import Link from 'next/link';
import {
  DollarSign, ShoppingBag, Clock, TrendingUp,
  ArrowRight, Package, Tag, ChefHat,
  ExternalLink, BarChart3, Users,
} from 'lucide-react';
import { formatPrice, timeAgo, ORDER_STATUS_CONFIG } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface DashboardOverviewProps {
  restaurantName: string;
  restaurantSlug: string;
  todayRevenue: number;
  weekRevenue: number;
  todayOrderCount: number;
  weekOrderCount: number;
  activeOrders: number;
  avgOrderValue: number;
  dailyRevenue: { day: string; revenue: number; orders: number }[];
  recentOrders: Array<{
    id: string;
    order_number: string;
    status: string;
    total: number;
    customer_name: string;
    created_at: string;
    order_items?: Array<{ qty: number; product?: { name: string } }>;
  }>;
  productCount: number;
  activeProductCount: number;
  categoryCount: number;
}

export function DashboardOverview({
  restaurantName,
  restaurantSlug,
  todayRevenue,
  weekRevenue,
  todayOrderCount,
  weekOrderCount,
  activeOrders,
  avgOrderValue,
  dailyRevenue,
  recentOrders,
  productCount,
  activeProductCount,
  categoryCount,
}: DashboardOverviewProps) {
  const maxRevenue = Math.max(...dailyRevenue.map(d => d.revenue), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Resumen de {restaurantName}</p>
        </div>
        <a
          href={`/r/${restaurantSlug}`}
          target="_blank"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Ver menú
        </a>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Venta de hoy"
          value={formatPrice(todayRevenue)}
          sublabel={`${todayOrderCount} orden${todayOrderCount === 1 ? '' : 'es'}`}
          icon={DollarSign}
          color="emerald"
        />
        <StatCard
          label="Órdenes activas"
          value={String(activeOrders)}
          sublabel="Pendientes ahora"
          icon={Clock}
          color="amber"
          pulse={activeOrders > 0}
        />
        <StatCard
          label="Ticket promedio"
          value={formatPrice(avgOrderValue)}
          sublabel="Hoy"
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          label="Esta semana"
          value={formatPrice(weekRevenue)}
          sublabel={`${weekOrderCount} órdenes`}
          icon={BarChart3}
          color="violet"
        />
      </div>

      {/* Chart + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Ventas últimos 7 días</h3>
            <Link href="/app/analytics" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
              Ver analytics →
            </Link>
          </div>
          <div className="flex items-end gap-2 h-32">
            {dailyRevenue.map((d, i) => {
              const height = maxRevenue > 0 ? (d.revenue / maxRevenue) * 100 : 0;
              const isToday = i === dailyRevenue.length - 1;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-400 font-medium">
                    {d.revenue > 0 ? formatPrice(d.revenue).replace('MX$', '$') : ''}
                  </span>
                  <div
                    className={cn(
                      'w-full rounded-t-lg transition-all',
                      isToday ? 'bg-brand-500' : 'bg-gray-200',
                      d.revenue === 0 && 'min-h-[4px]'
                    )}
                    style={{ height: `${Math.max(height, 4)}%` }}
                  />
                  <span className={cn(
                    'text-[10px] font-medium',
                    isToday ? 'text-brand-600' : 'text-gray-400'
                  )}>
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Acciones rápidas</h3>
          <div className="space-y-2">
            <QuickAction
              href="/app/orders"
              icon={ShoppingBag}
              label="Ver órdenes"
              badge={activeOrders > 0 ? String(activeOrders) : undefined}
            />
            <QuickAction href="/app/menu/products" icon={ChefHat} label="Gestionar menú" />
            <QuickAction href="/app/menu/categories" icon={Tag} label="Categorías" />
            <QuickAction href="/app/tables" icon={Package} label="Mesas & QR" />
            <QuickAction href="/app/settings" icon={Users} label="Configuración" />
          </div>

          {/* Menu stats */}
          <div className="pt-3 border-t border-gray-100 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Productos</span>
              <span className="font-semibold text-gray-700">{activeProductCount}/{productCount}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Categorías</span>
              <span className="font-semibold text-gray-700">{categoryCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Órdenes recientes</h3>
          <Link href="/app/orders" className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
            Ver todas <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">Sin órdenes aún</p>
            <p className="text-xs mt-1">Comparte tu menú para empezar a recibir pedidos</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentOrders.slice(0, 8).map(order => {
              const statusConfig = ORDER_STATUS_CONFIG[order.status] ?? ORDER_STATUS_CONFIG.pending;
              const items = order.order_items ?? [];
              return (
                <div key={order.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-gray-700">{order.order_number}</span>
                      <span className={cn(
                        'text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                        statusConfig.bg, statusConfig.color
                      )}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {order.customer_name && (
                        <span className="text-xs text-gray-500">{order.customer_name}</span>
                      )}
                      {items.length > 0 && (
                        <span className="text-xs text-gray-400">
                          · {items.map(i => `${i.qty}x ${i.product?.name ?? '?'}`).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">{formatPrice(Number(order.total))}</p>
                    <p className="text-[10px] text-gray-400">{timeAgo(order.created_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Sub-components ----

function StatCard({ label, value, sublabel, icon: Icon, color, pulse }: {
  label: string;
  value: string;
  sublabel: string;
  icon: typeof DollarSign;
  color: 'emerald' | 'amber' | 'blue' | 'violet';
  pulse?: boolean;
}) {
  const colors = {
    emerald: { bg: 'bg-emerald-50', icon: 'bg-emerald-100 text-emerald-600', border: 'border-emerald-100' },
    amber: { bg: 'bg-amber-50', icon: 'bg-amber-100 text-amber-600', border: 'border-amber-100' },
    blue: { bg: 'bg-blue-50', icon: 'bg-blue-100 text-blue-600', border: 'border-blue-100' },
    violet: { bg: 'bg-violet-50', icon: 'bg-violet-100 text-violet-600', border: 'border-violet-100' },
  };
  const c = colors[color];

  return (
    <div className={cn('rounded-2xl border p-4', c.bg, c.border)}>
      <div className="flex items-center gap-2 mb-2">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', c.icon)}>
          <Icon className="w-4 h-4" />
        </div>
        {pulse && (
          <span className="relative flex h-2 w-2 ml-auto">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{sublabel}</p>
    </div>
  );
}

function QuickAction({ href, icon: Icon, label, badge }: {
  href: string;
  icon: typeof ShoppingBag;
  label: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors group"
    >
      <Icon className="w-4 h-4 text-gray-400 group-hover:text-brand-600 transition-colors" />
      <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 flex-1">{label}</span>
      {badge && (
        <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
          {badge}
        </span>
      )}
      <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-400 transition-colors" />
    </Link>
  );
}
