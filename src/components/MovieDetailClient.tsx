'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Movie } from '@/lib/types';
import { fetchMovieBySlugDirectClient, fetchMoviesDirectClient } from '@/lib/api';
import MovieCard from '@/components/MovieCard';
import {
  Star,
  Download,
  Film,
  Calendar,
  Layers,
  HardDrive,
  Languages,
  ChevronRight,
  ShieldCheck,
  Zap,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';

interface MovieDetailClientProps {
  initialMovie: Movie | null;
  slug: string;
  initialRelated: Movie[];
}

export default function MovieDetailClient({
  initialMovie,
  slug,
  initialRelated,
}: MovieDetailClientProps) {
  const [movie, setMovie] = useState<Movie | null>(initialMovie);
  const [relatedMovies, setRelatedMovies] = useState<Movie[]>(initialRelated);
  const [isLoading, setIsLoading] = useState(!initialMovie);

  // Client-side fallback if server was blocked
  useEffect(() => {
    if (initialMovie) {
      setMovie(initialMovie);
      setRelatedMovies(initialRelated);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    fetchMovieBySlugDirectClient(slug)
      .then((m) => {
        if (isMounted && m) {
          setMovie(m);
          setIsLoading(false);

          // Fetch related
          const catId = m.categories && m.categories.length > 0 ? m.categories[0].id : undefined;
          if (catId) {
            fetchMoviesDirectClient({ category: catId, perPage: 6 }).then((rel) => {
              if (isMounted) {
                setRelatedMovies(rel.movies.filter((r) => r.id !== m.id).slice(0, 6));
              }
            });
          }
        } else if (isMounted) {
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Client movie fetch error:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [initialMovie, slug, initialRelated]);

  if (isLoading) {
    return (
      <div className="py-24 text-center glass-card rounded-3xl p-8 max-w-lg mx-auto space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-red-600 mx-auto" />
        <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-gray-200">
          Loading Movie Details...
        </h3>
        <p className="text-xs text-slate-500 dark:text-gray-400">
          Fetching full specs and high-speed download mirrors directly.
        </p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="py-20 text-center glass-card rounded-3xl p-8 max-w-lg mx-auto space-y-4">
        <Film className="w-12 h-12 text-slate-400 dark:text-gray-600 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800 dark:text-gray-200">Movie Not Found</h2>
        <p className="text-xs text-slate-500 dark:text-gray-400">
          The requested movie could not be located.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold"
        >
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-10">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 sm:gap-2 text-xs text-slate-500 dark:text-gray-400 overflow-x-auto py-1 scrollbar-none">
        <Link href="/" className="hover:text-red-600 dark:hover:text-red-400 transition-colors whitespace-nowrap">
          Home
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-400 dark:text-gray-600 shrink-0" />
        {movie.categories && movie.categories.length > 0 && (
          <>
            <Link
              href={`/category/${movie.categories[0].slug}`}
              className="hover:text-red-600 dark:hover:text-red-400 transition-colors whitespace-nowrap"
            >
              {movie.categories[0].name}
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-400 dark:text-gray-600 shrink-0" />
          </>
        )}
        <span className="text-slate-800 dark:text-gray-200 truncate">{movie.title}</span>
      </nav>

      {/* Hero Movie Presentation Header */}
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden glass-card border border-black/10 dark:border-white/10 p-4 sm:p-8 md:p-10 shadow-xl">
        <div className="absolute inset-0 -z-10">
          <Image
            src={movie.poster || '/poster-placeholder.svg'}
            alt={movie.title}
            fill
            priority
            className="object-cover scale-125 blur-2xl opacity-10 dark:opacity-20 dark:brightness-50"
          />
          <div className="absolute inset-0 bg-white/90 dark:bg-[#07090e]/85" />
        </div>

        <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-center md:items-start">
          {/* Poster Column */}
          <div className="w-52 sm:w-64 md:w-72 shrink-0 flex flex-col items-center">
            <div className="relative aspect-[2/3] w-full rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-black/10 dark:border-white/15 bg-slate-100 dark:bg-gray-900">
              <Image
                src={movie.poster || '/poster-placeholder.svg'}
                alt={movie.title}
                fill
                priority
                className="object-cover"
              />
              {movie.rating && (
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500 text-gray-950 font-bold text-xs sm:text-sm shadow-md">
                  <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
                  <span>{movie.rating} / 10</span>
                </div>
              )}
            </div>

            <a
              href="#download-links"
              className="w-full mt-3 sm:mt-4 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-red-600/30 transition-all hover:scale-102"
            >
              <Download className="w-4 h-4" />
              <span>Go to Download Links</span>
            </a>
          </div>

          {/* Details Column */}
          <div className="flex-1 space-y-4 sm:space-y-6 w-full">
            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                {movie.year && (
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-black/5 dark:bg-white/10 text-slate-700 dark:text-gray-200">
                    {movie.year}
                  </span>
                )}
                {movie.qualities?.map((q) => (
                  <span
                    key={q}
                    className="px-2.5 py-0.5 rounded-md text-xs font-bold uppercase bg-red-50 dark:bg-red-600/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30"
                  >
                    {q}
                  </span>
                ))}
                {movie.categories?.map((c) => (
                  <Link
                    key={c.id}
                    href={`/category/${c.slug}`}
                    className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-700"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>

              <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white leading-tight">
                {movie.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 mt-1 sm:mt-2">{movie.rawTitle}</p>
            </div>

            {/* Metadata Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-100/70 dark:bg-black/40 border border-slate-200 dark:border-white/5 text-xs">
              <div className="space-y-0.5">
                <span className="text-slate-500 dark:text-gray-500 flex items-center gap-1">
                  <Film className="w-3.5 h-3.5 text-red-500" /> Movie Name
                </span>
                <p className="font-semibold text-slate-800 dark:text-gray-200 truncate">{movie.title}</p>
              </div>

              <div className="space-y-0.5">
                <span className="text-slate-500 dark:text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" /> Release Year
                </span>
                <p className="font-semibold text-slate-800 dark:text-gray-200">{movie.year || 'N/A'}</p>
              </div>

              <div className="space-y-0.5">
                <span className="text-slate-500 dark:text-gray-500 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-500" /> IMDb Score
                </span>
                <p className="font-semibold text-amber-600 dark:text-amber-400">{movie.rating ? `${movie.rating}/10` : 'Not Rated'}</p>
              </div>

              <div className="space-y-0.5">
                <span className="text-slate-500 dark:text-gray-500 flex items-center gap-1">
                  <Languages className="w-3.5 h-3.5 text-sky-500" /> Language
                </span>
                <p className="font-semibold text-slate-800 dark:text-gray-200 truncate">
                  {movie.languages?.join(', ') || 'Hindi'}
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-slate-500 dark:text-gray-500 flex items-center gap-1">
                  <HardDrive className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> File Size
                </span>
                <p className="font-semibold text-slate-800 dark:text-gray-200 truncate">{movie.size || '350MB - 2GB'}</p>
              </div>

              <div className="space-y-0.5">
                <span className="text-slate-500 dark:text-gray-500 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-purple-500" /> Format
                </span>
                <p className="font-semibold text-slate-800 dark:text-gray-200">MKV / MP4</p>
              </div>
            </div>

            {/* Storyline */}
            {movie.storyline && (
              <div className="space-y-2">
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Storyline & Overview</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-gray-300 leading-relaxed bg-slate-50 dark:bg-white/5 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-white/5">
                  {movie.storyline}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Screenshots Section */}
      {movie.screenshots && movie.screenshots.length > 0 && (
        <section className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-2.5 sm:pb-3">
            <ImageIcon className="w-5 h-5 text-red-600 dark:text-red-500" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Movie Screenshots</h2>
            <span className="text-xs text-slate-500 dark:text-gray-500 ml-auto">Sample Preview</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {movie.screenshots.slice(0, 6).map((src, idx) => (
              <div
                key={idx}
                className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-gray-900 group shadow-sm"
              >
                <Image
                  src={src}
                  alt={`${movie.title} screenshot ${idx + 1}`}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Download Links Section */}
      <section id="download-links" className="space-y-4 sm:space-y-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-white/10 pb-3 sm:pb-4">
          <div>
            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Download className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-500" />
              <span>Download Links ({movie.title})</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
              Select resolution below to begin instant high-speed download
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 px-3 py-1 rounded-full self-start sm:self-auto font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Verified Cloud Mirrors</span>
          </div>
        </div>

        {movie.downloadLinks && movie.downloadLinks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {movie.downloadLinks.map((link, idx) => (
              <div
                key={idx}
                className="p-4 sm:p-5 rounded-2xl glass-card flex flex-col justify-between gap-3 sm:gap-4 border border-slate-200 dark:border-white/10 hover:border-red-500 transition-all shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-red-600 text-white uppercase tracking-wider">
                      {link.quality || 'HD RIP'}
                    </span>
                    {link.size && (
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-gray-300">
                        {link.size}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-gray-100 line-clamp-2 mt-1.5">
                    {link.title}
                  </h4>
                </div>

                <div className="pt-2.5 border-t border-slate-100 dark:border-white/5 flex items-center gap-2 sm:gap-3">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs shadow-md transition-all hover:scale-102"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Now</span>
                  </a>

                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-gray-300 text-xs font-semibold transition-colors"
                  >
                    Fast Cloud
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 sm:p-8 rounded-2xl glass-card text-center space-y-3">
            <p className="text-slate-800 dark:text-gray-300 font-semibold text-sm sm:text-base">Direct Download Source</p>
            <p className="text-xs text-slate-500 dark:text-gray-400 max-w-md mx-auto">
              Please click the official source button below to access download mirrors directly.
            </p>
            <a
              href={`https://movies4u.kg/${movie.slug}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>Open Download Mirrors Page</span>
            </a>
          </div>
        )}
      </section>

      {/* Related Movies Section */}
      {relatedMovies.length > 0 && (
        <section className="space-y-3 sm:space-y-4 pt-6 border-t border-slate-200 dark:border-white/10">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Film className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-500" />
              <span>You May Also Like</span>
            </h3>
            {movie.categories?.[0] && (
              <Link
                href={`/category/${movie.categories[0].slug}`}
                className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline"
              >
                View More →
              </Link>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
            {relatedMovies.map((rel) => (
              <MovieCard key={rel.id} movie={rel} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
