'use client';

import { useState } from 'react';
import {
  Store, Users, ShoppingBag, ClipboardList, Search,
  ExternalLink, Crown, Zap, Star, Shield, AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RestaurantRow {
  id: string;
  name: string;
  slug: string;
  subscription_plan: string;
  is_active: boolean;
  created_at: string;
  trial_ends_at: string | null;
  owner?: { full_name: string; user_id: string } | null;
}

interface Props {
  restaurants: RestaurantRow[];
  stats: {
    totalRestaurants: number;
    totalOrders: number;
    totalProducts: number;
    totalUsers: number;
  };
}

const PLAN_BADGES: Record<string, { bg: string; text: string; icon: typeof Zap }> = {
  trial: { bg: 'bg-amber-50', text: 'text-amber-700', icon: Star },
  basic: { bg: 'bg-gray-100', text: 'text-gray-600', icon: Zap },
  pro: { bg: 'bg-blue-50', text: 'text-blue-700', icon: Star },
  premium: { bg: 'bg-violet-50', text: 'text-violet-700', icon: Crown },
  enterprise: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: Shield },
  cancelled: { bg: 'bg-red-50', text: 'text-red-600', icon: AlertCircle },
};

export function AdminRestaurants({ restaurants, stats }: Props) {
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');

  const filtered = restaurants.filter(r => {
    const matchesSearch = !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.slug.toLowerCase().includes(search.toLowerCase()) ||
      r.owner?.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchesPlan = planFilter === 'all' || r.subscription_plan === planFilter;
    return matchesSearch && matchesPlan;
  });

  return (
    <div className="space-y-6">
      {/* Global stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Restaurantes', value: stats.totalRestaurants, icon: Store, color: 'text-brand-500' },
          { label: 'Usuarios', value: stats.totalUsers, icon: Users, color: 'text-blue-500' },
          { label: 'Productos', value: stats.totalProducts, icon: ShoppingBag, color: 'text-emerald-500' },
          { label: 'Órdenes', value: stats.totalOrders, icon: ClipboardList, color: 'text-violet-500' },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={cn('w-4 h-4', stat.color)} />
                <span className="text-xs text-gray-500 font-medium">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value.toLocaleString()}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar restaurante, slug, propietario..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-gray-700"
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        >
          <option value="all">Todos los planes</option>
          <option value="trial">Trial</option>
          <option value="basic">Básico</option>
          <option value="pro">Profesional</option>
          <option value="premium">Premium</option>
          <option value="enterprise">Enterprise</option>
          <option value="cancelled">Cancelados</option>
        </select>
      </div>

      {/* Restaurants table */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Restaurante</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Propietario</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Creado</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {filtered.map(rest => {
                const badge = PLAN_BADGES[rest.subscription_plan ?? 'trial'] ?? PLAN_BADGES.trial;
                const Icon = badge.icon;
                const trialExpired = rest.trial_ends_at && new Date(rest.trial_ends_at) < new Date();

                return (
                  <tr key={rest.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-white">{rest.name}</p>
                        <p className="text-xs text-gray-500">/{rest.slug}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {rest.owner?.full_name ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase', badge.bg, badge.text)}>
                        <Icon className="w-3 h-3" />
                        {rest.subscription_plan ?? 'trial'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {rest.is_active !== false ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 uppercase">Activo</span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 uppercase">Inactivo</span>
                      )}
                      {rest.subscription_plan === 'trial' && trialExpired && (
                        <span className="ml-1 text-[10px] text-red-500">Expirado</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(rest.created_at).toLocaleDateString('es-MX', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={`/r/${rest.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-800 text-gray-400 hover:text-white text-xs transition-colors"
                      >
                        Ver menú <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-600">
            <Store className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No se encontraron restaurantes</p>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-gray-600">
        Mostrando {filtered.length} de {restaurants.length} restaurantes
      </p>
    </div>
  );
}
