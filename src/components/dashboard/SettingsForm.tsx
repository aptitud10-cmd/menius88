'use client';

import { useState } from 'react';
import {
  Store, Globe, MapPin, Phone, Clock,
  Palette, Save, Loader2, ExternalLink,
  CreditCard, ChefHat, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Restaurant } from '@/types';

interface SettingsFormProps {
  restaurant: Restaurant;
  userEmail: string;
  userName: string;
}

const TABS = [
  { id: 'general', label: 'General', icon: Store },
  { id: 'hours', label: 'Horarios', icon: Clock },
  { id: 'orders', label: 'Pedidos', icon: ChefHat },
  { id: 'reports', label: 'Reportes', icon: Sparkles },
  { id: 'billing', label: 'Suscripción', icon: CreditCard },
] as const;

const DAYS = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
];

export function SettingsForm({ restaurant, userEmail, userName }: SettingsFormProps) {
  const [activeTab, setActiveTab] = useState<string>('general');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // General fields
  const [name, setName] = useState(restaurant.name);
  const [tagline, setTagline] = useState(restaurant.tagline ?? '');
  const [description, setDescription] = useState(restaurant.description ?? '');
  const [address, setAddress] = useState(restaurant.address ?? '');
  const [phone, setPhone] = useState(restaurant.phone ?? '');
  const [cuisineType, setCuisineType] = useState(restaurant.cuisine_type ?? '');

  // Hours
  const defaultHours = DAYS.map(d => ({
    day: d.key,
    open: '09:00',
    close: '22:00',
    closed: false,
  }));
  const [hours, setHours] = useState(
    (restaurant.operating_hours as typeof defaultHours) ?? defaultHours
  );

  // Order config
  const defaultOrderConfig = {
    deliveryEnabled: false,
    pickupEnabled: true,
    dineInEnabled: true,
    deliveryFee: 0,
    deliveryMinOrder: 0,
    estimatedPrepTime: 20,
    autoAcceptOrders: false,
    taxRate: 0.16,
  };
  const [orderConfig, setOrderConfig] = useState(
    (restaurant.order_config as typeof defaultOrderConfig) ?? defaultOrderConfig
  );

  const updateHour = (index: number, field: string, value: string | boolean) => {
    setHours(prev => prev.map((h, i) => i === index ? { ...h, [field]: value } : h));
  };

  const updateOrderConfig = (field: string, value: unknown) => {
    setOrderConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch('/api/tenant/restaurant', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          tagline,
          description,
          address,
          phone,
          cuisine_type: cuisineType,
          operating_hours: hours,
          order_config: orderConfig,
        }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  // Trial/subscription info
  const plan = restaurant.subscription_plan ?? 'trial';
  const trialEnds = restaurant.trial_ends_at ? new Date(restaurant.trial_ends_at) : null;
  const daysLeft = trialEnds ? Math.max(0, Math.ceil((trialEnds.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 13;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-1 justify-center',
              activeTab === tab.id
                ? 'bg-brand-50 text-brand-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            )}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        {/* GENERAL TAB */}
        {activeTab === 'general' && (
          <div className="p-6 space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Información general</h3>
              <p className="text-sm text-gray-500 mt-0.5">Datos básicos de tu restaurante</p>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Eslogan</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={e => setTagline(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  placeholder="Los mejores tacos de la ciudad"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL del menú</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-500">
                    menius.app/r/<strong className="text-gray-700">{restaurant.slug}</strong>
                  </div>
                  <a
                    href={`/r/${restaurant.slug}`}
                    target="_blank"
                    className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-gray-500" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HOURS TAB */}
        {activeTab === 'hours' && (
          <div className="p-6 space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Horarios de operación</h3>
              <p className="text-sm text-gray-500 mt-0.5">Define cuándo tu restaurante está abierto</p>
            </div>

            <div className="space-y-2">
              {hours.map((h, i) => {
                const dayLabel = DAYS.find(d => d.key === h.day)?.label ?? h.day;
                return (
                  <div key={h.day} className="flex items-center gap-3 py-2">
                    <span className="w-24 text-sm font-medium text-gray-700">{dayLabel}</span>
                    <button
                      type="button"
                      onClick={() => updateHour(i, 'closed', !h.closed)}
                      className={cn(
                        'w-14 text-xs py-1.5 rounded-lg font-medium transition-all',
                        h.closed
                          ? 'bg-gray-100 text-gray-400'
                          : 'bg-green-50 text-green-700'
                      )}
                    >
                      {h.closed ? 'Cerrado' : 'Abierto'}
                    </button>
                    {!h.closed && (
                      <>
                        <input
                          type="time"
                          value={h.open}
                          onChange={(e) => updateHour(i, 'open', e.target.value)}
                          className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500/30"
                        />
                        <span className="text-gray-400 text-sm">—</span>
                        <input
                          type="time"
                          value={h.close}
                          onChange={(e) => updateHour(i, 'close', e.target.value)}
                          className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500/30"
                        />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="p-6 space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Configuración de pedidos</h3>
              <p className="text-sm text-gray-500 mt-0.5">Tipos de pedido y opciones de entrega</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'dineInEnabled', label: 'En mesa', emoji: '🍽️' },
                { key: 'pickupEnabled', label: 'Para llevar', emoji: '🥡' },
                { key: 'deliveryEnabled', label: 'Delivery', emoji: '🛵' },
              ].map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => updateOrderConfig(opt.key, !(orderConfig as Record<string, unknown>)[opt.key])}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all',
                    (orderConfig as Record<string, unknown>)[opt.key]
                      ? 'border-brand-600 bg-brand-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className={cn(
                    'text-sm font-medium',
                    (orderConfig as Record<string, unknown>)[opt.key] ? 'text-brand-700' : 'text-gray-500'
                  )}>{opt.label}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiempo de preparación (min)
                </label>
                <input
                  type="number"
                  value={orderConfig.estimatedPrepTime}
                  onChange={e => updateOrderConfig('estimatedPrepTime', parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tasa de impuesto (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={(orderConfig.taxRate * 100).toFixed(0)}
                  onChange={e => updateOrderConfig('taxRate', (parseFloat(e.target.value) || 0) / 100)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>
            </div>

            {orderConfig.deliveryEnabled && (
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Costo de envío</label>
                  <input
                    type="number"
                    step="0.01"
                    value={orderConfig.deliveryFee}
                    onChange={e => updateOrderConfig('deliveryFee', parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pedido mínimo</label>
                  <input
                    type="number"
                    step="0.01"
                    value={orderConfig.deliveryMinOrder}
                    onChange={e => updateOrderConfig('deliveryMinOrder', parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 bg-white"
                  />
                </div>
              </div>
            )}

            <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={orderConfig.autoAcceptOrders}
                onChange={e => updateOrderConfig('autoAcceptOrders', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <div>
                <p className="text-sm font-medium text-gray-700">Aceptar pedidos automáticamente</p>
                <p className="text-xs text-gray-400">Los pedidos se confirman sin intervención manual</p>
              </div>
            </label>
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === 'reports' && (
          <div className="p-6 space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reportes automáticos</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Recibe un resumen semanal por email</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Reporte semanal</p>
                  <p className="text-xs text-gray-400 mt-0.5">Resumen de ventas, productos top y métricas clave</p>
                </div>
                <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                  Próximamente
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Vista previa</p>
              <a
                href="/api/tenant/reports/weekly"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Ver reporte de esta semana
              </a>
              <p className="text-[10px] text-gray-400 mt-2">Abre el reporte en una nueva pestaña con los datos de los últimos 7 días</p>
            </div>
          </div>
        )}

        {/* BILLING TAB */}
        {activeTab === 'billing' && (
          <div className="p-6 space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Tu suscripción</h3>
              <p className="text-sm text-gray-500 mt-0.5">Gestiona tu plan y facturación</p>
            </div>

            {/* Current plan card */}
            <div className="rounded-xl border-2 border-brand-200 bg-brand-50/50 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 capitalize">Plan {plan}</p>
                  {plan === 'trial' && (
                    <p className="text-xs text-brand-600">{daysLeft} días restantes</p>
                  )}
                </div>
              </div>

              {plan === 'trial' && (
                <div className="mb-3">
                  <div className="w-full h-2 rounded-full bg-brand-100">
                    <div
                      className="h-2 rounded-full bg-brand-600 transition-all"
                      style={{ width: `${Math.max(5, ((13 - daysLeft) / 13) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {daysLeft > 0
                      ? `Tu trial termina el ${trialEnds?.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' }) ?? 'pronto'}`
                      : 'Tu periodo de prueba ha terminado'
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Pricing cards */}
            <div className="grid gap-3">
              {[
                {
                  name: 'Básico',
                  price: '$299',
                  period: '/mes',
                  features: ['1 restaurante', 'Menú digital', 'Pedidos en mesa', 'Soporte por email'],
                  popular: false,
                },
                {
                  name: 'Pro',
                  price: '$599',
                  period: '/mes',
                  features: ['Todo de Básico', 'Delivery y pickup', 'Analytics', 'Integraciones POS', 'Soporte prioritario'],
                  popular: true,
                },
                {
                  name: 'Premium',
                  price: '$999',
                  period: '/mes',
                  features: ['Todo de Pro', 'Multi-sucursal', 'API acceso completo', 'Chatbot WhatsApp', 'Gerente de cuenta'],
                  popular: false,
                },
              ].map(tier => (
                <div
                  key={tier.name}
                  className={cn(
                    'rounded-xl border p-4 flex items-center gap-4 transition-all',
                    tier.popular
                      ? 'border-brand-600 bg-brand-50/30 ring-1 ring-brand-600/20'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{tier.name}</p>
                      {tier.popular && (
                        <span className="px-2 py-0.5 rounded-full bg-brand-600 text-white text-[10px] font-bold">
                          POPULAR
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {tier.features.slice(0, 3).join(' · ')}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-gray-900">{tier.price}<span className="text-xs text-gray-400 font-normal">{tier.period}</span></p>
                  </div>
                  <button
                    className={cn(
                      'px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex-shrink-0',
                      tier.popular
                        ? 'bg-brand-600 text-white hover:bg-brand-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    Elegir
                  </button>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-400 text-center">
              Todos los precios en MXN. Cancelar cuando quieras. Stripe Connect se activa con plan Pro+.
            </p>
          </div>
        )}

        {/* Save button (for non-billing tabs) */}
        {activeTab !== 'billing' && (
          <div className="px-6 pb-6 pt-2 border-t border-gray-100">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saved ? (
                <Save className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar cambios'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
