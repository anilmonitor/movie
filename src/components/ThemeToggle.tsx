'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from './ThemeProvider';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`w-9 h-9 rounded-full bg-black/5 dark:bg-white/5 animate-pulse ${className}`} />
    );
  }

  const isLight = theme === 'light';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center gap-2 p-2 rounded-full transition-all duration-300 ${
        isLight
          ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300/60 shadow-sm'
          : 'bg-gray-800/90 text-amber-300 hover:bg-gray-700 border border-white/10 shadow-inner'
      } ${className}`}
      title={`Switch to ${isLight ? 'Dark' : 'Light'} Mode`}
      aria-label={`Switch to ${isLight ? 'Dark' : 'Light'} Mode`}
      id="theme-toggle-btn"
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {isLight ? (
          <Sun className="w-5 h-5 text-amber-600 transition-transform duration-300 rotate-0 scale-100" />
        ) : (
          <Moon className="w-4 h-4 text-amber-300 transition-transform duration-300 -rotate-12 scale-100" />
        )}
      </div>

      {showLabel && (
        <span className="text-xs font-semibold pr-1">
          {isLight ? 'Light Mode' : 'Dark Mode'}
        </span>
      )}
    </button>
  );
}
