'use client';

import { create } from 'zustand';

interface ThemeStore {
  dark: boolean;
  toggle: () => void;
  setDark: (dark: boolean) => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  dark: false,
  toggle: () => set((state) => {
    const next = !state.dark;
    if (typeof window !== 'undefined') localStorage.setItem('menius-dark', next ? '1' : '0');
    return { dark: next };
  }),
  setDark: (dark: boolean) => set({ dark }),
}));
