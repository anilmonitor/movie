import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Download, Star, Sparkles, Film } from 'lucide-react';
import { Movie } from '@/lib/types';

interface HeroFeaturedProps {
  movie: Movie;
}

export default function HeroFeatured({ movie }: HeroFeaturedProps) {
  if (!movie) return null;

  return (
    <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden glass-card my-4 sm:my-6 border border-black/10 dark:border-white/10 shadow-xl">
      {/* Background Poster Blur / Backdrop */}
      <div className="absolute inset-0 z-0">
        <Image
          src={movie.poster || '/poster-placeholder.svg'}
          alt={movie.title}
          fill
          priority
          unoptimized={true}
          referrerPolicy="no-referrer"
          className="object-cover object-center scale-110 blur-2xl opacity-15 dark:opacity-30 dark:brightness-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white/95 dark:from-[#07090e] via-white/80 dark:via-[#07090e]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/90 dark:from-[#07090e] via-white/70 dark:via-[#07090e]/70 to-transparent" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 p-5 sm:p-8 md:p-10 flex flex-col md:flex-row items-center md:items-stretch gap-5 sm:gap-8">
        {/* Main Poster */}
        <div className="relative aspect-[2/3] w-40 sm:w-52 md:w-60 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-black/10 dark:border-white/20 shrink-0 transform md:-rotate-1 hover:rotate-0 transition-transform duration-300">
          <Image
            src={movie.poster || '/poster-placeholder.svg'}
            alt={movie.title}
            fill
            priority
            unoptimized={true}
            referrerPolicy="no-referrer"
            className="object-cover"
          />
          {movie.rating && (
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500 text-gray-950 shadow-md">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{movie.rating} / 10</span>
            </div>
          )}
        </div>

        {/* Info Column */}
        <div className="flex flex-col justify-center text-center md:text-left flex-1 max-w-2xl">
          {/* Top Pill Tag */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 sm:gap-2 mb-2.5">
            <span className="flex items-center gap-1 px-2.5 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider bg-red-600 text-white shadow-sm">
              <Sparkles className="w-3 h-3" /> Latest Release
            </span>

            {movie.year && (
              <span className="px-2.5 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-black/5 dark:bg-white/10 text-slate-700 dark:text-gray-200">
                {movie.year}
              </span>
            )}

            {movie.qualities && movie.qualities.slice(0, 3).map((q) => (
              <span
                key={q}
                className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wide uppercase bg-red-50 dark:bg-black/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30"
              >
                {q}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-2 sm:mb-3">
            {movie.title}
          </h1>

          {/* Languages */}
          {movie.languages && movie.languages.length > 0 && (
            <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-300 mb-2 sm:mb-3 flex items-center justify-center md:justify-start gap-1.5 font-medium">
              <Film className="w-3.5 h-3.5 text-red-600 dark:text-red-500" />
              <span>Languages: {movie.languages.join(' • ')}</span>
            </p>
          )}

          {/* Storyline */}
          {movie.storyline && (
            <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400 line-clamp-3 leading-relaxed mb-4 sm:mb-6">
              {movie.storyline}
            </p>
          )}

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 sm:gap-3">
            <Link
              href={`/movie/${movie.slug}`}
              className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-red-600/30 hover:scale-105 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download & Details</span>
            </Link>

            <Link
              href={`/movie/${movie.slug}`}
              className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-800 dark:text-gray-200 font-semibold text-xs sm:text-sm border border-black/5 dark:border-white/10 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Watch Info</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
