'use client';

import { useState } from 'react';
import { Phone, Search, ShoppingBag, Star, Gift, ArrowLeft, Clock, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Props {
  restaurantId: string;
  restaurantName: string;
  slug: string;
  logoUrl: string | null;
  theme: any;
  loyaltyEnabled: boolean;
}

interface PortalData {
  orders: any[];
  loyalty: any;
  loyaltyConfig: any;
  giftCards: any[];
  totalOrders: number;
  totalSpent: number;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  ready: 'Listo',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-purple-100 text-purple-700',
  ready: 'bg-emerald-100 text-emerald-700',
  delivered: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-600',
};

export function CustomerPortal({ restaurantId, restaurantName, slug, logoUrl, theme, loyaltyEnabled }: Props) {
  const [phone, setPhone] = useState('');
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [giftCode, setGiftCode] = useState('');
  const [giftBalance, setGiftBalance] = useState<{ balance: number; code: string } | null>(null);
  const [giftError, setGiftError] = useState('');

  const primaryColor = theme?.primaryColor ?? '#2563eb';
  const fmt = (n: number) => `$${n.toFixed(2)}`;

  const handleLookup = async () => {
    if (phone.length < 7) { setError('Ingresa tu número de teléfono'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/customer/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurant_id: restaurantId, phone }),
      });
      const result = await res.json();
      if (result.totalOrders === 0 && !result.loyalty) {
        setError('No encontramos pedidos con este número');
      } else {
        setData(result);
      }
    } catch {
      setError('Error al consultar');
    }
    setLoading(false);
  };

  const handleCheckGift = async () => {
    if (!giftCode.trim()) return;
    setGiftError('');
    setGiftBalance(null);
    try {
      const res = await fetch('/api/gift-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurant_id: restaurantId, code: giftCode.trim(), action: 'check' }),
      });
      const result = await res.json();
      if (result.valid) {
        setGiftBalance({ balance: result.balance, code: result.code });
      } else {
        setGiftError(result.error || 'Tarjeta no encontrada');
      }
    } catch {
      setGiftError('Error al consultar');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link href={`/r/${slug}`} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          {logoUrl && <img src={logoUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />}
          <div>
            <h1 className="text-sm font-bold text-gray-900">{restaurantName}</h1>
            <p className="text-[10px] text-gray-400">Mi cuenta</p>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-5">
        {!data ? (
          <>
            {/* Phone lookup */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
                  <Phone className="w-7 h-7" style={{ color: primaryColor }} />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Consulta tu cuenta</h2>
                <p className="text-sm text-gray-500 mt-1">Ingresa tu número de teléfono para ver tu historial</p>
              </div>

              {error && <p className="text-xs text-red-500 text-center bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Tu número de teléfono"
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': `${primaryColor}40` } as any}
                  onKeyDown={e => { if (e.key === 'Enter') handleLookup(); }}
                />
                <button
                  onClick={handleLookup}
                  disabled={loading}
                  className="px-5 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition-colors"
                  style={{ backgroundColor: primaryColor }}
                >
                  {loading ? '...' : <Search className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Gift card check */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Gift className="w-4 h-4 text-amber-500" />
                Consultar tarjeta de regalo
              </h3>

              {giftError && <p className="text-xs text-red-500">{giftError}</p>}
              {giftBalance && (
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-emerald-600 font-medium">Saldo disponible</p>
                  <p className="text-2xl font-bold text-emerald-700">{fmt(giftBalance.balance)}</p>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={giftCode}
                  onChange={e => setGiftCode(e.target.value.toUpperCase())}
                  placeholder="XXXX-XXXX-XXXX"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  onKeyDown={e => { if (e.key === 'Enter') handleCheckGift(); }}
                />
                <button onClick={handleCheckGift} className="px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors">
                  Consultar
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Dashboard */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                <ShoppingBag className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                <p className="text-xl font-bold text-gray-900">{data.totalOrders}</p>
                <p className="text-[10px] text-gray-400 uppercase">Pedidos</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                <CreditCard className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
                <p className="text-xl font-bold text-gray-900">{fmt(data.totalSpent)}</p>
                <p className="text-[10px] text-gray-400 uppercase">Total gastado</p>
              </div>
            </div>

            {/* Loyalty */}
            {loyaltyEnabled && data.loyalty && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
                    <Star className="w-6 h-6" style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Puntos de lealtad</p>
                    <p className="text-2xl font-bold text-gray-900">{data.loyalty.total_points}</p>
                  </div>
                  {data.loyaltyConfig && (
                    <div className="ml-auto text-right">
                      <p className="text-[10px] text-gray-400">Canjea a partir de</p>
                      <p className="text-sm font-semibold" style={{ color: primaryColor }}>{data.loyaltyConfig.redeemThreshold} pts</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Orders */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Historial de pedidos
              </h3>
              <div className="space-y-2">
                {data.orders.map(order => (
                  <Link
                    key={order.id}
                    href={`/r/${slug}/order/${order.order_number}`}
                    className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3 hover:border-gray-200 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{order.order_number}</span>
                        <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600')}>
                          {STATUS_LABELS[order.status] ?? order.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(order.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{fmt(parseFloat(order.total))}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Back button */}
            <button
              onClick={() => { setData(null); setPhone(''); }}
              className="w-full py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Consultar otro número
            </button>
          </>
        )}
      </div>
    </div>
  );
}
