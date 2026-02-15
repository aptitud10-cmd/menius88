'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/store/themeStore';
import { cn } from '@/lib/utils';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { dark, setDark } = useThemeStore();

  useEffect(() => {
    const saved = localStorage.getItem('menius-dark');
    if (saved === '1') setDark(true);
  }, [setDark]);

  return (
    <div className={cn(dark && 'dark')}>
      {children}
    </div>
  );
}
