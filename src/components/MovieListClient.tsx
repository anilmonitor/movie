'use client';

import React, { useState, useEffect } from 'react';
import { Movie } from '@/lib/types';
import { fetchMoviesDirectClient } from '@/lib/api';
import MovieCard from '@/components/MovieCard';
import Pagination from '@/components/Pagination';
import HeroFeatured from '@/components/HeroFeatured';
import { Tv, Loader2, Clock } from 'lucide-react';

interface MovieListClientProps {
  initialMovies: Movie[];
  initialTotalPages: number;
  initialTotalMovies: number;
  page: number;
  category?: string | number;
  search?: string;
  basePath?: string;
}

export default function MovieListClient({
  initialMovies,
  initialTotalPages,
  initialTotalMovies,
  page,
  category,
  search,
  basePath = '/',
}: MovieListClientProps) {
  const [movies, setMovies] = useState<Movie[]>(initialMovies);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [totalMovies, setTotalMovies] = useState(initialTotalMovies);
  const [isLoading, setIsLoading] = useState(initialMovies.length === 0);

  // If server-side fetch returned 0 movies (common when Vercel serverless IP is blocked by Cloudflare),
  // fallback to direct client-side fetch from the user's browser!
  useEffect(() => {
    if (initialMovies.length > 0) {
      setMovies(initialMovies);
      setTotalPages(initialTotalPages);
      setTotalMovies(initialTotalMovies);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    fetchMoviesDirectClient({ page, perPage: 18, category, search })
      .then((data) => {
        if (isMounted) {
          setMovies(data.movies);
          setTotalPages(data.totalPages);
          setTotalMovies(data.totalMovies);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Client direct fetch error:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [initialMovies, page, category, search, initialTotalPages, initialTotalMovies]);

  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  const featuredMovie = page === 1 && movies.length > 0 ? movies[0] : null;
  const displayMovies = page === 1 ? movies.slice(1) : movies;

  const sortedMovies = [...displayMovies].sort((a, b) => {
    const timeA = a.date ? new Date(a.date).getTime() : 0;
    const timeB = b.date ? new Date(b.date).getTime() : 0;
    if (sortBy === 'oldest') {
      return timeA - timeB;
    }
    return timeB - timeA;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="w-full h-72 sm:h-96 rounded-3xl bg-slate-200/60 dark:bg-gray-900/60 animate-pulse border border-slate-200 dark:border-white/5 flex items-center justify-center">
          <div className="flex items-center gap-2 text-slate-500 dark:text-gray-400 text-sm font-semibold">
            <Loader2 className="w-5 h-5 animate-spin text-red-600" />
            <span>Connecting directly to movie database...</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[2/3] rounded-xl bg-slate-200/60 dark:bg-gray-900/60 animate-pulse border border-slate-200 dark:border-white/5"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Featured Hero Banner (Only on page 1) */}
      {featuredMovie && <HeroFeatured movie={featuredMovie} />}

      {/* Date Filter & Sort Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 pb-2 border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-red-500" /> Sort by Upload:
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSortBy('newest')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                sortBy === 'newest'
                  ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-white/10'
              }`}
            >
              ⚡ Newest First
            </button>
            <button
              onClick={() => setSortBy('oldest')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                sortBy === 'oldest'
                  ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-white/10'
              }`}
            >
              ⏳ Oldest First
            </button>
          </div>
        </div>

        <span className="text-xs text-slate-500 dark:text-gray-400">
          Showing {sortedMovies.length} movies (Date Sorted)
        </span>
      </div>

      {/* Movies Grid */}
      {sortedMovies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-5">
          {sortedMovies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center glass-card rounded-2xl p-6">
          <Tv className="w-12 h-12 text-slate-400 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-gray-300">
            No movies found
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-500 mt-1">
            Please check back soon or try another page.
          </p>
        </div>
      )}

      {/* Pagination */}
      <Pagination currentPage={page} totalPages={totalPages} basePath={basePath} />
    </div>
  );
}
