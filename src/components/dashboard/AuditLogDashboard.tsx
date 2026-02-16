'use client';

import { useState, useEffect } from 'react';
import {
  Shield, ChevronLeft, ChevronRight, Filter, Clock,
  User, Package, ClipboardList, Settings, CreditCard,
  Star, Users, Tag, Boxes, Truck,
} from 'lucide-react';
import { cn, timeAgo } from '@/lib/utils';

interface AuditEntry {
  id: string;
  user_email: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, any>;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-emerald-100 text-emerald-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  status_change: 'bg-amber-100 text-amber-700',
  toggle: 'bg-purple-100 text-purple-700',
  login: 'bg-cyan-100 text-cyan-700',
  export: 'bg-indigo-100 text-indigo-700',
  import: 'bg-indigo-100 text-indigo-700',
  invite: 'bg-teal-100 text-teal-700',
  revoke: 'bg-orange-100 text-orange-700',
  payment: 'bg-green-100 text-green-700',
  config_change: 'bg-gray-100 text-gray-700',
};

const ACTION_LABELS: Record<string, string> = {
  create: 'Creó',
  update: 'Actualizó',
  delete: 'Eliminó',
  status_change: 'Cambió estado',
  toggle: 'Activó/Desactivó',
  login: 'Inició sesión',
  logout: 'Cerró sesión',
  export: 'Exportó',
  import: 'Importó',
  invite: 'Invitó',
  revoke: 'Revocó',
  payment: 'Pago',
  refund: 'Reembolso',
  config_change: 'Configuró',
};

const ENTITY_ICONS: Record<string, any> = {
  product: Package,
  category: Tag,
  order: ClipboardList,
  staff: Users,
  review: Star,
  inventory: Boxes,
  settings: Settings,
  subscription: CreditCard,
  delivery_zone: Truck,
};

const ENTITY_LABELS: Record<string, string> = {
  product: 'Producto',
  category: 'Categoría',
  order: 'Orden',
  table: 'Mesa',
  staff: 'Staff',
  invitation: 'Invitación',
  promotion: 'Promoción',
  review: 'Reseña',
  reservation: 'Reservación',
  customer: 'Cliente',
  restaurant: 'Restaurante',
  inventory: 'Inventario',
  expense: 'Gasto',
  delivery_zone: 'Zona delivery',
  translation: 'Traducción',
  menu: 'Menú',
  loyalty: 'Lealtad',
  waitlist: 'Lista espera',
  theme: 'Tema',
  settings: 'Configuración',
  subscription: 'Suscripción',
  payment_link: 'Link de pago',
};

const FILTER_ACTIONS = ['all', 'create', 'update', 'delete', 'status_change', 'toggle', 'export', 'import', 'config_change'];

export function AuditLogDashboard() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const fetchLog = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      if (actionFilter !== 'all') params.set('action', actionFilter);

      const res = await fetch(`/api/tenant/audit?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries ?? []);
        setTotalPages(data.totalPages ?? 1);
        setTotal(data.total ?? 0);
      }
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { fetchLog(); }, [page, actionFilter]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-600" />
            Log de Auditoría
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {total} eventos registrados
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors',
            showFilters
              ? 'bg-brand-50 border-brand-200 text-brand-700 dark:bg-brand-950 dark:border-brand-800 dark:text-brand-400'
              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
          )}
        >
          <Filter className="w-3.5 h-3.5" />
          Filtros
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-1.5">
          {FILTER_ACTIONS.map(action => (
            <button
              key={action}
              onClick={() => { setActionFilter(action); setPage(1); }}
              className={cn(
                'px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors',
                actionFilter === action
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              )}
            >
              {action === 'all' ? 'Todos' : ACTION_LABELS[action] ?? action}
            </button>
          ))}
        </div>
      )}

      {/* Entries */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sin registros</p>
          <p className="text-sm mt-1">Las acciones del equipo aparecerán aquí</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {entries.map(entry => {
            const EntityIcon = ENTITY_ICONS[entry.entity_type] ?? Clock;
            return (
              <div
                key={entry.id}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-3 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <EntityIcon className="w-4 h-4 text-gray-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold uppercase', ACTION_COLORS[entry.action] ?? 'bg-gray-100 text-gray-600')}>
                      {ACTION_LABELS[entry.action] ?? entry.action}
                    </span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {ENTITY_LABELS[entry.entity_type] ?? entry.entity_type}
                    </span>
                    {entry.details?.name && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        &quot;{entry.details.name}&quot;
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {entry.user_email}
                    </span>
                    <span className="text-[10px] text-gray-300 dark:text-gray-600">•</span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo(entry.created_at)}
                    </span>
                  </div>
                </div>

                {entry.entity_id && (
                  <span className="text-[10px] text-gray-300 dark:text-gray-600 font-mono flex-shrink-0">
                    {entry.entity_id.slice(0, 8)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Pág {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
