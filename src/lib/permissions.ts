/**
 * Staff Permission System
 * Defines granular permissions for restaurant staff roles
 */

export interface PermissionSet {
  view: boolean;
  manage: boolean;
}

export interface StaffPermissions {
  orders: PermissionSet;
  menu: PermissionSet;
  inventory: PermissionSet;
  analytics: PermissionSet;
  staff: PermissionSet;
  settings: PermissionSet;
  billing: PermissionSet;
  promotions: PermissionSet;
  reviews: PermissionSet;
  customers: PermissionSet;
  reservations: PermissionSet;
  kitchen: PermissionSet;
}

export type PermissionModule = keyof StaffPermissions;

export const PERMISSION_MODULES: { key: PermissionModule; label: string; description: string }[] = [
  { key: 'orders', label: 'Órdenes', description: 'Ver y gestionar pedidos' },
  { key: 'kitchen', label: 'Cocina (KDS)', description: 'Ver y actualizar estados en cocina' },
  { key: 'menu', label: 'Menú', description: 'Gestionar categorías y productos' },
  { key: 'inventory', label: 'Inventario', description: 'Controlar stock de productos' },
  { key: 'reservations', label: 'Reservaciones', description: 'Gestionar reservas de mesas' },
  { key: 'customers', label: 'Clientes', description: 'Ver información de clientes' },
  { key: 'reviews', label: 'Reseñas', description: 'Gestionar reseñas de clientes' },
  { key: 'promotions', label: 'Promociones', description: 'Crear y gestionar descuentos' },
  { key: 'analytics', label: 'Analytics', description: 'Ver reportes y métricas' },
  { key: 'staff', label: 'Equipo', description: 'Gestionar miembros del equipo' },
  { key: 'settings', label: 'Configuración', description: 'Cambiar ajustes del restaurante' },
  { key: 'billing', label: 'Facturación', description: 'Ver plan y facturación' },
];

export const ROLE_PRESETS: Record<string, StaffPermissions> = {
  staff: {
    orders: { view: true, manage: true },
    kitchen: { view: true, manage: true },
    menu: { view: true, manage: false },
    inventory: { view: true, manage: false },
    analytics: { view: false, manage: false },
    staff: { view: false, manage: false },
    settings: { view: false, manage: false },
    billing: { view: false, manage: false },
    promotions: { view: true, manage: false },
    reviews: { view: true, manage: false },
    customers: { view: true, manage: false },
    reservations: { view: true, manage: true },
  },
  manager: {
    orders: { view: true, manage: true },
    kitchen: { view: true, manage: true },
    menu: { view: true, manage: true },
    inventory: { view: true, manage: true },
    analytics: { view: true, manage: false },
    staff: { view: true, manage: false },
    settings: { view: true, manage: false },
    billing: { view: true, manage: false },
    promotions: { view: true, manage: true },
    reviews: { view: true, manage: true },
    customers: { view: true, manage: true },
    reservations: { view: true, manage: true },
  },
  owner: {
    orders: { view: true, manage: true },
    kitchen: { view: true, manage: true },
    menu: { view: true, manage: true },
    inventory: { view: true, manage: true },
    analytics: { view: true, manage: true },
    staff: { view: true, manage: true },
    settings: { view: true, manage: true },
    billing: { view: true, manage: true },
    promotions: { view: true, manage: true },
    reviews: { view: true, manage: true },
    customers: { view: true, manage: true },
    reservations: { view: true, manage: true },
  },
};

export function getDefaultPermissions(role: string): StaffPermissions {
  return ROLE_PRESETS[role] ?? ROLE_PRESETS.staff;
}
