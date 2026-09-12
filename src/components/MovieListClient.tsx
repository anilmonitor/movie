'use client';

import React, { useState, useEffect } from 'react';
import { Movie } from '@/lib/types';
import { fetchMoviesDirectClient } from '@/lib/api';
import MovieCard from '@/components/MovieCard';
import Pagination from '@/components/Pagination';
import HeroFeatured from '@/components/HeroFeatured';
import { Tv, Loader2 } from 'lucide-react';

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

  const featuredMovie = page === 1 && movies.length > 0 ? movies[0] : null;
  const displayMovies = page === 1 ? movies.slice(1) : movies;

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

      {/* Movies Grid */}
      {displayMovies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-5">
          {displayMovies.map((movie) => (
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
