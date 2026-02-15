'use client';

import { useState, useTransition, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import {
  Clock, ChefHat, CheckCircle, Package, XCircle, User, ArrowRight,
  Bell, BellOff, Volume2, VolumeX, RefreshCw, History, LayoutGrid,
  X, Phone, FileText, Printer, ChevronRight,
} from 'lucide-react';
import { updateOrderStatus } from '@/lib/actions/restaurant';
import { formatPrice, timeAgo, ORDER_STATUS_CONFIG, cn } from '@/lib/utils';
import type { Order, OrderStatus, OrderItem } from '@/types';

const COLUMNS: { status: OrderStatus; icon: typeof Clock; label: string }[] = [
  { status: 'pending', icon: Clock, label: 'Pendientes' },
  { status: 'confirmed', icon: CheckCircle, label: 'Confirmadas' },
  { status: 'preparing', icon: ChefHat, label: 'Preparando' },
  { status: 'ready', icon: Package, label: 'Listas' },
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
  preparing: 'Lista',
  ready: 'Entregar',
};

interface OrdersBoardProps {
  initialOrders: Order[];
  restaurantId: string;
}

export function OrdersBoard({ initialOrders, restaurantId }: OrdersBoardProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [isPending, startTransition] = useTransition();
  const [view, setView] = useState<'board' | 'history'>('board');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const [lastPoll, setLastPoll] = useState(new Date().toISOString());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGczIjig2markup7dxMi83ntyq16xfKQu76jW5NyoTCsnteDaxNuQRicppdzVxcuOPiMlorfc1cvRhzofIqLe38zTh0YhJqjd4MbRiD0dHabj48nZkUsjJ6fm5M/WkU0kKKbk4c3VkEojJ6Xl4c3UkUslKabk483VkU0kKKbk4c3Vj0ohJqXl4czTkEojJqXk4MzSkEkhJaTj38rRjkYfJKLh3cnRi0IcH6Dg3MjOiT4bHJ3d28TGhzkaGpzb2sHEhjcXFpna2L/BgzMWFJbY1ry/gDIUEZLU0rm8fS4SDZDR0Le8fC0RDI3P0LW6eysQC43Nz7O4eCkOCYvLzrC2dycMBoXJyq2zcyQKBIPGxqmwcCIIAwLDxKWsbh8GwgGCQ+GpbB0FQQCBg1+nql1EwIBBAp4mKRyEAEAAgZ0lJ9xDgAAAAN0k55yDwAAAAR1laBzDwAAAAR1lJ9yDgAAAAN0k55xDgAAAAN0kp1wDQAAAAJyj5pvDAAAAAFxjplsCwAAAABvjJdqCgAAAABui5ZpCQAAAABtipVoCQAAAABtipRnCAAAAABsipRnCAAAAABsipRnCA==');
  }, []);

  // Auto-refresh: poll every 10 seconds for new orders
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/tenant/orders/poll?since=${encodeURIComponent(lastPoll)}`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.orders && data.orders.length > 0) {
          const existingIds = new Set(orders.map(o => o.id));
          const newOrders = data.orders.filter((o: Order) => !existingIds.has(o.id));

          if (newOrders.length > 0) {
            // Play notification sound
            if (soundEnabled && audioRef.current) {
              audioRef.current.play().catch(() => {});
            }

            // Flash new order IDs
            setNewOrderIds(new Set(newOrders.map((o: Order) => o.id)));
            setTimeout(() => setNewOrderIds(new Set()), 5000);

            setOrders(prev => [...newOrders, ...prev]);
          }

          setLastPoll(data.timestamp);
        }
      } catch { /* silent */ }
    }, 10000);

    return () => clearInterval(interval);
  }, [lastPoll, orders, soundEnabled]);

  const handleStatusChange = useCallback((orderId: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    startTransition(async () => {
      await updateOrderStatus(orderId, newStatus);
    });
  }, [startTransition]);

  const handleCancel = useCallback((orderId: string) => {
    handleStatusChange(orderId, 'cancelled');
  }, [handleStatusChange]);

  // Stats
  const activeOrders = orders.filter(o => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status));
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const preparingCount = orders.filter(o => o.status === 'preparing').length;
  const readyCount = orders.filter(o => o.status === 'ready').length;
  const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString());
  const todayTotal = todayOrders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + Number(o.total), 0);
  const todayCount = todayOrders.filter(o => o.status !== 'cancelled').length;
  const completedOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.status));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Órdenes</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {todayCount} órdenes hoy · {formatPrice(todayTotal)} vendido
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Sound toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              soundEnabled ? 'text-brand-600 bg-brand-50' : 'text-gray-400 bg-gray-100'
            )}
            title={soundEnabled ? 'Sonido activado' : 'Sonido desactivado'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          {/* View toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setView('board')}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                view === 'board' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5 inline-block mr-1" />
              Kanban
            </button>
            <button
              onClick={() => setView('history')}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                view === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              )}
            >
              <History className="w-3.5 h-3.5 inline-block mr-1" />
              Historial
            </button>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <StatPill label="Pendientes" value={pendingCount} color="amber" pulse={pendingCount > 0} />
        <StatPill label="Preparando" value={preparingCount} color="violet" />
        <StatPill label="Listas" value={readyCount} color="emerald" />
        <StatPill label="Venta hoy" value={formatPrice(todayTotal)} color="blue" />
      </div>

      {view === 'board' ? (
        /* ===== Kanban Board ===== */
        activeOrders.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No hay órdenes activas</p>
            <p className="text-sm mt-1 text-gray-300">Las órdenes aparecerán aquí cuando tus clientes empiecen a pedir</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {COLUMNS.map(({ status, icon: Icon, label }) => {
              const config = ORDER_STATUS_CONFIG[status];
              const columnOrders = orders.filter(o => o.status === status);
              return (
                <div key={status}>
                  {/* Column header */}
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                    <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center', config.bg)}>
                      <Icon className={cn('w-3.5 h-3.5', config.color)} />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{label}</span>
                    <span className={cn('ml-auto text-xs font-bold px-2 py-0.5 rounded-full', config.bg, config.color)}>
                      {columnOrders.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="space-y-2.5">
                    {columnOrders.map(order => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        status={status}
                        isNew={newOrderIds.has(order.id)}
                        onAdvance={() => handleStatusChange(order.id, NEXT_STATUS[status])}
                        onCancel={() => handleCancel(order.id)}
                        onSelect={() => setSelectedOrder(order)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* ===== History View ===== */
        <OrderHistory orders={completedOrders} onSelect={setSelectedOrder} />
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={(status) => {
            handleStatusChange(selectedOrder.id, status);
            setSelectedOrder(prev => prev ? { ...prev, status } : null);
          }}
        />
      )}
    </div>
  );
}

// =========================================================
// Order Card
// =========================================================
function OrderCard({ order, status, isNew, onAdvance, onCancel, onSelect }: {
  order: Order;
  status: OrderStatus;
  isNew: boolean;
  onAdvance: () => void;
  onCancel: () => void;
  onSelect: () => void;
}) {
  const items = order.items ?? [];

  return (
    <div
      className={cn(
        'bg-white rounded-xl border shadow-sm p-3.5 cursor-pointer hover:shadow-md transition-all group',
        isNew
          ? 'border-amber-300 ring-2 ring-amber-200 animate-pulse'
          : 'border-gray-100 hover:border-gray-200'
      )}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-gray-700">{order.order_number}</span>
          {isNew && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 uppercase tracking-wider">
              Nueva
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400">{timeAgo(order.created_at)}</span>
      </div>

      {/* Customer */}
      {order.customer_name && (
        <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-2">
          <User className="w-3.5 h-3.5 text-gray-400" />
          <span className="truncate">{order.customer_name}</span>
        </div>
      )}

      {/* Items preview */}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {items.slice(0, 4).map((item, idx) => {
            const prod = item.product as { name: string } | undefined;
            return (
              <span key={idx} className="text-[11px] bg-gray-50 text-gray-600 px-1.5 py-0.5 rounded-md">
                {item.qty}x {prod?.name ?? 'Producto'}
              </span>
            );
          })}
          {items.length > 4 && (
            <span className="text-[11px] text-gray-400 px-1.5 py-0.5">+{items.length - 4} más</span>
          )}
        </div>
      )}

      {/* Notes indicator */}
      {order.notes && (
        <div className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md mb-2 w-fit">
          <FileText className="w-2.5 h-2.5" />
          Tiene notas
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
        <span className="font-bold text-sm text-gray-900">{formatPrice(Number(order.total))}</span>
        <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
          {NEXT_STATUS[status] && (
            <button
              onClick={onAdvance}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-900 text-white text-[11px] font-semibold hover:bg-gray-800 active:scale-95 transition-all"
            >
              {NEXT_LABEL[status]}
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
          {status !== 'cancelled' && status !== 'delivered' && (
            <button
              onClick={onCancel}
              className="p-1.5 rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// =========================================================
// Order Detail Modal
// =========================================================
function OrderDetailModal({ order, onClose, onStatusChange }: {
  order: Order;
  onClose: () => void;
  onStatusChange: (status: OrderStatus) => void;
}) {
  const items = order.items ?? [];
  const config = ORDER_STATUS_CONFIG[order.status] ?? ORDER_STATUS_CONFIG.pending;
  const nextStatus = NEXT_STATUS[order.status];

  const handlePrint = () => {
    const printContent = `
      <html><head><title>Orden ${order.order_number}</title>
      <style>body{font-family:monospace;font-size:12px;max-width:300px;margin:0 auto;padding:10px}
      h2{text-align:center;margin:0 0 5px}hr{border:1px dashed #ccc}
      .item{display:flex;justify-content:space-between;margin:3px 0}
      .total{font-weight:bold;font-size:14px;border-top:2px solid #000;padding-top:5px;margin-top:5px}
      </style></head><body>
      <h2>Orden #${order.order_number}</h2>
      <p style="text-align:center">${new Date(order.created_at).toLocaleString('es-MX')}</p>
      <hr/>
      <p><strong>Cliente:</strong> ${order.customer_name || 'Sin nombre'}</p>
      ${order.notes ? `<p><strong>Notas:</strong> ${order.notes}</p>` : ''}
      <hr/>
      ${items.map(i => {
        const name = (i.product as any)?.name ?? 'Producto';
        return `<div class="item"><span>${i.qty}x ${name}</span><span>$${Number(i.line_total).toFixed(2)}</span></div>`;
      }).join('')}
      <div class="total"><div class="item"><span>TOTAL</span><span>$${Number(order.total).toFixed(2)}</span></div></div>
      </body></html>
    `;
    const win = window.open('', '_blank', 'width=350,height=500');
    if (win) {
      win.document.write(printContent);
      win.document.close();
      win.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-[fadeIn_0.15s_ease-out]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-[slideUp_0.2s_ease-out]">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10 rounded-t-2xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-lg">{order.order_number}</span>
              <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full uppercase', config.bg, config.color)}>
                {config.label}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date(order.created_at).toLocaleString('es-MX', {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={handlePrint} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors" title="Imprimir ticket">
              <Printer className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Customer info */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            {order.customer_name && (
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-gray-700">{order.customer_name}</span>
              </div>
            )}
            {(order as any).customer_phone && (
              <a href={`tel:${(order as any).customer_phone}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                <Phone className="w-4 h-4 text-gray-400" />
                {(order as any).customer_phone}
              </a>
            )}
            {order.notes && (
              <div className="flex items-start gap-2 text-sm">
                <FileText className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-gray-600 italic">{order.notes}</p>
              </div>
            )}
          </div>

          {/* Items */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Productos</h4>
            <div className="space-y-2.5">
              {items.map((item, idx) => {
                const prod = item.product as { name: string; image_url?: string } | undefined;
                return (
                  <div key={idx} className="flex items-center gap-3">
                    {prod?.image_url ? (
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <Image src={prod.image_url} alt="" fill sizes="40px" className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Package className="w-4 h-4 text-gray-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {prod?.name ?? 'Producto'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {item.qty} × {formatPrice(Number(item.unit_price))}
                      </p>
                      {item.notes && (
                        <p className="text-xs text-amber-600 italic mt-0.5">"{item.notes}"</p>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatPrice(Number(item.line_total))}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Total */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">Total</span>
              <span className="text-2xl font-bold text-gray-900">{formatPrice(Number(order.total))}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {nextStatus && (
              <button
                onClick={() => onStatusChange(nextStatus)}
                className="flex-1 py-3 rounded-xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {NEXT_LABEL[order.status]}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {order.status !== 'cancelled' && order.status !== 'delivered' && (
              <button
                onClick={() => onStatusChange('cancelled')}
                className="px-4 py-3 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================
// Order History
// =========================================================
function OrderHistory({ orders, onSelect }: { orders: Order[]; onSelect: (o: Order) => void }) {
  const [filter, setFilter] = useState<'all' | 'delivered' | 'cancelled'>('all');

  const filtered = filter === 'all'
    ? orders
    : orders.filter(o => o.status === filter);

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        {(['all', 'delivered', 'cancelled'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              filter === f ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            )}
          >
            {f === 'all' ? 'Todas' : f === 'delivered' ? 'Entregadas' : 'Canceladas'}
          </button>
        ))}
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} órdenes</span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Sin órdenes en historial</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {filtered.map(order => {
              const statusConfig = ORDER_STATUS_CONFIG[order.status] ?? ORDER_STATUS_CONFIG.pending;
              const items = order.items ?? [];
              return (
                <button
                  key={order.id}
                  onClick={() => onSelect(order)}
                  className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-gray-700">{order.order_number}</span>
                      <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', statusConfig.bg, statusConfig.color)}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {order.customer_name && <span className="text-xs text-gray-500">{order.customer_name}</span>}
                      <span className="text-xs text-gray-400">
                        · {items.length} items
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">{formatPrice(Number(order.total))}</p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(order.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================
// Stat Pill
// =========================================================
function StatPill({ label, value, color, pulse }: {
  label: string;
  value: string | number;
  color: 'amber' | 'violet' | 'emerald' | 'blue';
  pulse?: boolean;
}) {
  const colors = {
    amber: 'border-amber-100 bg-amber-50',
    violet: 'border-violet-100 bg-violet-50',
    emerald: 'border-emerald-100 bg-emerald-50',
    blue: 'border-blue-100 bg-blue-50',
  };
  const textColors = {
    amber: 'text-amber-600',
    violet: 'text-violet-600',
    emerald: 'text-emerald-600',
    blue: 'text-blue-600',
  };

  return (
    <div className={cn('rounded-xl border p-3', colors[color])}>
      <div className="flex items-center gap-1.5">
        <p className="text-[10px] text-gray-500 font-medium">{label}</p>
        {pulse && (
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
          </span>
        )}
      </div>
      <p className={cn('text-xl font-bold mt-0.5', textColors[color])}>{value}</p>
    </div>
  );
}
