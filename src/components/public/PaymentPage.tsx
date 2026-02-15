'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  CreditCard, Lock, CheckCircle, AlertCircle, ShoppingBag,
  Clock, ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  restaurant: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    currency: string;
    theme: any;
  };
  order: any;
  cancelled: boolean;
}

export function PaymentPage({ restaurant, order, cancelled }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(cancelled ? 'Pago cancelado. Intenta de nuevo.' : '');

  const curr = restaurant.currency ?? 'MXN';
  const fmt = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: curr }).format(n);
  const theme = restaurant.theme ?? {};
  const primaryColor = theme.primaryColor ?? '#E11D48';

  const isPaid = order.payment_status === 'paid';

  const handlePay = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          restaurant_id: restaurant.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al crear el pago');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        setError('No se pudo generar el link de pago');
      }
    } catch (err: any) {
      setError(err.message);
    }

    setLoading(false);
  };

  const orderTypeLabel: Record<string, string> = {
    dine_in: '🍽️ En mesa',
    pickup: '🥡 Para llevar',
    delivery: '🛵 Delivery',
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          {restaurant.logo_url && (
            <div className="w-14 h-14 rounded-2xl overflow-hidden mx-auto mb-3 bg-white shadow-sm">
              <Image src={restaurant.logo_url} alt="" width={56} height={56} className="object-cover w-full h-full" />
            </div>
          )}
          <h1 className="text-lg font-bold text-gray-900">{restaurant.name}</h1>
          <p className="text-sm text-gray-400">Pago del pedido #{order.order_number}</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Status */}
          {isPaid ? (
            <div className="bg-emerald-50 px-5 py-4 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">Pago completado</p>
                <p className="text-xs text-emerald-600">Tu pedido ha sido pagado exitosamente</p>
              </div>
            </div>
          ) : (
            <div className="px-5 py-4 flex items-center justify-between" style={{ backgroundColor: primaryColor + '08' }}>
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" style={{ color: primaryColor }} />
                <span className="text-sm font-medium text-gray-700">
                  {orderTypeLabel[order.order_type] ?? 'Pedido'}
                </span>
              </div>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(order.created_at).toLocaleDateString('es-MX', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}

          {/* Order items */}
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="space-y-2.5">
              {(order.items ?? []).map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {item.product?.image_url ? (
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <Image src={item.product.image_url} alt="" width={32} height={32} className="object-cover w-full h-full" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs">🍽️</span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-900">{item.qty}x {item.product?.name ?? 'Producto'}</p>
                      {item.notes && <p className="text-[10px] text-gray-400">{item.notes}</p>}
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{fmt(item.line_total)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="px-5 py-3 space-y-1.5">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>{fmt(order.subtotal ?? order.total)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span>Descuento</span>
                <span>-{fmt(order.discount_amount)}</span>
              </div>
            )}
            {order.delivery_fee > 0 && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>Envío</span>
                <span>{fmt(order.delivery_fee)}</span>
              </div>
            )}
            {order.tip_amount > 0 && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>Propina</span>
                <span>{fmt(order.tip_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-100">
              <span>Total</span>
              <span style={{ color: primaryColor }}>{fmt(order.total)}</span>
            </div>
          </div>

          {/* Pay button */}
          {!isPaid && (
            <div className="px-5 pb-5 pt-2">
              {error && (
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-xl mb-3">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {error}
                </div>
              )}
              <button
                onClick={handlePay}
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Procesando...
                  </span>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Pagar {fmt(order.total)}
                  </>
                )}
              </button>
              <p className="text-[10px] text-gray-400 text-center mt-2 flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" /> Pago seguro con Stripe
              </p>
            </div>
          )}

          {/* Back link */}
          <div className="px-5 pb-4 text-center">
            <a
              href={`/r/${restaurant.slug}/order/${order.order_number}`}
              className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" /> Ver seguimiento del pedido
            </a>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-gray-300 mt-4">Powered by Menius</p>
      </div>
    </div>
  );
}
