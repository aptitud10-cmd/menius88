'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import {
  Clock, ChefHat, CheckCircle, Package, Bell, BellOff,
  Maximize, Minimize, RefreshCw, ArrowRight, X, AlertTriangle,
} from 'lucide-react';
import { updateOrderStatus } from '@/lib/actions/restaurant';
import { cn, timeAgo, ORDER_STATUS_CONFIG, formatPrice } from '@/lib/utils';
import type { Order, OrderStatus, OrderItem } from '@/types';

const KDS_COLUMNS: { status: OrderStatus; label: string; icon: typeof Clock; color: string }[] = [
  { status: 'pending', label: 'Nuevos', icon: Bell, color: 'border-amber-400 bg-amber-50' },
  { status: 'confirmed', label: 'Confirmados', icon: CheckCircle, color: 'border-blue-400 bg-blue-50' },
  { status: 'preparing', label: 'Preparando', icon: ChefHat, color: 'border-orange-400 bg-orange-50' },
  { status: 'ready', label: 'Listos', icon: Package, color: 'border-emerald-400 bg-emerald-50' },
];

const NEXT_STATUS: Record<string, OrderStatus> = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'delivered',
};

const NEXT_LABEL: Record<string, string> = {
  pending: 'Confirmar',
  confirmed: 'Preparar',
  preparing: '¡Listo!',
  ready: 'Entregar',
};

const NEXT_COLOR: Record<string, string> = {
  pending: 'bg-blue-600 hover:bg-blue-700',
  confirmed: 'bg-orange-600 hover:bg-orange-700',
  preparing: 'bg-emerald-600 hover:bg-emerald-700',
  ready: 'bg-gray-800 hover:bg-gray-900',
};

interface KitchenDisplayProps {
  initialOrders: Order[];
  restaurantId: string;
  restaurantName: string;
}

export function KitchenDisplay({ initialOrders, restaurantId, restaurantName }: KitchenDisplayProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [isPending, startTransition] = useTransition();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastPoll, setLastPoll] = useState(new Date().toISOString());
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGczIjig2markup7dxMi83ntyq16xfKQu76jW5NyoTCsnteDaxNuQRicppdzVxcuOPiMlorfc1cvRhzofIqLe38zTh0YhJqjd4MbRiD0dHabj48nZkUsjJ6fm5M/WkU0kKKbk4c3VkEojJ6Xl4c3UkUslKabk483VkU0kKKbk4c3Vj0ohJqXl4czTkEojJqXk4MzSkEkhJaTj38rRjkYfJKLh3cnRi0IcH6Dg3MjOiT4bHJ3d28TGhzkaGpzb2sHEhjcXFpna2L/BgzMWFJbY1ry/gDIUEZLU0rm8fS4SDZDR0Le8fC0RDI3P0LW6eysQC43Nz7O4eCkOCYvLzrC2dycMBoXJyq2zcyQKBIPGxqmwcCIIAwLDxKWsbh8GwgGCQ+GpbB0FQQCBg1+nql1EwIBBAp4mKRyEAEAAgZ0lJ9xDgAAAAN0k55yDwAAAAR1laBzDwAAAAR1lJ9yDgAAAAN0k55xDgAAAAN0kp1wDQAAAAJyj5pvDAAAAAFxjplsCwAAAABvjJdqCgAAAABui5ZpCQAAAABtipVoCQAAAABtipRnCAAAAABsipRnCAAAAABsipRnCA==');
  }, []);

  // Auto-refresh every 5 seconds (faster for kitchen)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/tenant/orders/poll?since=${encodeURIComponent(lastPoll)}`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.orders?.length > 0) {
          setOrders(prev => {
            const map = new Map(prev.map(o => [o.id, o]));
            const currentNew = new Set<string>();

            data.orders.forEach((o: Order) => {
              if (!map.has(o.id)) currentNew.add(o.id);
              map.set(o.id, o);
            });

            if (currentNew.size > 0) {
              setNewIds(currentNew);
              if (soundEnabled && audioRef.current) {
                audioRef.current.play().catch(() => {});
              }
              setTimeout(() => setNewIds(new Set()), 8000);
            }

            return Array.from(map.values());
          });
          setLastPoll(data.timestamp);
        }
      } catch { /* silent */ }
    }, 5000);

    return () => clearInterval(interval);
  }, [lastPoll, soundEnabled]);

  const handleAdvance = (order: Order) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    startTransition(async () => {
      await updateOrderStatus(order.id, next);
      setOrders(prev =>
        next === 'delivered'
          ? prev.filter(o => o.id !== order.id)
          : prev.map(o => o.id === order.id ? { ...o, status: next } : o)
      );
    });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Calculate time elapsed for each order
  const getMinutesElapsed = (createdAt: string) => {
    return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* KDS Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 h-12 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <ChefHat className="w-5 h-5 text-orange-500" />
          <h1 className="font-bold text-sm tracking-tight">{restaurantName} — Cocina</h1>
          <span className="text-[10px] text-gray-600 font-mono">
            {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-1 rounded-lg font-mono">
            {orders.length} activas
          </span>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 transition-colors"
          >
            {soundEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 transition-colors"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* KDS Columns */}
      <div className="flex-1 grid grid-cols-4 gap-px bg-gray-800 overflow-hidden">
        {KDS_COLUMNS.map(col => {
          const Icon = col.icon;
          const colOrders = orders.filter(o => o.status === col.status);

          return (
            <div key={col.status} className="bg-gray-950 flex flex-col overflow-hidden">
              {/* Column header */}
              <div className={cn('px-3 py-2 border-b-2 flex items-center justify-between flex-shrink-0', col.color)}>
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span className="font-bold text-sm text-gray-900">{col.label}</span>
                </div>
                <span className="text-xs font-bold bg-white/50 text-gray-700 px-2 py-0.5 rounded-full">
                  {colOrders.length}
                </span>
              </div>

              {/* Orders */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {colOrders.map(order => {
                  const items = order.items ?? [];
                  const mins = getMinutesElapsed(order.created_at);
                  const isUrgent = mins > 15 && order.status !== 'ready';
                  const isNew = newIds.has(order.id);

                  return (
                    <div
                      key={order.id}
                      className={cn(
                        'bg-gray-900 rounded-xl border p-3 transition-all',
                        isNew ? 'border-amber-500 animate-pulse ring-1 ring-amber-500/50' :
                        isUrgent ? 'border-red-500/50' : 'border-gray-800'
                      )}
                    >
                      {/* Order header */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-bold text-sm text-white">{order.order_number}</span>
                        <span className={cn(
                          'text-[10px] font-bold px-1.5 py-0.5 rounded-full font-mono',
                          isUrgent ? 'bg-red-500/20 text-red-400' : 'bg-gray-800 text-gray-500'
                        )}>
                          {mins}m
                        </span>
                      </div>

                      {/* Order type + customer */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {order.order_type && order.order_type !== 'dine_in' && (
                          <span className={cn(
                            'text-[9px] font-bold px-1.5 py-0.5 rounded-full',
                            order.order_type === 'delivery' ? 'bg-blue-500/20 text-blue-400' : 'bg-violet-500/20 text-violet-400'
                          )}>
                            {order.order_type === 'delivery' ? '🛵 DELIVERY' : '🥡 LLEVAR'}
                          </span>
                        )}
                        {order.customer_name && (
                          <span className="text-xs text-gray-400 truncate">{order.customer_name}</span>
                        )}
                      </div>

                      {/* Items - large and clear for kitchen */}
                      <div className="space-y-1 mb-3">
                        {items.map((item, idx) => {
                          const prod = item.product as { name: string } | undefined;
                          return (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-lg font-bold text-white leading-tight">{item.qty}×</span>
                              <span className="text-sm text-gray-200 leading-tight">{prod?.name ?? 'Producto'}</span>
                              {item.notes && (
                                <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1 rounded font-medium">NOTA</span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Item notes visible */}
                      {items.some(i => i.notes) && (
                        <div className="bg-amber-500/10 rounded-lg px-2.5 py-1.5 mb-2">
                          {items.filter(i => i.notes).map((i, idx) => (
                            <p key={idx} className="text-[11px] text-amber-300 leading-snug">
                              ⚠ {(i.product as any)?.name}: {i.notes}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Order notes */}
                      {order.notes && (
                        <div className="bg-amber-500/10 rounded-lg px-2.5 py-1.5 mb-2">
                          <p className="text-[11px] text-amber-300 leading-snug">📝 {order.notes}</p>
                        </div>
                      )}

                      {/* Action button */}
                      <button
                        onClick={() => handleAdvance(order)}
                        disabled={isPending}
                        className={cn(
                          'w-full py-2.5 rounded-lg text-white font-bold text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.97]',
                          NEXT_COLOR[order.status] ?? 'bg-gray-700'
                        )}
                      >
                        {NEXT_LABEL[order.status] ?? 'Avanzar'}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}

                {colOrders.length === 0 && (
                  <div className="flex items-center justify-center h-32 text-gray-700">
                    <p className="text-xs">Sin órdenes</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
