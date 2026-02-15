'use client';

import { useState, useEffect } from 'react';
import {
  CalendarDays, Users, Clock, Check, X, ChevronLeft, ChevronRight,
  Phone, Mail, MessageSquare, UserCheck, AlertCircle, MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Reservation {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  party_size: number;
  date: string;
  time_slot: string;
  duration_minutes: number;
  status: string;
  notes: string;
  table_id: string | null;
  table?: { name: string; capacity: number } | null;
  created_at: string;
}

interface TableOption {
  id: string;
  name: string;
  capacity: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: 'Pendiente', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Clock },
  confirmed: { label: 'Confirmada', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: Check },
  seated: { label: 'Sentados', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: UserCheck },
  completed: { label: 'Completada', color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', icon: Check },
  cancelled: { label: 'Cancelada', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: X },
  no_show: { label: 'No show', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: AlertCircle },
};

export function ReservationsDashboard() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tables, setTables] = useState<TableOption[]>([]);
  const [stats, setStats] = useState({ today: 0, todayGuests: 0, pending: 0, confirmed: 0 });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const res = await fetch(`/api/tenant/reservations?date=${selectedDate}${filterStatus !== 'all' ? `&status=${filterStatus}` : ''}`);
    const data = await res.json();
    setReservations(data.reservations ?? []);
    setTables(data.tables ?? []);
    setStats(data.stats ?? { today: 0, todayGuests: 0, pending: 0, confirmed: 0 });
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [selectedDate, filterStatus]);

  const handleUpdate = async (id: string, update: Record<string, any>) => {
    await fetch('/api/tenant/reservations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...update }),
    });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta reservación?')) return;
    await fetch('/api/tenant/reservations', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchData();
  };

  const navigateDate = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-4 gap-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}</div>
        {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white rounded-xl border border-gray-100" />)}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Hoy', value: stats.today, icon: CalendarDays, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Invitados hoy', value: stats.todayGuests, icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Pendientes', value: stats.pending, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Confirmadas', value: stats.confirmed, icon: Check, color: 'text-blue-500', bg: 'bg-blue-50' },
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
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Date nav + filter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigateDate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100">
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
          <button onClick={() => navigateDate(1)} className="p-1.5 rounded-lg hover:bg-gray-100">
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
          {!isToday && (
            <button onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])} className="text-xs text-brand-600 font-medium hover:text-brand-700">
              Hoy
            </button>
          )}
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm focus:outline-none"
        >
          <option value="all">Todas</option>
          <option value="pending">Pendientes</option>
          <option value="confirmed">Confirmadas</option>
          <option value="seated">Sentados</option>
          <option value="completed">Completadas</option>
          <option value="cancelled">Canceladas</option>
        </select>
      </div>

      {/* Reservations list */}
      {reservations.length > 0 ? (
        <div className="space-y-3">
          {reservations.map(r => {
            const sc = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.pending;
            const StatusIcon = sc.icon;
            return (
              <div key={r.id} className={cn('bg-white rounded-2xl border p-4 transition-all', sc.bg)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-bold text-gray-900">{r.time_slot}</span>
                      <span className={cn('inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full', sc.color, sc.bg)}>
                        <StatusIcon className="w-3 h-3" /> {sc.label}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Users className="w-3 h-3" /> {r.party_size} personas
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{r.customer_name}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-0.5"><Phone className="w-3 h-3" />{r.customer_phone}</span>
                      {r.customer_email && <span className="flex items-center gap-0.5"><Mail className="w-3 h-3" />{r.customer_email}</span>}
                      {r.table && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />Mesa: {r.table.name}</span>}
                    </div>
                    {r.notes && (
                      <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 flex-shrink-0" /> {r.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    {r.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdate(r.id, { status: 'confirmed' })}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => handleUpdate(r.id, { status: 'cancelled' })}
                          className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100"
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                    {r.status === 'confirmed' && (
                      <button
                        onClick={() => handleUpdate(r.id, { status: 'seated' })}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700"
                      >
                        Sentar
                      </button>
                    )}
                    {r.status === 'seated' && (
                      <button
                        onClick={() => handleUpdate(r.id, { status: 'completed' })}
                        className="px-3 py-1.5 rounded-lg bg-gray-600 text-white text-xs font-medium hover:bg-gray-700"
                      >
                        Completar
                      </button>
                    )}
                    {/* Table assignment */}
                    {['pending', 'confirmed'].includes(r.status) && (
                      <select
                        value={r.table_id ?? ''}
                        onChange={e => handleUpdate(r.id, { table_id: e.target.value || null })}
                        className="px-2 py-1 rounded-lg border border-gray-200 text-[10px] focus:outline-none"
                      >
                        <option value="">Mesa...</option>
                        {tables.map(t => (
                          <option key={t.id} value={t.id}>{t.name} ({t.capacity}p)</option>
                        ))}
                      </select>
                    )}
                    {['cancelled', 'completed', 'no_show'].includes(r.status) && (
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="px-3 py-1.5 rounded-lg bg-gray-50 text-gray-400 text-xs font-medium hover:bg-gray-100"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sin reservaciones para esta fecha</p>
          <p className="text-sm text-gray-300 mt-1">Las reservaciones aparecerán aquí cuando los clientes reserven</p>
        </div>
      )}
    </div>
  );
}
