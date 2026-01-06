import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Theme } from '../types';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Load from localStorage (per spec)
    const stored = localStorage.getItem('theme') as Theme | null;
    return stored || 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    // Resolve system theme
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  });

  useEffect(() => {
    const root = document.documentElement;
    
    const applyTheme = (resolved: 'light' | 'dark') => {
      if (resolved === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      setResolvedTheme(resolved);
    };

    if (theme === 'system') {
      // Listen for system preference changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? 'dark' : 'light');
      };
      
      applyTheme(mediaQuery.matches ? 'dark' : 'light');
      mediaQuery.addEventListener('change', handler);
      
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      applyTheme(theme);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    // Store in localStorage (per spec: localStorage.setItem('theme', ...))
    if (newTheme === 'system') {
      localStorage.removeItem('theme');
    } else {
      localStorage.setItem('theme', newTheme);
    }
  };

  const toggleTheme = () => {
    // Simple toggle between light and dark
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    console.log('[ThemeContext] Toggling theme from', resolvedTheme, 'to', newTheme);
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
