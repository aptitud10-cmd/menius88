'use client';

import { useState, useEffect } from 'react';
import {
  MapPin, Plus, Trash2, Save, Check, DollarSign, Clock, Ruler, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';

interface DeliveryZone {
  id: string;
  name: string;
  min_distance_km: number;
  max_distance_km: number;
  delivery_fee: number;
  min_order_amount: number;
  estimated_minutes: number;
  is_active: boolean;
  sort_order: number;
}

export function DeliveryZonesManager() {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchZones = async () => {
    const res = await fetch('/api/tenant/delivery-zones');
    const data = await res.json();
    setZones(data.zones ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchZones(); }, []);

  const handleAdd = async () => {
    const lastZone = zones[zones.length - 1];
    const res = await fetch('/api/tenant/delivery-zones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Zona ${zones.length + 1}`,
        min_distance_km: lastZone ? lastZone.max_distance_km : 0,
        max_distance_km: lastZone ? lastZone.max_distance_km + 3 : 3,
        delivery_fee: lastZone ? lastZone.delivery_fee + 15 : 25,
        min_order_amount: 0,
        estimated_minutes: lastZone ? lastZone.estimated_minutes + 10 : 30,
        sort_order: zones.length,
      }),
    });
    const data = await res.json();
    if (data.zone) setZones(prev => [...prev, data.zone]);
  };

  const handleUpdate = async (id: string, field: string, value: any) => {
    setZones(prev => prev.map(z => z.id === id ? { ...z, [field]: value } : z));
  };

  const handleSave = async (zone: DeliveryZone) => {
    setSaving(zone.id);
    await fetch('/api/tenant/delivery-zones', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(zone),
    });
    setTimeout(() => setSaving(null), 1500);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta zona?')) return;
    await fetch('/api/tenant/delivery-zones', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setZones(prev => prev.filter(z => z.id !== id));
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Define zonas por distancia con tarifas y tiempos de entrega diferentes</p>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Agregar zona
        </button>
      </div>

      {zones.length > 0 ? (
        <div className="space-y-3">
          {zones.map((zone, idx) => (
            <div key={zone.id} className={cn(
              'bg-white rounded-2xl border p-5 transition-all',
              zone.is_active ? 'border-gray-200' : 'border-gray-100 opacity-60'
            )}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 font-bold text-sm">
                    {idx + 1}
                  </div>
                  <input
                    value={zone.name}
                    onChange={e => handleUpdate(zone.id, 'name', e.target.value)}
                    className="text-sm font-semibold text-gray-900 bg-transparent border-0 border-b border-transparent hover:border-gray-200 focus:outline-none focus:border-brand-500 transition-colors px-0 py-0.5"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => { handleUpdate(zone.id, 'is_active', !zone.is_active); }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
                    title={zone.is_active ? 'Desactivar' : 'Activar'}
                  >
                    {zone.is_active
                      ? <ToggleRight className="w-5 h-5 text-emerald-500" />
                      : <ToggleLeft className="w-5 h-5" />
                    }
                  </button>
                  <button onClick={() => handleSave(zone)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                    {saving === zone.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Save className="w-4 h-4" />}
                  </button>
                  <button onClick={() => handleDelete(zone.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label className="flex items-center gap-1 text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-1">
                    <Ruler className="w-3 h-3" /> Desde (km)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={zone.min_distance_km}
                    onChange={e => handleUpdate(zone.id, 'min_distance_km', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-1">
                    <Ruler className="w-3 h-3" /> Hasta (km)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={zone.max_distance_km}
                    onChange={e => handleUpdate(zone.id, 'max_distance_km', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-1">
                    <DollarSign className="w-3 h-3" /> Tarifa
                  </label>
                  <input
                    type="number"
                    value={zone.delivery_fee}
                    onChange={e => handleUpdate(zone.id, 'delivery_fee', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-1">
                    <DollarSign className="w-3 h-3" /> Pedido mín.
                  </label>
                  <input
                    type="number"
                    value={zone.min_order_amount}
                    onChange={e => handleUpdate(zone.id, 'min_order_amount', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-1">
                    <Clock className="w-3 h-3" /> Tiempo (min)
                  </label>
                  <input
                    type="number"
                    value={zone.estimated_minutes}
                    onChange={e => handleUpdate(zone.id, 'estimated_minutes', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>
              </div>

              {/* Visual distance bar */}
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden relative">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all"
                    style={{ width: `${Math.min((zone.max_distance_km / 15) * 100, 100)}%`, marginLeft: `${(zone.min_distance_km / 15) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 font-medium flex-shrink-0">
                  {zone.min_distance_km}–{zone.max_distance_km} km • {formatPrice(zone.delivery_fee)} • ~{zone.estimated_minutes} min
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sin zonas de delivery configuradas</p>
          <p className="text-sm text-gray-300 mt-1">Agrega zonas para definir tarifas por distancia</p>
        </div>
      )}
    </div>
  );
}
