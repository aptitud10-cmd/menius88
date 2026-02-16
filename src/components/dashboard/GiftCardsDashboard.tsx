'use client';

import { useState, useEffect } from 'react';
import { Gift, Plus, X, Copy, Check, Trash2, CreditCard, DollarSign } from 'lucide-react';
import { cn, timeAgo } from '@/lib/utils';

interface GiftCard {
  id: string;
  code: string;
  initial_amount: number;
  remaining_amount: number;
  buyer_name: string;
  recipient_name: string;
  recipient_email: string;
  message: string;
  status: string;
  expires_at: string | null;
  created_at: string;
}

interface Stats {
  total: number;
  active: number;
  totalValue: number;
  remainingValue: number;
}

export function GiftCardsDashboard() {
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, totalValue: 0, remainingValue: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [amount, setAmount] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [message, setMessage] = useState('');
  const [expiresDays, setExpiresDays] = useState('365');

  const fetchCards = async () => {
    try {
      const res = await fetch('/api/tenant/gift-cards');
      if (res.ok) {
        const data = await res.json();
        setCards(data.cards ?? []);
        setStats(data.stats ?? { total: 0, active: 0, totalValue: 0, remainingValue: 0 });
      }
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { fetchCards(); }, []);

  const handleCreate = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setCreating(true);
    try {
      const res = await fetch('/api/tenant/gift-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          buyer_name: buyerName,
          recipient_name: recipientName,
          recipient_email: recipientEmail,
          message,
          expires_days: expiresDays ? parseInt(expiresDays) : null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCards(prev => [data.card, ...prev]);
        setShowForm(false);
        setAmount('');
        setBuyerName('');
        setRecipientName('');
        setRecipientEmail('');
        setMessage('');
      }
    } catch { /* silent */ }
    setCreating(false);
  };

  const handleCancel = async (id: string) => {
    if (!confirm('¿Cancelar esta tarjeta de regalo?')) return;
    await fetch(`/api/tenant/gift-cards?id=${id}`, { method: 'DELETE' });
    setCards(prev => prev.map(c => c.id === id ? { ...c, status: 'cancelled' } : c));
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fmt = (n: number) => `$${n.toFixed(2)}`;

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 w-48 bg-gray-100 dark:bg-gray-800 rounded-xl" />
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Gift className="w-5 h-5 text-brand-600" />
            Tarjetas de Regalo
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stats.total} tarjetas creadas</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Nueva tarjeta
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active}</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">Activas</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
          <p className="text-2xl font-bold text-emerald-600">{fmt(stats.totalValue)}</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">Valor total</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
          <p className="text-2xl font-bold text-blue-600">{fmt(stats.remainingValue)}</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">Saldo pendiente</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
          <p className="text-2xl font-bold text-amber-600">{fmt(stats.totalValue - stats.remainingValue)}</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">Redimido</p>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Crear tarjeta de regalo</h3>
            <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Monto *</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="50.00" min="1" step="0.01"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Expira en (días)</label>
              <input type="number" value={expiresDays} onChange={e => setExpiresDays(e.target.value)} placeholder="365"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Comprador</label>
              <input type="text" value={buyerName} onChange={e => setBuyerName(e.target.value)} placeholder="Nombre"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Destinatario</label>
              <input type="text" value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="Nombre"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Mensaje (opcional)</label>
            <input type="text" value={message} onChange={e => setMessage(e.target.value)} placeholder="¡Feliz cumpleaños!"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
          </div>

          <button onClick={handleCreate} disabled={creating || !amount}
            className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors">
            {creating ? 'Creando...' : 'Crear tarjeta'}
          </button>
        </div>
      )}

      {/* Cards list */}
      {cards.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Gift className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sin tarjetas de regalo</p>
          <p className="text-sm mt-1">Crea tarjetas para tus clientes</p>
        </div>
      ) : (
        <div className="space-y-2">
          {cards.map(card => (
            <div key={card.id} className={cn(
              'bg-white dark:bg-gray-900 rounded-xl border px-4 py-3 transition-all',
              card.status === 'active' ? 'border-gray-100 dark:border-gray-800' : 'border-gray-100 dark:border-gray-800 opacity-50'
            )}>
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                  card.status === 'active' ? 'bg-brand-50 dark:bg-brand-950' : 'bg-gray-100 dark:bg-gray-800'
                )}>
                  <CreditCard className={cn('w-5 h-5', card.status === 'active' ? 'text-brand-600' : 'text-gray-400')} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-bold text-gray-900 dark:text-white tracking-wider">{card.code}</code>
                    <button onClick={() => copyCode(card.code, card.id)}
                      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors">
                      {copiedId === card.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                    <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                      card.status === 'active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' :
                      card.status === 'used' ? 'bg-gray-100 text-gray-500' :
                      'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400'
                    )}>
                      {card.status === 'active' ? 'Activa' : card.status === 'used' ? 'Usada' : 'Cancelada'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {fmt(parseFloat(String(card.remaining_amount)))} / {fmt(parseFloat(String(card.initial_amount)))}
                    </span>
                    {card.recipient_name && <span className="text-xs text-gray-400">Para: {card.recipient_name}</span>}
                    <span className="text-[10px] text-gray-300 dark:text-gray-600">{timeAgo(card.created_at)}</span>
                  </div>
                </div>

                {card.status === 'active' && (
                  <button onClick={() => handleCancel(card.id)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
