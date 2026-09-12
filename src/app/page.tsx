import React from 'react';
import Link from 'next/link';
import { getMovies, getCategories } from '@/lib/api';
import MovieCard from '@/components/MovieCard';
import Pagination from '@/components/Pagination';
import HeroFeatured from '@/components/HeroFeatured';
import { Sparkles, Flame, Film, Tv, ShieldCheck } from 'lucide-react';

interface HomePageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export const revalidate = 120; // Revalidate every 2 minutes for latest movies

export default async function HomePage(props: HomePageProps) {
  const searchParams = await props.searchParams;
  const page = parseInt(searchParams.page || '1', 10);

  const [movieData, categories] = await Promise.all([
    getMovies({ page, perPage: 18 }),
    getCategories(),
  ]);

  const { movies, totalPages, totalMovies } = movieData;
  const featuredMovie = page === 1 && movies.length > 0 ? movies[0] : null;
  const displayMovies = page === 1 ? movies.slice(1) : movies;

  // Top popular categories for quick filter chips
  const popularSlugs = ['bollywood', 'hollywood', 'dual-audio', 'web-series', 'south-indian', 'hindi', 'korean'];
  const popularCategories = categories.filter((c) => popularSlugs.includes(c.slug));

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Featured Hero Banner (Only on page 1) */}
      {featuredMovie && <HeroFeatured movie={featuredMovie} />}

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
            Showing page {page} of {totalPages || 1} • {totalMovies} Total Titles
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-3 py-1 rounded-full font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Fast Direct Links</span>
        </div>
      </div>

      {/* Movies Grid (Mobile: 2 cols, Tablet: 3-4 cols, Desktop: 6 cols) */}
      {displayMovies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-5">
          {displayMovies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center glass-card rounded-2xl p-6">
          <Tv className="w-12 h-12 text-slate-400 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-gray-300">No movies found</h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-500 mt-1">Please check back soon or try another page.</p>
        </div>
      )}

      {/* Pagination */}
      <Pagination currentPage={page} totalPages={totalPages} basePath="/" />
    </div>
  );
}
