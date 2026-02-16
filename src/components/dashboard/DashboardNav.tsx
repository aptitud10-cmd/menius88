'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ClipboardList, Tag, ShoppingBag, QrCode, Settings, LogOut, Menu, X, ExternalLink, BarChart3, Users, Percent, Star, CreditCard, ChefHat, Globe, Boxes, Palette, Heart, CalendarDays, Truck, UserCheck, ListOrdered, Receipt, Moon, Sun, Shield } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { logout } from '@/lib/actions/auth';
import { useThemeStore } from '@/store/themeStore';

const NAV_ITEMS = [
  { href: '/app', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/app/orders', label: 'Órdenes', icon: ClipboardList },
  { href: '/app/kitchen', label: 'Cocina (KDS)', icon: ChefHat },
  { href: '/app/menu/categories', label: 'Categorías', icon: Tag },
  { href: '/app/menu/products', label: 'Productos', icon: ShoppingBag },
  { href: '/app/tables', label: 'Mesas & QRs', icon: QrCode },
  { href: '/app/inventory', label: 'Inventario', icon: Boxes },
  { href: '/app/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/app/staff', label: 'Equipo', icon: Users },
  { href: '/app/promotions', label: 'Promociones', icon: Percent },
  { href: '/app/reviews', label: 'Reseñas', icon: Star },
  { href: '/app/translations', label: 'Idiomas', icon: Globe },
  { href: '/app/customers', label: 'Clientes', icon: UserCheck },
  { href: '/app/reservations', label: 'Reservaciones', icon: CalendarDays },
  { href: '/app/waitlist', label: 'Lista Espera', icon: ListOrdered },
  { href: '/app/expenses', label: 'Gastos', icon: Receipt },
  { href: '/app/delivery-zones', label: 'Zonas Delivery', icon: Truck },
  { href: '/app/theme', label: 'Tema', icon: Palette },
  { href: '/app/loyalty', label: 'Lealtad', icon: Heart },
  { href: '/app/billing', label: 'Facturación', icon: CreditCard },
  { href: '/app/audit', label: 'Auditoría', icon: Shield },
  { href: '/app/settings', label: 'Configuración', icon: Settings },
];

interface DashboardNavProps {
  slug: string;
  mobile?: boolean;
}

export function DashboardNav({ slug, mobile }: DashboardNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { dark, toggle } = useThemeStore();

  const navContent = (
    <>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              ((item as any).exact ? pathname === item.href : pathname.startsWith(item.href))
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-1">
        <button
          onClick={toggle}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors w-full text-left"
        >
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {dark ? 'Modo claro' : 'Modo oscuro'}
        </button>
        <Link
          href={`/r/${slug}`}
          target="_blank"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Ver menú público
        </Link>
        <button
          onClick={() => logout()}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 transition-colors w-full text-left"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </>
  );

  if (mobile) {
    return (
      <>
        <button onClick={() => setOpen(!open)} className="p-2 rounded-lg hover:bg-gray-100">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        {open && (
          <div className="absolute top-14 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 p-4 shadow-lg z-50">
            {navContent}
          </div>
        )}
      </>
    );
  }

  return navContent;
}
