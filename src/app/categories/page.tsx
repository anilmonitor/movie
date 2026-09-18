import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getCategories } from '@/lib/api';
import { Layers, Film, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Movie Categories & Genres Directory - Movie Man',
  description: 'Explore all movie categories, regional cinema, dual audio, and web series genres available on Movie Man.',
};

export const revalidate = 3600;

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      <div className="p-5 sm:p-10 rounded-2xl sm:rounded-3xl glass-card border border-slate-200 dark:border-white/10 text-center space-y-3 shadow-xl">
        <h1 className="text-xl sm:text-4xl font-black text-slate-900 dark:text-white flex items-center justify-center gap-2">
          <Layers className="w-6 h-6 sm:w-7 sm:h-7 text-red-500" />
          <span>Movie Categories & Genres</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 max-w-lg mx-auto">
          Explore our vast library sorted by languages, industries, and formats.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/category/${cat.slug}`}
            className="p-3 sm:p-4 rounded-xl sm:rounded-2xl glass-card border border-slate-200 dark:border-white/10 hover:border-red-500/40 flex items-center justify-between group transition-all hover:-translate-y-1"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-red-600/10 text-red-500 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors shrink-0">
                <Film className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-gray-200 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors truncate">
                  {cat.name}
                </h3>
                {cat.count ? (
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-gray-400 mt-0.5">{cat.count} Movies</p>
                ) : null}
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-slate-400 dark:text-gray-500 group-hover:text-red-500 dark:group-hover:text-white transition-transform group-hover:translate-x-1 shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
