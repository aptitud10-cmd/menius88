'use client';

import { useState, useEffect } from 'react';
import {
  Users, Plus, Clock, Bell, Check, X, UserCheck, Phone,
  MessageSquare, AlertCircle, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WaitlistEntry {
  id: string;
  customer_name: string;
  customer_phone: string;
  party_size: number;
  status: string;
  estimated_wait: number;
  notes: string;
  notified_at: string | null;
  seated_at: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  waiting: 'border-amber-200 bg-amber-50',
  notified: 'border-blue-200 bg-blue-50',
};

export function WaitlistManager() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [stats, setStats] = useState({ waiting: 0, notified: 0, totalGuests: 0 });
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [size, setSize] = useState(2);
  const [notes, setNotes] = useState('');

  const fetchData = async () => {
    const res = await fetch('/api/tenant/waitlist');
    const data = await res.json();
    setEntries(data.entries ?? []);
    setStats(data.stats ?? { waiting: 0, notified: 0, totalGuests: 0 });
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleAdd = async () => {
    if (!name.trim()) return;
    await fetch('/api/tenant/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_name: name, customer_phone: phone, party_size: size, notes }),
    });
    setName(''); setPhone(''); setSize(2); setNotes(''); setShowAdd(false);
    fetchData();
  };

  const handleStatus = async (id: string, status: string) => {
    await fetch('/api/tenant/waitlist', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    if (['seated', 'cancelled', 'no_show'].includes(status)) {
      setEntries(prev => prev.filter(e => e.id !== id));
    } else {
      fetchData();
    }
  };

  const getMinutesWaiting = (createdAt: string) => {
    return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="grid grid-cols-3 gap-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}</div>
        {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-white rounded-xl border border-gray-100" />)}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Esperando', value: stats.waiting, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Notificados', value: stats.notified, icon: Bell, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Invitados en espera', value: stats.totalGuests, icon: Users, color: 'text-violet-500', bg: 'bg-violet-50' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-1">
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

      {/* Add button / form */}
      {!showAdd ? (
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors">
          <Plus className="w-4 h-4" /> Agregar a lista
        </button>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre *" autoFocus
              className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Teléfono"
              className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
          </div>
          <div className="flex items-center gap-3">
            <div>
              <label className="block text-[10px] text-gray-400 font-medium uppercase mb-1">Personas</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <button key={n} onClick={() => setSize(n)}
                    className={cn('w-8 h-8 rounded-lg text-xs font-medium border transition-all',
                      size === n ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200'
                    )}>{n}</button>
                ))}
                <input type="number" min={7} value={size > 6 ? size : ''} onChange={e => setSize(parseInt(e.target.value) || 2)}
                  placeholder="7+" className="w-12 h-8 rounded-lg border border-gray-200 text-xs text-center focus:outline-none" />
              </div>
            </div>
          </div>
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas (opcional)"
            className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700">
              Agregar
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Queue */}
      {entries.length > 0 ? (
        <div className="space-y-2">
          {entries.map((entry, idx) => {
            const mins = getMinutesWaiting(entry.created_at);
            const isUrgent = mins > 20 && entry.status === 'waiting';
            return (
              <div key={entry.id} className={cn(
                'rounded-2xl border p-4 transition-all',
                STATUS_COLORS[entry.status] ?? 'border-gray-200 bg-white',
                isUrgent && 'ring-2 ring-red-200'
              )}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm',
                      entry.status === 'waiting' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                    )}>
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{entry.customer_name}</p>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                        <span className="flex items-center gap-0.5"><Users className="w-2.5 h-2.5" /> {entry.party_size}p</span>
                        <span className={cn('flex items-center gap-0.5 font-medium', isUrgent ? 'text-red-600' : '')}>
                          <Clock className="w-2.5 h-2.5" /> {mins}min
                        </span>
                        {entry.customer_phone && <span className="flex items-center gap-0.5"><Phone className="w-2.5 h-2.5" /> {entry.customer_phone}</span>}
                        {entry.status === 'notified' && (
                          <span className="text-blue-600 font-semibold flex items-center gap-0.5"><Bell className="w-2.5 h-2.5" /> Notificado</span>
                        )}
                      </div>
                      {entry.notes && (
                        <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                          <MessageSquare className="w-2.5 h-2.5" /> {entry.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-1.5 flex-shrink-0">
                    {entry.status === 'waiting' && (
                      <button onClick={() => handleStatus(entry.id, 'notified')}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700" title="Notificar">
                        <Bell className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {(entry.status === 'waiting' || entry.status === 'notified') && (
                      <button onClick={() => handleStatus(entry.id, 'seated')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700" title="Sentar">
                        <UserCheck className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => handleStatus(entry.id, 'no_show')}
                      className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500 text-xs font-medium hover:bg-gray-200" title="No show">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Lista de espera vacía</p>
          <p className="text-sm text-gray-300 mt-1">Agrega clientes cuando todas las mesas estén ocupadas</p>
        </div>
      )}
    </div>
  );
}
