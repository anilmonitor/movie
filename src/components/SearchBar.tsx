'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Search, X, Loader2, Star } from 'lucide-react';
import { Movie } from '@/lib/types';
import { fetchMoviesDirectClient } from '@/lib/api';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search with dual-tier fallback
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}&perPage=6`);
        if (res.ok) {
          const data = await res.json();
          if (data.movies && data.movies.length > 0) {
            setResults(data.movies);
            setIsOpen(true);
            setIsLoading(false);
            return;
          }
        }
        // Direct browser fallback if Vercel server was challenged by Cloudflare
        const directData = await fetchMoviesDirectClient({ search: query.trim(), perPage: 6 });
        if (directData.movies && directData.movies.length > 0) {
          setResults(directData.movies);
          setIsOpen(true);
        } else {
          setResults([]);
        }
      } catch (e) {
        try {
          const directData = await fetchMoviesDirectClient({ search: query.trim(), perPage: 6 });
          setResults(directData.movies || []);
          if (directData.movies?.length) setIsOpen(true);
        } catch {}
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="relative w-full max-w-md" ref={dropdownRef}>
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="absolute left-3.5 text-slate-400 dark:text-gray-400 pointer-events-none">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-red-500" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.length >= 2) setIsOpen(true);
          }}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder="Search movies, web series, hindi..."
          className="w-full pl-10 pr-20 py-2 sm:py-2.5 bg-slate-100/90 dark:bg-gray-900/90 border border-slate-300 dark:border-white/10 rounded-full text-xs sm:text-sm text-slate-900 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all shadow-inner"
          id="site-search-input"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
            }}
            className="absolute right-14 text-slate-400 dark:text-gray-400 hover:text-slate-700 dark:hover:text-white transition-colors p-1"
            title="Clear"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <button
          type="submit"
          className="absolute right-1 px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors flex items-center gap-1 shadow"
          id="site-search-btn"
        >
          <span>Search</span>
        </button>
      </form>

      {/* Floating Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#0e131d] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-slate-100 dark:divide-white/5 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2.5 text-[11px] font-semibold tracking-wider uppercase text-slate-500 dark:text-gray-400 bg-slate-50 dark:bg-black/20 flex justify-between items-center">
            <span>Quick Results</span>
            <span className="text-red-600 dark:text-red-400">Found {results.length}</span>
          </div>

          <div className="max-h-[380px] overflow-y-auto">
            {results.map((movie) => (
              <Link
                key={movie.id}
                href={`/movie/${movie.slug}`}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 p-2.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
              >
                <div className="relative w-10 h-14 rounded-md overflow-hidden bg-slate-200 dark:bg-gray-800 shrink-0">
                  <Image
                    src={movie.poster || '/poster-placeholder.svg'}
                    alt={movie.title}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-gray-200 group-hover:text-red-600 dark:group-hover:text-red-400 truncate transition-colors">
                    {movie.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-gray-400">
                    {movie.year && <span>{movie.year}</span>}
                    {movie.rating && (
                      <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
                        <Star className="w-3 h-3 fill-current" />
                        {movie.rating}
                      </span>
                    )}
                    {movie.qualities && movie.qualities[0] && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-gray-300 font-bold">
                        {movie.qualities[0]}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <Link
            href={`/search?q=${encodeURIComponent(query.trim())}`}
            onClick={() => setIsOpen(false)}
            className="block text-center py-2.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
          >
            View all results for &quot;{query}&quot; →
          </Link>
        </div>
      )}
    </div>
  );
}
