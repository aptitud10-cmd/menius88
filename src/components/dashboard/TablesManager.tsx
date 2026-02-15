'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { Plus, Trash2, QrCode, Download, Copy, Check, ExternalLink, X } from 'lucide-react';
import { createTable, deleteTable } from '@/lib/actions/restaurant';
import { cn } from '@/lib/utils';
import type { Table } from '@/types';

export function TablesManager({ initialTables, restaurantSlug }: { initialTables: Table[]; restaurantSlug?: string }) {
  const [tables, setTables] = useState(initialTables);
  const [name, setName] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const [bulkCount, setBulkCount] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) { setError('Nombre requerido'); return; }

    startTransition(async () => {
      const result = await createTable({ name });
      if (result.error) { setError(result.error); return; }
      setTables(prev => [...prev, {
        id: `temp-${Date.now()}`, restaurant_id: '', name,
        qr_code_value: '#', is_active: true, created_at: new Date().toISOString(),
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

  return (
    <div>
      {/* Actions */}
      {!showForm && (
        <div className="flex items-center gap-2 mb-5">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Nueva mesa
          </button>
          <span className="text-xs text-gray-400 ml-auto">{tables.length} mesas</span>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="mb-5 bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Agregar mesas</h3>
            <button onClick={() => { setShowForm(false); setError(''); }} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
              <X className="w-4 h-4" />
            </button>
          </div>
          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          {/* Single */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Una mesa</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Mesa 1, Barra, Terraza A"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
              <button
                onClick={handleSubmit}
                disabled={isPending}
                className="px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
              >
                Crear
              </button>
            </div>
          </div>

          {/* Bulk */}
          <div className="border-t border-gray-100 pt-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Crear varias a la vez</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={bulkCount}
                onChange={(e) => setBulkCount(e.target.value)}
                placeholder="¿Cuántas mesas?"
                min="1"
                max="50"
                className="w-40 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
              <button
                onClick={handleBulkCreate}
                disabled={isPending}
                className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
              >
                {isPending ? 'Creando...' : 'Crear mesas'}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Se nombrarán como "Mesa 1", "Mesa 2", etc.</p>
          </div>
        </div>
      )}

      {/* Table grid */}
      {tables.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <QrCode className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sin mesas</p>
          <p className="text-sm mt-1">Crea mesas para generar códigos QR automáticamente</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tables.map(table => (
            <QRTableCard key={table.id} table={table} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

function QRTableCard({ table, onDelete }: { table: Table; onDelete: (id: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrReady, setQrReady] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || table.qr_code_value === '#') return;
    import('qrcode').then((QRCode) => {
      QRCode.toCanvas(canvasRef.current, table.qr_code_value, {
        width: 180,
        margin: 2,
        color: { dark: '#1a1a1a', light: '#ffffff' },
      }, () => {
        setQrReady(true);
      });
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:border-gray-200 hover:shadow-md transition-all">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
            <QrCode className="w-4 h-4 text-brand-600" />
          </div>
          <h3 className="font-semibold text-sm text-gray-900">{table.name}</h3>
        </div>
        <button
          onClick={() => onDelete(table.id)}
          className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* QR Code */}
      <div className="flex justify-center py-4 bg-gray-50/50">
        <canvas ref={canvasRef} className="rounded-xl shadow-sm" />
      </div>

      {/* Actions */}
      <div className="px-4 py-3 flex gap-2">
        {qrReady && (
          <button
            onClick={downloadQR}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-brand-50 text-brand-700 text-xs font-medium hover:bg-brand-100 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Descargar
          </button>
        )}
        <button
          onClick={copyUrl}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all',
            copied
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copiado' : 'Copiar URL'}
        </button>
      </div>

      {/* URL */}
      <div className="px-4 pb-3">
        <p className="text-[10px] text-gray-400 truncate">{table.qr_code_value}</p>
      </div>
    </div>
  );
}
