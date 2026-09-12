'use client';

import React, { useState, useEffect } from 'react';
import { Movie } from '@/lib/types';
import { fetchMoviesDirectClient } from '@/lib/api';
import MovieCard from '@/components/MovieCard';
import Pagination from '@/components/Pagination';
import { AlertCircle, Loader2 } from 'lucide-react';

interface SearchPageClientProps {
  initialMovies: Movie[];
  initialTotalPages: number;
  initialTotalMovies: number;
  query: string;
  page: number;
}

export default function SearchPageClient({
  initialMovies,
  initialTotalPages,
  initialTotalMovies,
  query,
  page,
}: SearchPageClientProps) {
  const [movies, setMovies] = useState<Movie[]>(initialMovies);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [totalMovies, setTotalMovies] = useState(initialTotalMovies);
  const [isLoading, setIsLoading] = useState(query.length > 0 && initialMovies.length === 0);

  useEffect(() => {
    if (initialMovies.length > 0) {
      setMovies(initialMovies);
      setTotalPages(initialTotalPages);
      setTotalMovies(initialTotalMovies);
      setIsLoading(false);
      return;
    }

    if (!query) {
      setMovies([]);
      setTotalPages(1);
      setTotalMovies(0);
      setIsLoading(false);
      return;
    }

    // Client-side fallback if Vercel server was challenged by Cloudflare
    let isMounted = true;
    setIsLoading(true);

    fetchMoviesDirectClient({ page, perPage: 18, search: query })
      .then((data) => {
        if (isMounted) {
          setMovies(data.movies);
          setTotalPages(data.totalPages || 1);
          setTotalMovies(data.totalMovies || data.movies.length);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Search client fallback error:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [query, page, initialMovies, initialTotalPages, initialTotalMovies]);

  if (!query) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="py-20 text-center glass-card rounded-2xl p-8 space-y-4">
        <Loader2 className="w-10 h-10 text-red-500 animate-spin mx-auto" />
        <h3 className="text-base font-semibold text-gray-300">Searching cinema archives for &quot;{query}&quot;...</h3>
        <p className="text-xs text-gray-500">Connecting directly to live database</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Results Header */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">
            Results for <span className="text-red-500 dark:text-red-400">&quot;{query}&quot;</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Found {totalMovies} title{totalMovies === 1 ? '' : 's'} (Page {page} of {totalPages})
          </p>
        </div>
      </div>

      {/* Results Grid */}
      {movies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center glass-card rounded-2xl p-8 space-y-3">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
            No matching movies found for &quot;{query}&quot;
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Try checking the spelling, or search for an alternate keyword or English / Hindi title.
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          basePath={`/search?q=${encodeURIComponent(query)}`}
        />
      )}
    </div>
  );
}
