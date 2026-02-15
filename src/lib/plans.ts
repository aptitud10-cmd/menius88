import type { SubscriptionPlan } from '@/types';

export interface PlanConfig {
  id: SubscriptionPlan;
  name: string;
  price: number;  // monthly USD
  description: string;
  features: string[];
  limits: {
    products: number;
    categories: number;
    orders_per_month: number;
    staff_members: number;
    promotions: number;
    integrations: number;
    analytics: boolean;
    custom_theme: boolean;
    delivery: boolean;
    reviews_visible: boolean;
    csv_export: boolean;
    priority_support: boolean;
    custom_domain: boolean;
    api_access: boolean;
    white_label: boolean;
  };
  popular?: boolean;
}

export const PLANS: PlanConfig[] = [
  {
    id: 'basic',
    name: 'Básico',
    price: 19,
    description: 'Para restaurantes pequeños que inician',
    features: [
      'Hasta 30 productos',
      '5 categorías',
      '200 órdenes/mes',
      'Menú público con QR',
      'Gestión de órdenes',
      'Soporte por email',
    ],
    limits: {
      products: 30,
      categories: 5,
      orders_per_month: 200,
      staff_members: 1,
      promotions: 3,
      integrations: 0,
      analytics: false,
      custom_theme: false,
      delivery: false,
      reviews_visible: true,
      csv_export: false,
      priority_support: false,
      custom_domain: false,
      api_access: false,
      white_label: false,
    },
  },
  {
    id: 'pro',
    name: 'Profesional',
    price: 49,
    description: 'Para restaurantes en crecimiento',
    features: [
      'Hasta 100 productos',
      '15 categorías',
      '1,000 órdenes/mes',
      'Todo lo de Básico +',
      'Analytics completo',
      'Tema personalizado',
      'Delivery habilitado',
      '3 miembros de equipo',
      '10 promociones',
      'Exportar CSV',
      'Soporte prioritario',
    ],
    limits: {
      products: 100,
      categories: 15,
      orders_per_month: 1000,
      staff_members: 3,
      promotions: 10,
      integrations: 1,
      analytics: true,
      custom_theme: true,
      delivery: true,
      reviews_visible: true,
      csv_export: true,
      priority_support: true,
      custom_domain: false,
      api_access: false,
      white_label: false,
    },
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 99,
    description: 'Para restaurantes establecidos',
    features: [
      'Productos ilimitados',
      'Categorías ilimitadas',
      'Órdenes ilimitadas',
      'Todo lo de Profesional +',
      'Equipo ilimitado',
      'Promociones ilimitadas',
      'Integraciones POS',
      'Dominio personalizado',
      'Acceso API',
      'Soporte dedicado 24/7',
    ],
    limits: {
      products: 999999,
      categories: 999999,
      orders_per_month: 999999,
      staff_members: 999999,
      promotions: 999999,
      integrations: 5,
      analytics: true,
      custom_theme: true,
      delivery: true,
      reviews_visible: true,
      csv_export: true,
      priority_support: true,
      custom_domain: true,
      api_access: true,
      white_label: false,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 0, // Custom pricing
    description: 'Para cadenas y franquicias',
    features: [
      'Todo ilimitado',
      'Todo lo de Premium +',
      'White label completo',
      'Multi-sucursal',
      'API dedicada',
      'SLA garantizado',
      'Onboarding personalizado',
      'Account manager',
    ],
    limits: {
      products: 999999,
      categories: 999999,
      orders_per_month: 999999,
      staff_members: 999999,
      promotions: 999999,
      integrations: 999999,
      analytics: true,
      custom_theme: true,
      delivery: true,
      reviews_visible: true,
      csv_export: true,
      priority_support: true,
      custom_domain: true,
      api_access: true,
      white_label: true,
    },
  },
];

export const TRIAL_LIMITS = PLANS.find(p => p.id === 'pro')!.limits; // Trial gets Pro features

export function getPlanConfig(plan: SubscriptionPlan): PlanConfig {
  if (plan === 'trial') return { ...PLANS.find(p => p.id === 'pro')!, id: 'trial', name: 'Trial', price: 0 };
  if (plan === 'cancelled') return PLANS[0]; // Fallback to basic limits
  return PLANS.find(p => p.id === plan) ?? PLANS[0];
}

export function getPlanLimits(plan: SubscriptionPlan) {
  return getPlanConfig(plan).limits;
}

export function canAccessFeature(plan: SubscriptionPlan, feature: keyof PlanConfig['limits']): boolean {
  const limits = getPlanLimits(plan);
  const value = limits[feature];
  if (typeof value === 'boolean') return value;
  return true; // numeric limits are checked separately
}

export function isWithinLimit(plan: SubscriptionPlan, feature: keyof PlanConfig['limits'], currentCount: number): boolean {
  const limits = getPlanLimits(plan);
  const max = limits[feature];
  if (typeof max === 'boolean') return max;
  return currentCount < max;
}
