'use client';

import { useState } from 'react';
import { createRestaurant } from '@/lib/actions/restaurant';
import { slugify } from '@/lib/utils';
import {
  ChefHat, Palette, Clock, Rocket,
  ArrowRight, ArrowLeft, Check, Loader2,
  Store, Globe, MapPin, Phone,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================
// STEP DEFINITIONS
// ============================================================

const STEPS = [
  { id: 'basics', label: 'Tu restaurante', icon: Store },
  { id: 'details', label: 'Detalles', icon: MapPin },
  { id: 'hours', label: 'Horarios', icon: Clock },
  { id: 'ready', label: 'Listo', icon: Rocket },
] as const;

const CUISINE_TYPES = [
  'Mexicana', 'Italiana', 'Japonesa', 'China', 'Americana',
  'Mariscos', 'Tacos', 'Pizza', 'Hamburguesas', 'Sushi',
  'Cafetería', 'Panadería', 'Comida rápida', 'Saludable', 'Otra',
];

const DAYS = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
];

interface HourSchedule {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export default function CreateRestaurantPage() {
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1: Basics
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [cuisineType, setCuisineType] = useState('');

  // Step 2: Details
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');

  // Step 3: Hours
  const [hours, setHours] = useState<HourSchedule[]>(
    DAYS.map(d => ({
      day: d.key,
      open: '09:00',
      close: '22:00',
      closed: d.key === 'sunday',
    }))
  );
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [pickupEnabled, setPickupEnabled] = useState(true);
  const [dineInEnabled, setDineInEnabled] = useState(true);

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(slugify(val));
  };

  const updateHour = (index: number, field: keyof HourSchedule, value: string | boolean) => {
    setHours(prev => prev.map((h, i) => i === index ? { ...h, [field]: value } : h));
  };

  const canProceed = () => {
    switch (step) {
      case 0: return name.trim().length >= 2 && slug.trim().length >= 2;
      case 1: return true; // Details are optional
      case 2: return true; // Hours have defaults
      case 3: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      setError('');
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
      setError('');
    }
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      const result = await createRestaurant({
        name,
        slug,
        timezone: 'America/Mexico_City',
        currency: 'MXN',
      });
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
    } catch (err: unknown) {
      const e = err as { digest?: string };
      if (e?.digest?.includes('NEXT_REDIRECT')) throw err;
      setError('Error inesperado. Intenta de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
            <span className="text-brand-600">MEN</span>IUS
          </span>
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <button
                onClick={() => i < step ? setStep(i) : undefined}
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all',
                  i < step
                    ? 'bg-brand-600 text-white cursor-pointer hover:bg-brand-700'
                    : i === step
                    ? 'bg-brand-600 text-white ring-4 ring-brand-100'
                    : 'bg-gray-100 text-gray-400'
                )}
              >
                {i < step ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
              </button>
              {i < STEPS.length - 1 && (
                <div className={cn(
                  'w-8 h-0.5 rounded-full transition-colors',
                  i < step ? 'bg-brand-600' : 'bg-gray-200'
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {error && (
            <div className="px-6 pt-4">
              <div className="px-3 py-2 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>
            </div>
          )}

          <div className="p-6">
            {/* STEP 0: Basics */}
            {step === 0 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Crea tu restaurante</h2>
                  <p className="text-sm text-gray-500 mt-1">Empecemos con lo básico. Puedes cambiar todo después.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nombre del restaurante *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                    placeholder="Mi Restaurante Favorito"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    URL de tu menú público
                  </label>
                  <div className="flex items-center rounded-xl border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-brand-500/30 focus-within:border-brand-500">
                    <span className="px-3 py-2.5 bg-gray-50 text-sm text-gray-400 border-r border-gray-200 whitespace-nowrap">
                      menius.app/r/
                    </span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                      placeholder="mi-restaurante"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de cocina
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CUISINE_TYPES.map(ct => (
                      <button
                        key={ct}
                        type="button"
                        onClick={() => setCuisineType(cuisineType === ct ? '' : ct)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                          cuisineType === ct
                            ? 'border-brand-600 bg-brand-50 text-brand-700'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        )}
                      >
                        {ct}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 1: Details */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Detalles de tu negocio</h2>
                  <p className="text-sm text-gray-500 mt-1">Información que verán tus clientes. Todo es opcional por ahora.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <MapPin className="w-3.5 h-3.5 inline mr-1" />
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                    placeholder="Calle, Colonia, Ciudad"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Phone className="w-3.5 h-3.5 inline mr-1" />
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                    placeholder="+52 55 1234 5678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Descripción corta
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 resize-none"
                    placeholder="Los mejores tacos de la ciudad desde 1985..."
                  />
                  <p className="text-xs text-gray-400 mt-1">{description.length}/200 caracteres</p>
                </div>
              </div>
            )}

            {/* STEP 2: Hours & Order Config */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Horarios y pedidos</h2>
                  <p className="text-sm text-gray-500 mt-1">Configura cuándo operas y qué tipo de pedidos aceptas.</p>
                </div>

                {/* Order types */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipos de pedido</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'dineIn', label: 'En mesa', emoji: '🍽️', active: dineInEnabled, toggle: setDineInEnabled },
                      { key: 'pickup', label: 'Para llevar', emoji: '🥡', active: pickupEnabled, toggle: setPickupEnabled },
                      { key: 'delivery', label: 'Delivery', emoji: '🛵', active: deliveryEnabled, toggle: setDeliveryEnabled },
                    ].map(opt => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => opt.toggle(!opt.active)}
                        className={cn(
                          'flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-center',
                          opt.active
                            ? 'border-brand-600 bg-brand-50'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <span className="text-xl">{opt.emoji}</span>
                        <span className={cn(
                          'text-xs font-medium',
                          opt.active ? 'text-brand-700' : 'text-gray-500'
                        )}>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hours */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Horarios de operación</label>
                  <div className="space-y-2">
                    {hours.map((h, i) => {
                      const dayLabel = DAYS.find(d => d.key === h.day)?.label ?? h.day;
                      return (
                        <div key={h.day} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateHour(i, 'closed', !h.closed)}
                            className={cn(
                              'w-20 text-xs font-medium py-1.5 px-2 rounded-lg text-left transition-colors',
                              h.closed ? 'text-gray-400' : 'text-gray-700'
                            )}
                          >
                            {dayLabel}
                          </button>
                          {h.closed ? (
                            <span className="text-xs text-gray-400 flex-1 text-center">Cerrado</span>
                          ) : (
                            <>
                              <input
                                type="time"
                                value={h.open}
                                onChange={(e) => updateHour(i, 'open', e.target.value)}
                                className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500/30"
                              />
                              <span className="text-gray-400 text-xs">a</span>
                              <input
                                type="time"
                                value={h.close}
                                onChange={(e) => updateHour(i, 'close', e.target.value)}
                                className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500/30"
                              />
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => updateHour(i, 'closed', !h.closed)}
                            className={cn(
                              'w-14 text-xs py-1.5 rounded-lg font-medium transition-all',
                              h.closed
                                ? 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                : 'bg-green-50 text-green-700 hover:bg-green-100'
                            )}
                          >
                            {h.closed ? 'Off' : 'On'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Ready */}
            {step === 3 && (
              <div className="space-y-6 text-center py-4">
                <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto">
                  <Rocket className="w-8 h-8 text-brand-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">¡Todo listo!</h2>
                  <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
                    Tu restaurante <strong className="text-gray-800">{name}</strong> está listo para lanzarse.
                    Tendrás <strong className="text-brand-600">13 días gratis</strong> para configurar todo.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 text-left space-y-3 max-w-xs mx-auto">
                  <div className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Menú público</p>
                      <p className="text-xs text-gray-400">menius.app/r/{slug}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Dashboard profesional</p>
                      <p className="text-xs text-gray-400">Gestión de menú, pedidos, mesas</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Códigos QR para mesas</p>
                      <p className="text-xs text-gray-400">Tus clientes ordenan desde su celular</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Soporte prioritario</p>
                      <p className="text-xs text-gray-400">Durante tu periodo de prueba</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className="px-6 pb-6 flex items-center gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Atrás
              </button>
            )}
            <div className="flex-1" />
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuar
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4" />
                    Lanzar mi restaurante
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Step indicator text */}
        <p className="text-center text-xs text-gray-400 mt-4">
          Paso {step + 1} de {STEPS.length} — {STEPS[step].label}
        </p>
      </div>
    </div>
  );
}
