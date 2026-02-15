'use client';

import { useState, useEffect } from 'react';
import {
  CreditCard, Check, Zap, Shield, Crown, Star,
  ArrowRight, AlertTriangle, BarChart3, Users, Package, Tag,
} from 'lucide-react';
import { PLANS, type PlanConfig } from '@/lib/plans';
import { cn } from '@/lib/utils';
import type { SubscriptionPlan } from '@/types';

interface UsageData {
  plan: SubscriptionPlan;
  plan_name: string;
  trial_ends_at: string | null;
  limits: PlanConfig['limits'];
  usage: {
    products: number;
    categories: number;
    orders_per_month: number;
    staff_members: number;
    promotions: number;
  };
  features: string[];
}

const PLAN_ICONS: Record<string, typeof Zap> = {
  basic: Zap,
  pro: Star,
  premium: Crown,
  enterprise: Shield,
  trial: Star,
};

export function BillingDashboard() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  useEffect(() => {
    fetch('/api/tenant/usage')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-32 bg-white rounded-2xl border border-gray-100" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-64 bg-white rounded-2xl border border-gray-100" />)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const trialDaysLeft = data.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(data.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const usageItems = [
    { label: 'Productos', icon: Package, used: data.usage.products, max: data.limits.products, key: 'products' },
    { label: 'Categorías', icon: Tag, used: data.usage.categories, max: data.limits.categories, key: 'categories' },
    { label: 'Órdenes/mes', icon: BarChart3, used: data.usage.orders_per_month, max: data.limits.orders_per_month, key: 'orders' },
    { label: 'Staff', icon: Users, used: data.usage.staff_members, max: data.limits.staff_members, key: 'staff' },
  ];

  return (
    <div className="space-y-8">
      {/* Current plan card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-brand-600 to-brand-700 text-white px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/70 font-medium">Plan actual</p>
              <h2 className="text-2xl font-bold mt-0.5">{data.plan_name}</h2>
            </div>
            {data.plan === 'trial' && (
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
                <p className="text-2xl font-bold">{trialDaysLeft}</p>
                <p className="text-[10px] uppercase tracking-wider">días restantes</p>
              </div>
            )}
          </div>
        </div>

        {/* Usage meters */}
        <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {usageItems.map(item => {
            const pct = item.max > 99999 ? 0 : Math.min(100, (item.used / item.max) * 100);
            const isNearLimit = pct > 80;
            const Icon = item.icon;
            return (
              <div key={item.key} className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-500 font-medium">{item.label}</span>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {item.used}
                  <span className="text-sm font-normal text-gray-400">
                    /{item.max > 99999 ? '∞' : item.max}
                  </span>
                </p>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      isNearLimit ? 'bg-amber-500' : 'bg-brand-500'
                    )}
                    style={{ width: `${item.max > 99999 ? 5 : pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {data.plan === 'trial' && trialDaysLeft <= 7 && (
          <div className="px-6 pb-5">
            <div className="flex items-center gap-2 bg-amber-50 text-amber-800 rounded-xl px-4 py-3 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <p>
                Tu trial expira en {trialDaysLeft} días.
                <strong className="ml-1">Elige un plan para no perder acceso.</strong>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Billing cycle toggle */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setBillingCycle('monthly')}
          className={cn(
            'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
            billingCycle === 'monthly' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          Mensual
        </button>
        <button
          onClick={() => setBillingCycle('annual')}
          className={cn(
            'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
            billingCycle === 'annual' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          Anual <span className="text-emerald-500 font-bold ml-1">-20%</span>
        </button>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map(plan => {
          const Icon = PLAN_ICONS[plan.id] ?? Zap;
          const isCurrent = data.plan === plan.id || (data.plan === 'trial' && plan.id === 'pro');
          const monthlyPrice = billingCycle === 'annual' ? Math.round(plan.price * 0.8) : plan.price;

          return (
            <div
              key={plan.id}
              className={cn(
                'bg-white rounded-2xl border shadow-sm p-5 flex flex-col transition-all relative',
                plan.popular ? 'border-brand-300 ring-2 ring-brand-100' : 'border-gray-200',
                isCurrent && 'border-emerald-300 ring-2 ring-emerald-100'
              )}
            >
              {plan.popular && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-brand-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
                  Popular
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
                  Tu plan
                </div>
              )}

              <div className="flex items-center gap-2 mb-3">
                <div className={cn(
                  'w-8 h-8 rounded-xl flex items-center justify-center',
                  plan.popular ? 'bg-brand-50' : 'bg-gray-50'
                )}>
                  <Icon className={cn('w-4 h-4', plan.popular ? 'text-brand-600' : 'text-gray-500')} />
                </div>
                <h3 className="font-bold text-gray-900">{plan.name}</h3>
              </div>

              <p className="text-xs text-gray-500 mb-4">{plan.description}</p>

              <div className="mb-5">
                {plan.price > 0 ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-gray-900">${monthlyPrice}</span>
                    <span className="text-sm text-gray-400">/mes</span>
                  </div>
                ) : (
                  <span className="text-lg font-bold text-gray-900">Contactar</span>
                )}
              </div>

              <ul className="space-y-2 flex-1 mb-5">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                    <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                disabled={isCurrent}
                className={cn(
                  'w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2',
                  isCurrent
                    ? 'bg-emerald-50 text-emerald-700 cursor-default'
                    : plan.popular
                      ? 'bg-brand-600 text-white hover:bg-brand-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {isCurrent ? (
                  <><Check className="w-4 h-4" /> Plan actual</>
                ) : plan.price === 0 ? (
                  'Contactar ventas'
                ) : (
                  <><CreditCard className="w-4 h-4" /> Elegir plan</>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Payment info placeholder */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Método de pago</h3>
            <p className="text-xs text-gray-400">Gestiona tu forma de pago</p>
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 text-center text-sm text-gray-400">
          <p>La integración con Stripe se activará próximamente.</p>
          <p className="text-xs mt-1">Podrás gestionar tu suscripción, tarjetas y facturas aquí.</p>
        </div>
      </div>
    </div>
  );
}
