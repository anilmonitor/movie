import React from 'react';

export default function Loading() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-pulse">
      {/* Featured Banner Skeleton */}
      <div className="w-full h-56 sm:h-80 rounded-2xl sm:rounded-3xl bg-slate-200/60 dark:bg-gray-900/60 border border-slate-200 dark:border-white/5" />

      {/* Filter pills skeleton */}
      <div className="flex gap-2 overflow-hidden py-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-8 w-20 sm:w-24 rounded-full bg-slate-200 dark:bg-gray-900/80 shrink-0" />
        ))}
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="rounded-xl overflow-hidden bg-slate-100 dark:bg-gray-900/70 border border-slate-200 dark:border-white/5 flex flex-col">
            <div className="aspect-[2/3] w-full bg-slate-200 dark:bg-gray-800/60" />
            <div className="p-2.5 sm:p-3 space-y-2">
              <div className="h-3.5 sm:h-4 bg-slate-200 dark:bg-gray-800/80 rounded w-3/4" />
              <div className="h-2.5 sm:h-3 bg-slate-200 dark:bg-gray-800/50 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
