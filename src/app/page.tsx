import React from 'react';
import Link from 'next/link';
import { getMovies, getCategories } from '@/lib/api';
import MovieListClient from '@/components/MovieListClient';
import { Flame, Film, ShieldCheck } from 'lucide-react';

interface HomePageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export const revalidate = 120; // 2 minutes

export default async function HomePage(props: HomePageProps) {
  const searchParams = await props.searchParams;
  const page = parseInt(searchParams.page || '1', 10);

  const [movieData, categories] = await Promise.all([
    getMovies({ page, perPage: 18 }),
    getCategories(),
  ]);

  const { movies, totalPages, totalMovies } = movieData;

  const popularSlugs = ['bollywood', 'hollywood', 'dual-audio', 'web-series', 'south-indian', 'hindi', 'korean'];
  const popularCategories = categories.filter((c) => popularSlugs.includes(c.slug));

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Category Pills / Filters Bar (Mobile Touch Friendly Scroll) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
        <Link
          href="/"
          className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full text-xs font-bold bg-red-600 text-white shadow-md shadow-red-600/30 shrink-0"
        >
          <Flame className="w-3.5 h-3.5" />
          <span>All Latest</span>
        </Link>

        {popularCategories.map((cat) => (
          <Link
            key={cat.id}
            href={`/category/${cat.slug}`}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-xs font-semibold bg-slate-100 dark:bg-gray-900/80 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10 transition-colors shrink-0"
          >
            {cat.name}
            {cat.count ? (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-gray-400">
                {cat.count}
              </span>
            ) : null}
          </Link>
        ))}

        <Link
          href="/categories"
          className="px-3.5 sm:px-4 py-2 rounded-full text-xs font-semibold bg-red-50 dark:bg-white/5 hover:bg-red-100 dark:hover:bg-white/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 transition-colors shrink-0"
        >
          More Genres +
        </Link>
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3 sm:pb-4">
        <div>
          <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Film className="w-5 h-5 text-red-600 dark:text-red-500" />
            <span>Latest Movies & Web Series</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
            Real-time updates directly from movies4u
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-3 py-1 rounded-full font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Fast Direct Links</span>
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
