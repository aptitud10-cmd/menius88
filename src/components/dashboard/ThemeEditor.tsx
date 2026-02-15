'use client';

import { useState } from 'react';
import {
  Palette, Type, Circle, Moon, Sun, Save, Check,
  ExternalLink, Eye, Smartphone, Monitor,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RestaurantTheme } from '@/types';

const PRESET_COLORS = [
  '#E11D48', '#DC2626', '#EA580C', '#D97706', '#CA8A04',
  '#65A30D', '#16A34A', '#059669', '#0D9488', '#0891B2',
  '#0284C7', '#2563EB', '#4F46E5', '#7C3AED', '#9333EA',
  '#C026D3', '#DB2777', '#1E293B', '#374151', '#000000',
];

const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter (Modern)' },
  { value: 'DM Sans', label: 'DM Sans (Clean)' },
  { value: 'Sora', label: 'Sora (Geometric)' },
  { value: 'Poppins', label: 'Poppins (Friendly)' },
  { value: 'Playfair Display', label: 'Playfair (Elegant)' },
  { value: 'Lora', label: 'Lora (Classic)' },
  { value: 'Space Grotesk', label: 'Space Grotesk (Tech)' },
  { value: 'Outfit', label: 'Outfit (Versatile)' },
];

const RADIUS_OPTIONS = [
  { value: 'none', label: 'Ninguno', css: '0px' },
  { value: 'sm', label: 'Sutil', css: '8px' },
  { value: 'md', label: 'Medio', css: '12px' },
  { value: 'lg', label: 'Grande', css: '16px' },
  { value: 'xl', label: 'Redondo', css: '24px' },
];

const DEFAULT_THEME: RestaurantTheme = {
  primaryColor: '#E11D48',
  accentColor: '#0891B2',
  fontHeading: 'Inter',
  fontBody: 'Inter',
  borderRadius: 'md',
  darkMode: false,
};

interface ThemeEditorProps {
  slug: string;
  currentTheme: RestaurantTheme | null;
  restaurantName: string;
  logoUrl: string | null;
  coverUrl: string | null;
  tagline: string;
}

export function ThemeEditor({ slug, currentTheme, restaurantName, logoUrl, coverUrl, tagline }: ThemeEditorProps) {
  const [theme, setTheme] = useState<RestaurantTheme>(currentTheme ?? DEFAULT_THEME);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');

  const update = (key: keyof RestaurantTheme, value: any) => {
    setTheme(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/tenant/restaurant', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { /* silent */ }
    setSaving(false);
  };

  const radius = RADIUS_OPTIONS.find(r => r.value === theme.borderRadius)?.css ?? '12px';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Controls */}
      <div className="space-y-5">
        {/* Primary Color */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Palette className="w-4 h-4 text-gray-400" /> Color primario
          </h3>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map(color => (
              <button
                key={color}
                onClick={() => update('primaryColor', color)}
                className={cn(
                  'w-8 h-8 rounded-full transition-all border-2',
                  theme.primaryColor === color ? 'border-gray-900 scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <input
              type="color"
              value={theme.primaryColor}
              onChange={(e) => update('primaryColor', e.target.value)}
              className="w-8 h-8 rounded-lg border-0 cursor-pointer"
            />
            <input
              type="text"
              value={theme.primaryColor}
              onChange={(e) => update('primaryColor', e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
        </div>

        {/* Accent Color */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
            <Circle className="w-4 h-4 text-gray-400" /> Color de acento
          </h3>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={theme.accentColor}
              onChange={(e) => update('accentColor', e.target.value)}
              className="w-8 h-8 rounded-lg border-0 cursor-pointer"
            />
            <input
              type="text"
              value={theme.accentColor}
              onChange={(e) => update('accentColor', e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
        </div>

        {/* Fonts */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Type className="w-4 h-4 text-gray-400" /> Tipografía
          </h3>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Títulos</label>
            <select
              value={theme.fontHeading}
              onChange={(e) => update('fontHeading', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            >
              {FONT_OPTIONS.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Cuerpo</label>
            <select
              value={theme.fontBody}
              onChange={(e) => update('fontBody', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            >
              {FONT_OPTIONS.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Border Radius */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Bordes</h3>
          <div className="flex gap-2">
            {RADIUS_OPTIONS.map(r => (
              <button
                key={r.value}
                onClick={() => update('borderRadius', r.value)}
                className={cn(
                  'flex-1 py-2 text-xs font-medium transition-all border',
                  theme.borderRadius === r.value
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                )}
                style={{ borderRadius: r.css }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dark mode */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              {theme.darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              Modo oscuro
            </h3>
            <button
              onClick={() => update('darkMode', !theme.darkMode)}
              className={cn(
                'w-11 h-6 rounded-full transition-colors relative',
                theme.darkMode ? 'bg-brand-600' : 'bg-gray-200'
              )}
            >
              <div className={cn(
                'w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm',
                theme.darkMode ? 'left-[22px]' : 'left-0.5'
              )} />
            </button>
          </div>
        </div>

        {/* Save + View live */}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold transition-all',
              saved ? 'bg-emerald-600' : 'bg-brand-600 hover:bg-brand-700 disabled:opacity-50'
            )}
          >
            {saved ? <><Check className="w-4 h-4" /> Guardado</> : <><Save className="w-4 h-4" /> {saving ? 'Guardando...' : 'Guardar tema'}</>}
          </button>
          <a
            href={`/r/${slug}`}
            target="_blank"
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            <ExternalLink className="w-4 h-4" /> Ver menú
          </a>
        </div>
      </div>

      {/* Live Preview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Eye className="w-4 h-4 text-gray-400" /> Vista previa
          </h3>
          <div className="flex gap-1">
            <button
              onClick={() => setPreviewDevice('mobile')}
              className={cn('p-1.5 rounded-lg', previewDevice === 'mobile' ? 'bg-gray-200' : 'hover:bg-gray-100')}
            >
              <Smartphone className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => setPreviewDevice('desktop')}
              className={cn('p-1.5 rounded-lg', previewDevice === 'desktop' ? 'bg-gray-200' : 'hover:bg-gray-100')}
            >
              <Monitor className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        <div className={cn(
          'border border-gray-200 rounded-2xl overflow-hidden shadow-xl mx-auto transition-all',
          previewDevice === 'mobile' ? 'max-w-[375px]' : 'w-full'
        )}>
          <div className={cn('min-h-[500px]', theme.darkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900')}
            style={{ fontFamily: theme.fontBody }}
          >
            {/* Preview header */}
            <div className="relative h-36 overflow-hidden" style={{ backgroundColor: theme.primaryColor + '15' }}>
              <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${theme.primaryColor}30, ${theme.accentColor}20)` }} />
              <div className="relative p-5 h-full flex flex-col justify-end">
                <h2 className="text-xl font-bold" style={{ fontFamily: theme.fontHeading, color: theme.primaryColor }}>
                  {restaurantName || 'Tu Restaurante'}
                </h2>
                {tagline && <p className="text-xs mt-0.5 opacity-60">{tagline}</p>}
                <div className="flex gap-2 mt-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full opacity-60" style={{ backgroundColor: theme.primaryColor + '20', borderRadius: radius }}>
                    Cocina Mexicana
                  </span>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-700 rounded-full" style={{ borderRadius: radius }}>
                    Abierto
                  </span>
                </div>
              </div>
            </div>

            {/* Preview category nav */}
            <div className={cn('px-4 py-2 border-b flex gap-2 overflow-x-auto', theme.darkMode ? 'border-gray-800' : 'border-gray-200')}>
              {['Entradas', 'Principales', 'Bebidas', 'Postres'].map((cat, i) => (
                <span
                  key={cat}
                  className={cn('text-xs px-3 py-1.5 font-medium whitespace-nowrap transition-all')}
                  style={{
                    borderRadius: radius,
                    backgroundColor: i === 0 ? theme.primaryColor : 'transparent',
                    color: i === 0 ? 'white' : (theme.darkMode ? '#9CA3AF' : '#6B7280'),
                  }}
                >
                  {cat}
                </span>
              ))}
            </div>

            {/* Preview product cards */}
            <div className="p-4 space-y-3">
              {['Tacos al Pastor', 'Enchiladas Suizas', 'Agua de Jamaica'].map((name, i) => (
                <div
                  key={name}
                  className={cn('flex gap-3 p-3 transition-all', theme.darkMode ? 'bg-gray-900' : 'bg-white')}
                  style={{ borderRadius: radius, border: `1px solid ${theme.darkMode ? '#1F2937' : '#F3F4F6'}` }}
                >
                  <div className="w-16 h-16 flex-shrink-0" style={{ borderRadius: radius, backgroundColor: [theme.primaryColor, theme.accentColor, '#D97706'][i] + '15' }} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ fontFamily: theme.fontHeading }}>{name}</p>
                    <p className="text-[10px] opacity-50 mt-0.5">Descripción del platillo delicioso</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-bold" style={{ color: theme.primaryColor }}>
                        ${[85, 120, 35][i]}
                      </span>
                      <span
                        className="text-[10px] text-white px-2.5 py-1 font-medium"
                        style={{ backgroundColor: theme.primaryColor, borderRadius: radius }}
                      >
                        Agregar
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
