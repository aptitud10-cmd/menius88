'use client';

import { useState, useEffect } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, Plus, Trash2, Receipt,
  ChevronLeft, ChevronRight, BarChart3, Percent,
} from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  is_recurring: boolean;
  recurring_frequency: string | null;
}

interface Summary {
  revenue: number;
  tips: number;
  totalExpenses: number;
  profit: number;
  margin: number;
  byCategory: Record<string, number>;
  month: string;
}

const CATEGORIES: Record<string, { label: string; emoji: string; color: string }> = {
  food: { label: 'Alimentos', emoji: '🥩', color: 'bg-red-50 text-red-700' },
  beverage: { label: 'Bebidas', emoji: '🍺', color: 'bg-amber-50 text-amber-700' },
  supplies: { label: 'Insumos', emoji: '📦', color: 'bg-blue-50 text-blue-700' },
  labor: { label: 'Nómina', emoji: '👷', color: 'bg-violet-50 text-violet-700' },
  rent: { label: 'Renta', emoji: '🏠', color: 'bg-emerald-50 text-emerald-700' },
  utilities: { label: 'Servicios', emoji: '💡', color: 'bg-cyan-50 text-cyan-700' },
  marketing: { label: 'Marketing', emoji: '📣', color: 'bg-pink-50 text-pink-700' },
  maintenance: { label: 'Mantenimiento', emoji: '🔧', color: 'bg-orange-50 text-orange-700' },
  equipment: { label: 'Equipo', emoji: '🖥️', color: 'bg-indigo-50 text-indigo-700' },
  other: { label: 'Otro', emoji: '📋', color: 'bg-gray-50 text-gray-700' },
};

export function ExpensesDashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<Summary>({ revenue: 0, tips: 0, totalExpenses: 0, profit: 0, margin: 0, byCategory: {}, month: '' });
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [filterCat, setFilterCat] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newCat, setNewCat] = useState('food');
  const [newDesc, setNewDesc] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newRecurring, setNewRecurring] = useState(false);

  const fetchData = async () => {
    const params = new URLSearchParams({ month });
    if (filterCat !== 'all') params.set('category', filterCat);
    const res = await fetch(`/api/tenant/expenses?${params}`);
    const data = await res.json();
    setExpenses(data.expenses ?? []);
    setSummary(data.summary ?? { revenue: 0, tips: 0, totalExpenses: 0, profit: 0, margin: 0, byCategory: {}, month: '' });
    setLoading(false);
  };

  useEffect(() => { setLoading(true); fetchData(); }, [month, filterCat]);

  const handleAdd = async () => {
    if (!newDesc || !newAmount) return;
    await fetch('/api/tenant/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: newCat,
        description: newDesc,
        amount: parseFloat(newAmount),
        date: newDate,
        is_recurring: newRecurring,
      }),
    });
    setNewDesc(''); setNewAmount(''); setShowAdd(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    await fetch('/api/tenant/expenses', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setExpenses(prev => prev.filter(e => e.id !== id));
    fetchData();
  };

  const navigateMonth = (delta: number) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const monthLabel = new Date(month + '-01').toLocaleDateString('es-MX', { year: 'numeric', month: 'long' });
  const maxCat = Math.max(...Object.values(summary.byCategory), 1);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-4 gap-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}</div>
        <div className="h-48 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigateMonth(-1)} className="p-1.5 rounded-lg hover:bg-gray-100"><ChevronLeft className="w-4 h-4 text-gray-500" /></button>
          <span className="text-sm font-semibold text-gray-900 capitalize min-w-[140px] text-center">{monthLabel}</span>
          <button onClick={() => navigateMonth(1)} className="p-1.5 rounded-lg hover:bg-gray-100"><ChevronRight className="w-4 h-4 text-gray-500" /></button>
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm focus:outline-none">
          <option value="all">Todas las categorías</option>
          {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
        </select>
      </div>

      {/* P&L Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center"><TrendingUp className="w-4 h-4 text-emerald-500" /></div>
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Ingresos</span>
          </div>
          <p className="text-xl font-bold text-emerald-600">{formatPrice(summary.revenue)}</p>
          {summary.tips > 0 && <p className="text-[10px] text-gray-400">+{formatPrice(summary.tips)} propinas</p>}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center"><TrendingDown className="w-4 h-4 text-red-500" /></div>
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Gastos</span>
          </div>
          <p className="text-xl font-bold text-red-600">{formatPrice(summary.totalExpenses)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', summary.profit >= 0 ? 'bg-emerald-50' : 'bg-red-50')}>
              <DollarSign className={cn('w-4 h-4', summary.profit >= 0 ? 'text-emerald-500' : 'text-red-500')} />
            </div>
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Utilidad</span>
          </div>
          <p className={cn('text-xl font-bold', summary.profit >= 0 ? 'text-emerald-600' : 'text-red-600')}>
            {formatPrice(summary.profit)}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center"><Percent className="w-4 h-4 text-brand-500" /></div>
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Margen</span>
          </div>
          <p className={cn('text-xl font-bold', summary.margin >= 0 ? 'text-emerald-600' : 'text-red-600')}>
            {summary.margin.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Category breakdown */}
      {Object.keys(summary.byCategory).length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-gray-400" /> Gastos por categoría
          </h3>
          <div className="space-y-2">
            {Object.entries(summary.byCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, amount]) => {
                const cfg = CATEGORIES[cat] ?? CATEGORIES.other;
                const pct = summary.totalExpenses > 0 ? (amount / summary.totalExpenses) * 100 : 0;
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700">{cfg.emoji} {cfg.label}</span>
                      <span className="text-xs text-gray-500">{formatPrice(amount)} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${(amount / maxCat) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Add expense */}
      {!showAdd ? (
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700">
          <Plus className="w-4 h-4" /> Registrar gasto
        </button>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <select value={newCat} onChange={e => setNewCat(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20">
              {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
            </select>
            <input type="number" value={newAmount} onChange={e => setNewAmount(e.target.value)} placeholder="Monto *" step="0.01"
              className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
          </div>
          <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Descripción *"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
          <div className="flex items-center gap-3">
            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={newRecurring} onChange={e => setNewRecurring(e.target.checked)} className="rounded" />
              Recurrente
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700">Guardar</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200">Cancelar</button>
          </div>
        </div>
      )}

      {/* Expenses list */}
      {expenses.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-50">
          {expenses.map(e => {
            const cfg = CATEGORIES[e.category] ?? CATEGORIES.other;
            return (
              <div key={e.id} className="flex items-center gap-3 px-5 py-3 group">
                <span className={cn('text-xs font-medium px-2 py-1 rounded-lg', cfg.color)}>{cfg.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{e.description}</p>
                  <p className="text-[10px] text-gray-400">{new Date(e.date).toLocaleDateString('es-MX')} · {cfg.label}
                    {e.is_recurring && ' · 🔄 Recurrente'}
                  </p>
                </div>
                <span className="text-sm font-bold text-red-600 flex-shrink-0">-{formatPrice(e.amount)}</span>
                <button onClick={() => handleDelete(e.id)}
                  className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <Receipt className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sin gastos registrados</p>
          <p className="text-sm text-gray-300 mt-1">Registra tus gastos para ver tu P&L</p>
        </div>
      )}
    </div>
  );
}
