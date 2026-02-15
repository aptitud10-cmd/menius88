'use client';

import { useState, useTransition } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { createCategory, updateCategory, deleteCategory } from '@/lib/actions/restaurant';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';

const DAYS = [
  { id: 'lunes', label: 'Lun' },
  { id: 'martes', label: 'Mar' },
  { id: 'miercoles', label: 'Mié' },
  { id: 'jueves', label: 'Jue' },
  { id: 'viernes', label: 'Vie' },
  { id: 'sabado', label: 'Sáb' },
  { id: 'domingo', label: 'Dom' },
];

const SCHEDULE_PRESETS = [
  { label: 'Desayuno', from: '07:00', until: '11:30', icon: '🌅' },
  { label: 'Comida', from: '12:00', until: '16:00', icon: '☀️' },
  { label: 'Cena', from: '18:00', until: '23:00', icon: '🌙' },
  { label: 'Todo el día', from: null, until: null, icon: '📋' },
];

export function CategoriesManager({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [scheduleLabel, setScheduleLabel] = useState<string | null>(null);
  const [availableFrom, setAvailableFrom] = useState<string | null>(null);
  const [availableUntil, setAvailableUntil] = useState<string | null>(null);
  const [availableDays, setAvailableDays] = useState<string[] | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [expandedSchedule, setExpandedSchedule] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const resetForm = () => {
    setName('');
    setEditingId(null);
    setShowForm(false);
    setShowSchedule(false);
    setScheduleLabel(null);
    setAvailableFrom(null);
    setAvailableUntil(null);
    setAvailableDays(null);
    setError('');
  };

  const handleSubmit = () => {
    if (!name.trim()) { setError('Nombre requerido'); return; }

    startTransition(async () => {
      const scheduleData = {
        available_from: availableFrom || null,
        available_until: availableUntil || null,
        available_days: availableDays,
        schedule_label: scheduleLabel || null,
      };

      if (editingId) {
        const result = await updateCategory(editingId, { name, sort_order: 0, is_active: true, ...scheduleData });
        if (result.error) { setError(result.error); return; }
        setCategories(prev => prev.map(c => c.id === editingId ? { ...c, name, ...scheduleData } : c));
      } else {
        const result = await createCategory({ name, sort_order: categories.length, is_active: true, ...scheduleData });
        if (result.error) { setError(result.error); return; }
        setCategories(prev => [...prev, {
          id: `temp-${Date.now()}`, restaurant_id: '', name, sort_order: prev.length,
          is_active: true, created_at: new Date().toISOString(), ...scheduleData,
        }]);
      }
      resetForm();
    });
  };

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setScheduleLabel(cat.schedule_label ?? null);
    setAvailableFrom(cat.available_from ?? null);
    setAvailableUntil(cat.available_until ?? null);
    setAvailableDays(cat.available_days ?? null);
    setShowSchedule(!!(cat.available_from || cat.schedule_label));
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar esta categoría? Los productos en ella también se eliminarán.')) return;
    startTransition(async () => {
      await deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
    });
  };

  const handleToggle = (cat: Category) => {
    startTransition(async () => {
      await updateCategory(cat.id, { name: cat.name, sort_order: cat.sort_order, is_active: !cat.is_active });
      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, is_active: !c.is_active } : c));
    });
  };

  const handleSaveSchedule = (catId: string, data: Partial<Category>) => {
    startTransition(async () => {
      const cat = categories.find(c => c.id === catId);
      if (!cat) return;
      await updateCategory(catId, {
        name: cat.name, sort_order: cat.sort_order, is_active: cat.is_active,
        ...data,
      });
      setCategories(prev => prev.map(c => c.id === catId ? { ...c, ...data } : c));
      setExpandedSchedule(null);
    });
  };

  const applyPreset = (preset: typeof SCHEDULE_PRESETS[0]) => {
    setScheduleLabel(preset.label);
    setAvailableFrom(preset.from);
    setAvailableUntil(preset.until);
    if (!preset.from) setAvailableDays(null);
  };

  const toggleDay = (dayId: string) => {
    setAvailableDays(prev => {
      const current = prev ?? DAYS.map(d => d.id);
      return current.includes(dayId) ? current.filter(d => d !== dayId) : [...current, dayId];
    });
  };

  return (
    <div>
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="mb-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Nueva categoría
        </button>
      )}

      {showForm && (
        <div className="mb-4 bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          {error && <p className="text-sm text-red-500">{error}</p>}
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nombre de la categoría"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />

          {/* Schedule toggle */}
          <button
            onClick={() => setShowSchedule(!showSchedule)}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700"
          >
            <Clock className="w-3.5 h-3.5" />
            {showSchedule ? 'Ocultar horario' : 'Agregar horario de disponibilidad'}
            {showSchedule ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showSchedule && (
            <div className="bg-gray-50 rounded-xl p-3 space-y-3 border border-gray-100">
              {/* Presets */}
              <div className="flex flex-wrap gap-1.5">
                {SCHEDULE_PRESETS.map(p => (
                  <button
                    key={p.label}
                    onClick={() => applyPreset(p)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                      scheduleLabel === p.label
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
                    )}
                  >
                    {p.icon} {p.label}
                  </button>
                ))}
              </div>

              {/* Time inputs */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-400 font-medium uppercase mb-1">Desde</label>
                  <input
                    type="time"
                    value={availableFrom ?? ''}
                    onChange={e => setAvailableFrom(e.target.value || null)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 font-medium uppercase mb-1">Hasta</label>
                  <input
                    type="time"
                    value={availableUntil ?? ''}
                    onChange={e => setAvailableUntil(e.target.value || null)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>
              </div>

              {/* Day selector */}
              <div>
                <label className="block text-[10px] text-gray-400 font-medium uppercase mb-1">Días disponible</label>
                <div className="flex gap-1">
                  {DAYS.map(d => (
                    <button
                      key={d.id}
                      onClick={() => toggleDay(d.id)}
                      className={cn(
                        'flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all border',
                        (!availableDays || availableDays.includes(d.id))
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-white text-gray-400 border-gray-200'
                      )}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={handleSubmit} disabled={isPending}
              className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
              {editingId ? 'Guardar' : 'Crear'}
            </button>
            <button onClick={resetForm} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {categories.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="font-medium">Sin categorías</p>
          <p className="text-sm mt-1">Crea tu primera categoría para organizar tu menú</p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map(cat => (
            <div key={cat.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${cat.is_active ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                    {cat.name}
                  </span>
                  {!cat.is_active && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Inactiva</span>
                  )}
                  {cat.schedule_label && (
                    <span className="text-[10px] font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {cat.schedule_label}
                      {cat.available_from && ` ${cat.available_from}–${cat.available_until}`}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setExpandedSchedule(expandedSchedule === cat.id ? null : cat.id)}
                    className={cn('p-1.5 rounded-lg hover:bg-gray-100 transition-colors', cat.schedule_label ? 'text-brand-500' : 'text-gray-400')}
                    title="Horario"
                  >
                    <Clock className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleToggle(cat)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                    {cat.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button onClick={() => handleEdit(cat)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(cat.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Inline schedule editor */}
              {expandedSchedule === cat.id && (
                <InlineScheduleEditor
                  category={cat}
                  onSave={(data) => handleSaveSchedule(cat.id, data)}
                  onCancel={() => setExpandedSchedule(null)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InlineScheduleEditor({ category, onSave, onCancel }: {
  category: Category;
  onSave: (data: Partial<Category>) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState(category.schedule_label ?? '');
  const [from, setFrom] = useState(category.available_from ?? '');
  const [until, setUntil] = useState(category.available_until ?? '');
  const [days, setDays] = useState<string[]>(category.available_days ?? DAYS.map(d => d.id));

  const toggleDay = (dayId: string) => {
    setDays(prev => prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId]);
  };

  return (
    <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 space-y-2.5">
      <div className="flex flex-wrap gap-1.5">
        {SCHEDULE_PRESETS.map(p => (
          <button
            key={p.label}
            onClick={() => { setLabel(p.label); setFrom(p.from ?? ''); setUntil(p.until ?? ''); }}
            className={cn(
              'px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all',
              label === p.label ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-500 border-gray-200'
            )}
          >
            {p.icon} {p.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <input type="time" value={from} onChange={e => setFrom(e.target.value)}
          className="px-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/30" />
        <input type="time" value={until} onChange={e => setUntil(e.target.value)}
          className="px-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/30" />
        <button
          onClick={() => onSave({
            schedule_label: label || null,
            available_from: from || null,
            available_until: until || null,
            available_days: days.length === 7 ? null : days,
          })}
          className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-700"
        >
          Guardar
        </button>
      </div>
      <div className="flex gap-1">
        {DAYS.map(d => (
          <button key={d.id} onClick={() => toggleDay(d.id)}
            className={cn(
              'flex-1 py-1 rounded text-[9px] font-semibold border transition-all',
              days.includes(d.id) ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-400 border-gray-200'
            )}
          >
            {d.label}
          </button>
        ))}
      </div>
      <div className="flex justify-between">
        <button onClick={() => onSave({ schedule_label: null, available_from: null, available_until: null, available_days: null })}
          className="text-[10px] text-red-500 hover:text-red-600 font-medium">
          Quitar horario
        </button>
        <button onClick={onCancel} className="text-[10px] text-gray-400 hover:text-gray-500 font-medium">Cancelar</button>
      </div>
    </div>
  );
}
