import React from 'react';
import Link from 'next/link';
import { getMovies, getCategories } from '@/lib/api';
import MovieListClient from '@/components/MovieListClient';
import { Flame, Film } from 'lucide-react';

interface HomePageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export const revalidate = 120; // 2 minutes

export default async function HomePage(props: HomePageProps) {
  const searchParams = await props.searchParams;
  const page = parseInt(searchParams.page || '1', 10);

  const [moviesData, categories] = await Promise.all([
    getMovies({ page, perPage: 18 }),
    getCategories(),
  ]);

  const { movies, totalPages, totalMovies } = moviesData;

  const topCategories = categories
    .filter((c) => c.slug !== 'uncategorized' && c.name.toLowerCase() !== 'uncategorized')
    .slice(0, 10);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Category Pills Slider */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold scrollbar-none">
        <Link
          href="/"
          className="px-3.5 sm:px-4 py-2 rounded-full bg-red-600 text-white shadow-sm shadow-red-600/30 shrink-0 flex items-center gap-1.5 font-bold"
        >
          <Flame className="w-3.5 h-3.5" />
          <span>All Releases</span>
        </Link>

        {topCategories.map((cat) => (
          <Link
            key={cat.id}
            href={`/category/${cat.slug}`}
            className="px-3.5 sm:px-4 py-2 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-gray-300 transition-colors border border-slate-200 dark:border-white/5 shrink-0 flex items-center gap-1.5"
          >
            <span>{cat.name}</span>
            {cat.count ? (
              <span className="text-[10px] text-slate-400 dark:text-gray-500 bg-slate-200 dark:bg-black/30 px-1.5 py-0.5 rounded-full">
                {cat.count}
              </span>
            ) : null}
          </Link>
        ))}
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3 sm:pb-4">
        <div>
          <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Film className="w-5 h-5 text-red-600 dark:text-red-500" />
            <span>Latest Movies & Web Series</span>
          </h1>
        </div>
      </div>

      {/* Hybrid Client/Server Movie List */}
      <MovieListClient
        initialMovies={movies}
        initialTotalPages={totalPages}
        initialTotalMovies={totalMovies}
        page={page}
        basePath="/"
      />
    </div>
  );
}
