'use client';

import { useState, useTransition, useEffect, useRef, useCallback } from 'react';
import { Plus, Trash2, QrCode, Download, Copy, Check, X, Circle, Users, Clock, Eye } from 'lucide-react';
import { createTable, deleteTable } from '@/lib/actions/restaurant';
import { cn } from '@/lib/utils';
import type { Table, TableStatus } from '@/types';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  available: { label: 'Libre', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500' },
  occupied: { label: 'Ocupada', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800', dot: 'bg-red-500' },
  reserved: { label: 'Reservada', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800', dot: 'bg-blue-500' },
  cleaning: { label: 'Limpieza', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800', dot: 'bg-amber-500' },
};

type ViewMode = 'status' | 'qr';

export function TablesManager({ initialTables, restaurantSlug }: { initialTables: Table[]; restaurantSlug?: string }) {
  const [tables, setTables] = useState(initialTables);
  const [name, setName] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const [bulkCount, setBulkCount] = useState('');
  const [view, setView] = useState<ViewMode>('status');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  // Auto-refresh table status
  useEffect(() => {
    if (view !== 'status') return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/tenant/tables');
        if (res.ok) {
          const data = await res.json();
          setTables(data.tables ?? []);
        }
      } catch { /* silent */ }
    }, 10000);
    return () => clearInterval(interval);
  }, [view]);

  const handleSubmit = () => {
    if (!name.trim()) { setError('Nombre requerido'); return; }
    startTransition(async () => {
      const result = await createTable({ name });
      if (result.error) { setError(result.error); return; }
      setTables(prev => [...prev, {
        id: `temp-${Date.now()}`, restaurant_id: '', name,
        qr_code_value: '#', is_active: true, created_at: new Date().toISOString(),
        status: 'available' as TableStatus,
      }]);
      setName('');
      setShowForm(false);
      setError('');
    });
  };

  const handleBulkCreate = () => {
    const count = parseInt(bulkCount);
    if (isNaN(count) || count < 1 || count > 50) { setError('Ingresa un número entre 1 y 50'); return; }
    startTransition(async () => {
      const startNum = tables.length + 1;
      for (let i = 0; i < count; i++) {
        const tableName = `Mesa ${startNum + i}`;
        const result = await createTable({ name: tableName });
        if (!result.error) {
          setTables(prev => [...prev, {
            id: `temp-${Date.now()}-${i}`, restaurant_id: '', name: tableName,
            qr_code_value: '#', is_active: true, created_at: new Date().toISOString(),
            status: 'available' as TableStatus,
          }]);
        }
      }
      setBulkCount('');
      setShowForm(false);
      setError('');
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar esta mesa y su código QR?')) return;
    startTransition(async () => {
      await deleteTable(id);
      setTables(prev => prev.filter(t => t.id !== id));
    });
  };

  const updateStatus = async (tableId: string, status: TableStatus) => {
    try {
      await fetch('/api/tenant/tables', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tableId, status }),
      });
      setTables(prev => prev.map(t => t.id === tableId ? { ...t, status } : t));
    } catch { /* silent */ }
  };

  const stats = {
    total: tables.length,
    available: tables.filter(t => (t.status ?? 'available') === 'available').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
    reserved: tables.filter(t => t.status === 'reserved').length,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <QrCode className="w-5 h-5 text-brand-600" />
            Mesas & QRs
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{tables.length} mesas</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
            <button onClick={() => setView('status')}
              className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                view === 'status' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400')}>
              Estado
            </button>
            <button onClick={() => setView('qr')}
              className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                view === 'qr' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400')}>
              QR Codes
            </button>
          </div>
          {!showForm && (
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors">
              <Plus className="w-4 h-4" /> Nueva mesa
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {view === 'status' && (
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3 text-center">
            <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Total</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3 text-center">
            <p className="text-xl font-bold text-emerald-600">{stats.available}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Libres</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3 text-center">
            <p className="text-xl font-bold text-red-600">{stats.occupied}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Ocupadas</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3 text-center">
            <p className="text-xl font-bold text-blue-600">{stats.reserved}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Reservadas</p>
          </div>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Agregar mesas</h3>
            <button onClick={() => { setShowForm(false); setError(''); }} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
              <X className="w-4 h-4" />
            </button>
          </div>
          {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">{error}</p>}

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Una mesa</label>
            <div className="flex gap-2">
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Mesa 1, Barra, Terraza A" autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30" />
              <button onClick={handleSubmit} disabled={isPending}
                className="px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
                Crear
              </button>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Crear varias a la vez</label>
            <div className="flex gap-2">
              <input type="number" value={bulkCount} onChange={(e) => setBulkCount(e.target.value)} placeholder="¿Cuántas mesas?" min="1" max="50"
                className="w-40 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30" />
              <button onClick={handleBulkCreate} disabled={isPending}
                className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50">
                {isPending ? 'Creando...' : 'Crear mesas'}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Se nombrarán como "Mesa 1", "Mesa 2", etc.</p>
          </div>
        </div>
      )}

      {/* Tables grid */}
      {tables.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <QrCode className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sin mesas</p>
          <p className="text-sm mt-1">Crea mesas para generar códigos QR automáticamente</p>
        </div>
      ) : view === 'status' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {tables.map(table => (
            <TableStatusCard
              key={table.id}
              table={table}
              onStatusChange={updateStatus}
              onDelete={handleDelete}
              onSelect={() => setSelectedTable(table)}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tables.map(table => (
            <QRTableCard key={table.id} table={table} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Table detail modal */}
      {selectedTable && (
        <TableDetailModal
          table={selectedTable}
          onClose={() => setSelectedTable(null)}
          onStatusChange={(status) => {
            updateStatus(selectedTable.id, status);
            setSelectedTable({ ...selectedTable, status });
          }}
        />
      )}
    </div>
  );
}

// ---- Status Card ----
function TableStatusCard({ table, onStatusChange, onDelete, onSelect }: {
  table: Table;
  onStatusChange: (id: string, status: TableStatus) => void;
  onDelete: (id: string) => void;
  onSelect: () => void;
}) {
  const status = (table.status ?? 'available') as string;
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.available;
  const order = (table as any).current_order;

  const nextStatus: Record<string, TableStatus> = {
    available: 'occupied',
    occupied: 'cleaning',
    cleaning: 'available',
    reserved: 'occupied',
  };

  return (
    <div
      className={cn('rounded-xl border-2 p-3 transition-all cursor-pointer hover:shadow-md group relative', config.bg)}
      onClick={onSelect}
    >
      {/* Delete on hover */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(table.id); }}
        className="absolute top-2 right-2 p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-white/80 dark:hover:bg-gray-900/80 opacity-0 group-hover:opacity-100 transition-all"
      >
        <Trash2 className="w-3 h-3" />
      </button>

      {/* Status dot + name */}
      <div className="flex items-center gap-2 mb-2">
        <div className={cn('w-2.5 h-2.5 rounded-full', config.dot, status === 'occupied' && 'animate-pulse')} />
        <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">{table.name}</h3>
      </div>

      {/* Status label */}
      <p className={cn('text-xs font-semibold', config.color)}>{config.label}</p>

      {/* Order info */}
      {order && status === 'occupied' && (
        <div className="mt-2 pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
          <p className="text-[10px] text-gray-500 truncate">{order.customer_name ?? 'Cliente'}</p>
          <p className="text-xs font-bold text-gray-900 dark:text-white">${parseFloat(order.total ?? 0).toFixed(2)}</p>
        </div>
      )}

      {/* Quick action */}
      <button
        onClick={(e) => { e.stopPropagation(); onStatusChange(table.id, nextStatus[status] ?? 'available'); }}
        className={cn(
          'mt-2 w-full py-1.5 rounded-lg text-[10px] font-semibold transition-colors',
          status === 'available' ? 'bg-red-500/10 text-red-600 hover:bg-red-500/20' :
          status === 'occupied' ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20' :
          status === 'cleaning' ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20' :
          'bg-red-500/10 text-red-600 hover:bg-red-500/20'
        )}
      >
        {status === 'available' ? 'Marcar ocupada' :
         status === 'occupied' ? 'Marcar limpieza' :
         status === 'cleaning' ? 'Marcar libre' :
         'Sentar clientes'}
      </button>
    </div>
  );
}

// ---- Detail Modal ----
function TableDetailModal({ table, onClose, onStatusChange }: {
  table: Table;
  onClose: () => void;
  onStatusChange: (status: TableStatus) => void;
}) {
  const status = (table.status ?? 'available') as string;
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.available;
  const order = (table as any).current_order;

  const statuses: TableStatus[] = ['available', 'occupied', 'reserved', 'cleaning'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm mx-4 overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={cn('p-5 text-center', config.bg)}>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{table.name}</h2>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <div className={cn('w-2 h-2 rounded-full', config.dot)} />
            <span className={cn('text-sm font-semibold', config.color)}>{config.label}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Current order */}
          {order && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Pedido activo</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{order.order_number}</p>
                  <p className="text-xs text-gray-500">{order.customer_name}</p>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">${parseFloat(order.total ?? 0).toFixed(2)}</p>
              </div>
            </div>
          )}

          {/* Status buttons */}
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Cambiar estado</p>
            <div className="grid grid-cols-2 gap-2">
              {statuses.map(s => {
                const sc = STATUS_CONFIG[s];
                return (
                  <button
                    key={s}
                    onClick={() => onStatusChange(s)}
                    className={cn(
                      'py-2.5 rounded-xl text-xs font-semibold transition-all border-2',
                      s === status ? `${sc.bg} ${sc.color}` : 'border-gray-100 dark:border-gray-800 text-gray-500 hover:border-gray-200 dark:hover:border-gray-700'
                    )}
                  >
                    {sc.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Info */}
          <div className="flex items-center gap-4 text-xs text-gray-400">
            {table.capacity && (
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {table.capacity} personas</span>
            )}
            {table.section && (
              <span className="flex items-center gap-1"><Circle className="w-3 h-3" /> {table.section}</span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-3">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- QR Card (original) ----
function QRTableCard({ table, onDelete }: { table: Table; onDelete: (id: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrReady, setQrReady] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || table.qr_code_value === '#') return;
    import('qrcode').then((QRCode) => {
      QRCode.toCanvas(canvasRef.current, table.qr_code_value, {
        width: 180, margin: 2, color: { dark: '#1a1a1a', light: '#ffffff' },
      }, () => { setQrReady(true); });
    });
  }, [table.qr_code_value]);

  const downloadQR = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `qr-${table.name.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(table.qr_code_value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* silent */ }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden group hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-md transition-all">
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-50 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950 flex items-center justify-center">
            <QrCode className="w-4 h-4 text-brand-600" />
          </div>
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white">{table.name}</h3>
        </div>
        <button onClick={() => onDelete(table.id)}
          className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 opacity-0 group-hover:opacity-100 transition-all">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex justify-center py-4 bg-gray-50/50 dark:bg-gray-800/30">
        <canvas ref={canvasRef} className="rounded-xl shadow-sm" />
      </div>

      <div className="px-4 py-3 flex gap-2">
        {qrReady && (
          <button onClick={downloadQR}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-400 text-xs font-medium hover:bg-brand-100 dark:hover:bg-brand-900 transition-colors">
            <Download className="w-3.5 h-3.5" /> Descargar
          </button>
        )}
        <button onClick={copyUrl}
          className={cn('flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all',
            copied ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700')}>
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copiado' : 'Copiar URL'}
        </button>
      </div>

      <div className="px-4 pb-3">
        <p className="text-[10px] text-gray-400 truncate">{table.qr_code_value}</p>
      </div>
    </div>
  );
}
