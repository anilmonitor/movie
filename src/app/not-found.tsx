import React from 'react';
import Link from 'next/link';
import { Film, Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="py-24 text-center glass-card rounded-3xl p-8 max-w-lg mx-auto space-y-6 border border-white/10 shadow-2xl">
      <div className="w-16 h-16 rounded-2xl bg-red-600/10 text-red-500 mx-auto flex items-center justify-center">
        <Film className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h1 className="text-4xl font-black text-white">404</h1>
        <h2 className="text-lg font-bold text-gray-200">Movie or Page Not Found</h2>
        <p className="text-xs text-gray-400">
          The requested movie or category might have been moved or is currently unavailable.
        </p>
      </div>

      <div className="flex items-center justify-center gap-3 pt-2">
        <Link
          href="/"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-md transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>Return Home</span>
        </Link>

        <Link
          href="/search"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 font-semibold text-xs transition-colors"
        >
          <Search className="w-4 h-4" />
          <span>Search Cinema</span>
        </Link>
      </div>
    </div>
  );
}
