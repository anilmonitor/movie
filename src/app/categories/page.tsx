import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getCategories } from '@/lib/api';
import { Layers, Film, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Movie Categories & Genres Directory - Movies4u',
  description: 'Explore all movie categories, regional cinema, dual audio, and web series genres available on Movies4u.',
};

export const revalidate = 3600;

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="p-6 sm:p-10 rounded-3xl glass-card border border-white/10 text-center space-y-3 shadow-xl">
        <h1 className="text-2xl sm:text-4xl font-black text-white flex items-center justify-center gap-2">
          <Layers className="w-7 h-7 text-red-500" />
          <span>Movie Categories & Genres</span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 max-w-lg mx-auto">
          Explore our vast library sorted by languages, industries, and formats.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/category/${cat.slug}`}
            className="p-4 rounded-2xl glass-card border border-white/10 hover:border-red-500/40 flex items-center justify-between group transition-all hover:-translate-y-1"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600/10 text-red-500 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors">
                <Film className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-200 group-hover:text-red-400 transition-colors">
                  {cat.name}
                </h3>
                {cat.count ? (
                  <p className="text-xs text-gray-400 mt-0.5">{cat.count} Movies</p>
                ) : null}
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-transform group-hover:translate-x-1" />
          </Link>
        ))}
      </div>
    </div>
  );
}
