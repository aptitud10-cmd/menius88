'use client';

import { useState, useEffect } from 'react';
import {
  Users, Search, DollarSign, ShoppingBag, TrendingUp, RefreshCw,
  Phone, Mail, Clock, ChevronRight, MessageSquare, X, ArrowUpDown,
} from 'lucide-react';
import { cn, formatPrice, timeAgo } from '@/lib/utils';

interface Customer {
  id: string;
  phone: string;
  name: string;
  email: string;
  total_orders: number;
  total_spent: number;
  last_order_at: string | null;
  notes: string;
  created_at: string;
}

interface CustomerOrder {
  id: string;
  order_number: string;
  status: string;
  total: number;
  order_type: string;
  created_at: string;
  tip_amount: number;
}

export function CustomersDashboard() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState({ total: 0, totalSpent: 0, totalOrders: 0, returning: 0, avgOrderValue: 0 });
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('recent');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchCustomers = async () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    params.set('sort', sort);
    const res = await fetch(`/api/tenant/customers?${params}`);
    const data = await res.json();
    setCustomers(data.customers ?? []);
    setStats(data.stats ?? { total: 0, totalSpent: 0, totalOrders: 0, returning: 0, avgOrderValue: 0 });
    setLoading(false);
  };

  useEffect(() => { fetchCustomers(); }, [sort]);

  const handleSearch = () => { setLoading(true); fetchCustomers(); };

  const handleSelect = async (customer: Customer) => {
    setSelected(customer);
    setLoadingDetail(true);
    const res = await fetch('/api/tenant/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: customer.phone }),
    });
    const data = await res.json();
    setOrders(data.orders ?? []);
    setLoadingDetail(false);
  };

  const handleSaveNotes = async (id: string, notes: string) => {
    await fetch('/api/tenant/customers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, notes }),
    });
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, notes } : c));
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-4 gap-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}</div>
        {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-white rounded-xl border border-gray-100" />)}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total clientes', value: stats.total, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Revenue total', value: formatPrice(stats.totalSpent), icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Recurrentes', value: stats.returning, icon: RefreshCw, color: 'text-violet-500', bg: 'bg-violet-50' },
          { label: 'Ticket promedio', value: formatPrice(stats.avgOrderValue), icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-50' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', s.bg)}>
                  <Icon className={cn('w-3.5 h-3.5', s.color)} />
                </div>
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{s.label}</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Search + Sort */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Buscar por nombre, teléfono o email..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none">
          <option value="recent">Más recientes</option>
          <option value="spent">Mayor gasto</option>
          <option value="orders">Más pedidos</option>
        </select>
      </div>

      {/* Customers list */}
      {customers.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-50">
          {customers.map(c => (
            <button
              key={c.id}
              onClick={() => handleSelect(c)}
              className={cn(
                'w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-gray-50 transition-colors',
                selected?.id === c.id && 'bg-brand-50'
              )}
            >
              <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-brand-600">{(c.name || c.phone).slice(0, 2).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{c.name || 'Sin nombre'}</p>
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  <span className="flex items-center gap-0.5"><Phone className="w-2.5 h-2.5" />{c.phone}</span>
                  {c.email && <span className="flex items-center gap-0.5"><Mail className="w-2.5 h-2.5" />{c.email}</span>}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-gray-900">{c.total_orders} pedidos</p>
                <p className="text-[10px] text-gray-400">{formatPrice(c.total_spent)}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                {c.last_order_at && (
                  <p className="text-[10px] text-gray-400 flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" /> {timeAgo(c.last_order_at)}
                  </p>
                )}
                {c.total_orders > 3 && (
                  <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">Frecuente</span>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sin clientes registrados</p>
          <p className="text-sm text-gray-300 mt-1">Los clientes se registran al hacer pedidos con su teléfono</p>
        </div>
      )}

      {/* Customer Detail Drawer */}
      {selected && (
        <CustomerDetailDrawer
          customer={selected}
          orders={orders}
          loading={loadingDetail}
          onClose={() => setSelected(null)}
          onSaveNotes={handleSaveNotes}
        />
      )}
    </div>
  );
}

function CustomerDetailDrawer({ customer, orders, loading, onClose, onSaveNotes }: {
  customer: Customer;
  orders: CustomerOrder[];
  loading: boolean;
  onClose: () => void;
  onSaveNotes: (id: string, notes: string) => void;
}) {
  const [notes, setNotes] = useState(customer.notes ?? '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSaveNotes(customer.id, notes);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const orderTypeLabel: Record<string, string> = { dine_in: '🍽️', pickup: '🥡', delivery: '🛵' };
  const statusLabel: Record<string, string> = {
    pending: '⏳', confirmed: '✅', preparing: '👨‍🍳', ready: '📦', delivered: '✓', cancelled: '✗',
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-end" onClick={onClose}>
      <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Detalle del cliente</h3>
          <button onClick={onClose} className="p-1"><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Customer info */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center">
              <span className="text-sm font-bold text-brand-600">{(customer.name || customer.phone).slice(0, 2).toUpperCase()}</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">{customer.name || 'Sin nombre'}</p>
              <p className="text-xs text-gray-400 flex items-center gap-2">
                <span><Phone className="w-3 h-3 inline" /> {customer.phone}</span>
                {customer.email && <span><Mail className="w-3 h-3 inline" /> {customer.email}</span>}
              </p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-gray-900">{customer.total_orders}</p>
              <p className="text-[10px] text-gray-400">Pedidos</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-gray-900">{formatPrice(customer.total_spent)}</p>
              <p className="text-[10px] text-gray-400">Gastado</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-gray-900">
                {customer.total_orders > 0 ? formatPrice(customer.total_spent / customer.total_orders) : '$0'}
              </p>
              <p className="text-[10px] text-gray-400">Ticket prom.</p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="flex items-center gap-1 text-xs font-semibold text-gray-500 mb-1.5">
              <MessageSquare className="w-3 h-3" /> Notas internas
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Alergia a nueces, prefiere mesa cerca de ventana..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
            />
            <button onClick={handleSave}
              className={cn('mt-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all',
                saved ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}>
              {saved ? '✓ Guardado' : 'Guardar notas'}
            </button>
          </div>

          {/* Order history */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Historial de pedidos</h4>
            {loading ? (
              <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}</div>
            ) : orders.length > 0 ? (
              <div className="space-y-1.5">
                {orders.map(o => (
                  <div key={o.id} className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-xs font-medium text-gray-900">
                        #{o.order_number} {orderTypeLabel[o.order_type] ?? ''} {statusLabel[o.status] ?? ''}
                      </p>
                      <p className="text-[10px] text-gray-400">{new Date(o.created_at).toLocaleDateString('es-MX')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-gray-900">{formatPrice(o.total)}</p>
                      {o.tip_amount > 0 && <p className="text-[9px] text-emerald-600">+{formatPrice(o.tip_amount)} propina</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-4">Sin historial de pedidos</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
