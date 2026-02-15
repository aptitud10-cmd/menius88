'use client';

import { useState } from 'react';
import { Clock, X, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface TrialBannerProps {
  trialEndsAt: string | null;
  plan: string;
}

export function TrialBanner({ trialEndsAt, plan }: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  // Only show for trial plans
  if (plan !== 'trial' || dismissed) return null;

  const now = new Date();
  const endDate = trialEndsAt ? new Date(trialEndsAt) : new Date(now.getTime() + 13 * 24 * 60 * 60 * 1000);
  const diffMs = endDate.getTime() - now.getTime();
  const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const isUrgent = daysLeft <= 3;
  const isExpired = daysLeft === 0;

  if (isExpired) {
    return (
      <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <Clock className="w-4 h-4 text-red-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-red-800">Tu periodo de prueba ha terminado</p>
          <p className="text-xs text-red-600 mt-0.5">Elige un plan para seguir usando MENIUS</p>
        </div>
        <Link
          href="/app/settings/billing"
          className="px-4 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors flex-shrink-0"
        >
          Ver planes
        </Link>
      </div>
    );
  }

  return (
    <div className={`mb-4 rounded-xl border px-4 py-3 flex items-center gap-3 ${
      isUrgent 
        ? 'bg-amber-50 border-amber-200' 
        : 'bg-brand-50 border-brand-200'
    }`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUrgent ? 'bg-amber-100' : 'bg-brand-100'
      }`}>
        {isUrgent ? (
          <Clock className="w-4 h-4 text-amber-600" />
        ) : (
          <Sparkles className="w-4 h-4 text-brand-600" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${isUrgent ? 'text-amber-800' : 'text-brand-800'}`}>
          {isUrgent 
            ? `¡Solo ${daysLeft} día${daysLeft === 1 ? '' : 's'} de prueba!`
            : `${daysLeft} días restantes de tu prueba gratuita`
          }
        </p>
        <p className={`text-xs mt-0.5 ${isUrgent ? 'text-amber-600' : 'text-brand-600'}`}>
          {isUrgent
            ? 'Elige un plan para no perder tu configuración'
            : 'Configura tu menú y empieza a recibir pedidos'
          }
        </p>
      </div>
      <Link
        href="/app/settings/billing"
        className={`px-4 py-1.5 rounded-lg text-white text-xs font-semibold transition-colors flex-shrink-0 ${
          isUrgent 
            ? 'bg-amber-600 hover:bg-amber-700' 
            : 'bg-brand-600 hover:bg-brand-700'
        }`}
      >
        Ver planes
      </Link>
      <button
        onClick={() => setDismissed(true)}
        className="p-1 rounded-lg hover:bg-black/5 flex-shrink-0"
      >
        <X className="w-3.5 h-3.5 text-gray-400" />
      </button>
    </div>
  );
}
