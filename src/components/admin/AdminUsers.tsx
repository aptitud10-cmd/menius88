'use client';

import { useState } from 'react';
import { Search, User, Shield, Store } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Profile {
  user_id: string;
  full_name: string;
  role: string;
  default_restaurant_id: string | null;
  created_at: string;
  restaurant?: { name: string; slug: string } | null;
}

export function AdminUsers({ profiles }: { profiles: Profile[] }) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filtered = profiles.filter(p => {
    const matchesSearch = !search ||
      p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.user_id.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || p.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleCounts = {
    super_admin: profiles.filter(p => p.role === 'super_admin').length,
    owner: profiles.filter(p => p.role === 'owner').length,
    staff: profiles.filter(p => p.role === 'staff').length,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">Usuarios</h1>

      {/* Role stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Super Admins', count: roleCounts.super_admin, color: 'text-red-500', icon: Shield },
          { label: 'Propietarios', count: roleCounts.owner, color: 'text-blue-500', icon: Store },
          { label: 'Staff', count: roleCounts.staff, color: 'text-emerald-500', icon: User },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={cn('w-4 h-4', s.color)} />
                <span className="text-xs text-gray-500">{s.label}</span>
              </div>
              <p className="text-2xl font-bold text-white">{s.count}</p>
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
            placeholder="Buscar por nombre o ID..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-sm text-white focus:outline-none"
        >
          <option value="all">Todos los roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="owner">Propietario</option>
          <option value="staff">Staff</option>
        </select>
      </div>

      {/* Users table */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rol</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Restaurante</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {filtered.map(p => (
                <tr key={p.user_id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{p.full_name || 'Sin nombre'}</p>
                    <p className="text-[10px] font-mono text-gray-600 mt-0.5">{p.user_id.slice(0, 8)}...</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase',
                      p.role === 'super_admin' ? 'bg-red-500/10 text-red-400' :
                      p.role === 'owner' ? 'bg-blue-500/10 text-blue-400' :
                      'bg-gray-800 text-gray-400'
                    )}>
                      {p.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {p.restaurant?.name ?? <span className="text-gray-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(p.created_at).toLocaleDateString('es-MX', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-600">
            <User className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No se encontraron usuarios</p>
          </div>
        )}
      </div>
    </div>
  );
}
