'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Clock, CheckCircle, ChefHat, Package, Truck,
  XCircle, ArrowLeft, Phone, RefreshCw, Star, Send,
} from 'lucide-react';
import { formatPrice, cn, timeAgo } from '@/lib/utils';
import type { OrderStatus } from '@/types';

interface OrderTrackerProps {
  restaurant: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    phone: string | null;
  };
  order: {
    id: string;
    order_number: string;
    status: OrderStatus;
    customer_name: string;
    notes: string;
    total: number;
    created_at: string;
    estimated_ready_at?: string;
    order_items?: Array<{
      id: string;
      qty: number;
      unit_price: number;
      line_total: number;
      notes: string;
      product?: { name: string; image_url: string | null };
    }>;
  };
}

const STATUS_STEPS: { status: OrderStatus; label: string; icon: typeof Clock; description: string }[] = [
  { status: 'pending', label: 'Recibido', icon: Clock, description: 'Tu pedido fue recibido' },
  { status: 'confirmed', label: 'Confirmado', icon: CheckCircle, description: 'El restaurante confirmó tu pedido' },
  { status: 'preparing', label: 'Preparando', icon: ChefHat, description: 'Tu pedido se está preparando' },
  { status: 'ready', label: 'Listo', icon: Package, description: '¡Tu pedido está listo!' },
  { status: 'delivered', label: 'Entregado', icon: Truck, description: 'Pedido entregado. ¡Buen provecho!' },
];

const STATUS_INDEX: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  preparing: 2,
  ready: 3,
  delivered: 4,
};

export function OrderTracker({ restaurant, order: initialOrder }: OrderTrackerProps) {
  const [order, setOrder] = useState(initialOrder);
  const [refreshing, setRefreshing] = useState(false);

  const isCancelled = order.status === 'cancelled';
  const currentStep = STATUS_INDEX[order.status] ?? 0;
  const isComplete = order.status === 'delivered';
  const items = order.order_items ?? [];

  // Auto-refresh every 15 seconds
  useEffect(() => {
    if (isComplete || isCancelled) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/status?restaurant_id=${restaurant.id}&order_number=${order.order_number}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status && data.status !== order.status) {
            setOrder(prev => ({ ...prev, status: data.status }));
          }
        }
      } catch { /* silent */ }
    }, 15000);

    return () => clearInterval(interval);
  }, [order.status, order.order_number, restaurant.id, isComplete, isCancelled]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/orders/status?restaurant_id=${restaurant.id}&order_number=${order.order_number}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status) setOrder(prev => ({ ...prev, status: data.status }));
      }
    } catch { /* silent */ }
    setTimeout(() => setRefreshing(false), 500);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link href={`/r/${restaurant.slug}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Volver al menú
          </Link>
          <div className="flex items-center gap-2">
            {restaurant.logo_url && (
              <Image src={restaurant.logo_url} alt="" width={24} height={24} className="rounded-md object-cover" />
            )}
            <span className="text-sm font-semibold text-gray-700">{restaurant.name}</span>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Order header card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 text-center">
          <p className="text-xs text-gray-400 mb-1">Pedido</p>
          <p className="font-mono font-bold text-3xl text-gray-900">{order.order_number}</p>
          <p className="text-sm text-gray-500 mt-1">{order.customer_name} · {timeAgo(order.created_at)}</p>

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <RefreshCw className={cn('w-3 h-3', refreshing && 'animate-spin')} />
            Actualizar estado
          </button>
        </div>

        {/* Status tracker */}
        {isCancelled ? (
          <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Pedido cancelado</h2>
            <p className="text-sm text-gray-500 mt-1">Este pedido ha sido cancelado</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Estado del pedido</h3>
              {!isComplete && (
                <span className="flex items-center gap-1.5 text-xs text-amber-600">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  En progreso
                </span>
              )}
            </div>

            <div className="space-y-0">
              {STATUS_STEPS.map((step, i) => {
                const isActive = i === currentStep;
                const isDone = i < currentStep;
                const isFuture = i > currentStep;
                const StepIcon = step.icon;

                return (
                  <div key={step.status} className="flex gap-3">
                    {/* Timeline */}
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all',
                        isDone && 'bg-emerald-500 border-emerald-500',
                        isActive && 'bg-amber-500 border-amber-500 shadow-md shadow-amber-500/30',
                        isFuture && 'bg-white border-gray-200',
                      )}>
                        <StepIcon className={cn(
                          'w-4 h-4',
                          isDone && 'text-white',
                          isActive && 'text-white',
                          isFuture && 'text-gray-300',
                        )} />
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div className={cn(
                          'w-0.5 h-8 transition-all',
                          isDone ? 'bg-emerald-500' : 'bg-gray-200'
                        )} />
                      )}
                    </div>

                    {/* Content */}
                    <div className={cn('pb-6', i === STATUS_STEPS.length - 1 && 'pb-0')}>
                      <p className={cn(
                        'text-sm font-semibold',
                        isFuture ? 'text-gray-300' : 'text-gray-900'
                      )}>
                        {step.label}
                      </p>
                      <p className={cn(
                        'text-xs',
                        isFuture ? 'text-gray-200' : 'text-gray-500'
                      )}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Order items */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Tu pedido</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-3 px-5 py-3">
                {item.product?.image_url ? (
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <Image src={item.product.image_url} alt="" fill sizes="48px" className="object-cover" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-gray-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.product?.name ?? 'Producto'}</p>
                  <p className="text-xs text-gray-400">x{item.qty} · {formatPrice(Number(item.unit_price))} c/u</p>
                </div>
                <span className="text-sm font-semibold text-gray-900">{formatPrice(Number(item.line_total))}</span>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-gray-100 flex justify-between">
            <span className="font-semibold text-gray-900">Total</span>
            <span className="font-bold text-lg text-gray-900">{formatPrice(Number(order.total))}</span>
          </div>
        </div>

        {/* Review section - shown when delivered */}
        {isComplete && (
          <ReviewSection
            restaurantId={restaurant.id}
            orderId={order.id}
            customerName={order.customer_name}
          />
        )}

        {/* Contact */}
        {restaurant.phone && (
          <div className="text-center">
            <a
              href={`tel:${restaurant.phone}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Phone className="w-4 h-4" />
              Llamar al restaurante
            </a>
          </div>
        )}
      </div>

      {/* Styles */}
      <style jsx global>{`
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}

// =========================================================
// Review Section
// =========================================================
function ReviewSection({ restaurantId, orderId, customerName }: {
  restaurantId: string;
  orderId: string;
  customerName: string;
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (rating === 0) { setError('Selecciona una calificación'); return; }
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: restaurantId,
          order_id: orderId,
          customer_name: customerName,
          rating,
          comment,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
          <CheckCircle className="w-6 h-6 text-emerald-600" />
        </div>
        <p className="font-semibold text-emerald-800">¡Gracias por tu reseña!</p>
        <p className="text-sm text-emerald-600 mt-1">Tu opinión nos ayuda a mejorar</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
        <Star className="w-4 h-4 text-amber-500" />
        ¿Cómo estuvo tu experiencia?
      </h3>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Star rating */}
      <div className="flex items-center gap-1.5 justify-center py-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="p-1 transition-transform hover:scale-110"
          >
            <Star
              className={cn(
                'w-8 h-8 transition-colors',
                (hoverRating || rating) >= star
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-gray-200'
              )}
            />
          </button>
        ))}
      </div>

      {rating > 0 && (
        <p className="text-center text-sm text-gray-500">
          {rating === 5 ? '¡Excelente! 🎉' :
           rating === 4 ? '¡Muy bien! 👍' :
           rating === 3 ? 'Regular 😊' :
           rating === 2 ? 'Podría mejorar 😐' :
           'Mala experiencia 😔'}
        </p>
      )}

      {/* Comment */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Cuéntanos más sobre tu experiencia... (opcional)"
        rows={2}
        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 resize-none transition-all"
      />

      <button
        onClick={handleSubmit}
        disabled={submitting || rating === 0}
        className="w-full py-3 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
      >
        <Send className="w-4 h-4" />
        {submitting ? 'Enviando...' : 'Enviar reseña'}
      </button>
    </div>
  );
}
