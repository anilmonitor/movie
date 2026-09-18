import React from 'react';
import Link from 'next/link';
import { Film, Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="py-16 sm:py-24 text-center glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 max-w-lg mx-auto space-y-5 sm:space-y-6 border border-slate-200 dark:border-white/10 shadow-2xl">
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-red-600/10 text-red-500 mx-auto flex items-center justify-center">
        <Film className="w-7 h-7 sm:w-8 sm:h-8" />
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">404</h1>
        <h2 className="text-base sm:text-lg font-bold text-slate-700 dark:text-gray-200">Movie or Page Not Found</h2>
        <p className="text-xs text-slate-500 dark:text-gray-400">
          The requested movie or category might have been moved or is currently unavailable.
        </p>
      </div>

      <div className="flex items-center justify-center gap-3 pt-2">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-md transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>Return Home</span>
        </Link>

        <Link
          href="/search"
          className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-gray-200 font-semibold text-xs transition-colors border border-slate-200 dark:border-white/10"
        >
          <Search className="w-4 h-4" />
          <span>Search Cinema</span>
        </Link>
      </div>
    </div>
  );
}
