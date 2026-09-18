'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Download, Film, Sparkles, Clock, Calendar } from 'lucide-react';
import { Movie } from '@/lib/types';
import { formatUploadDate, formatTimeAgo } from '@/lib/api';

interface MovieCardProps {
  movie: Movie;
}

export default function MovieCard({ movie }: MovieCardProps) {
  const [imgSrc, setImgSrc] = useState(movie.poster || '/poster-placeholder.svg');

  return (
    <Link
      href={`/movie/${movie.slug}`}
      className="group relative flex flex-col rounded-xl overflow-hidden glass-card transition-all duration-300 hover:-translate-y-1.5 focus:outline-none focus:ring-2 focus:ring-red-500"
      id={`movie-card-${movie.id}`}
    >
      {/* Poster Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-200 dark:bg-gray-900">
        <Image
          src={imgSrc}
          alt={movie.title}
          fill
          unoptimized={true}
          referrerPolicy="no-referrer"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          onError={() => setImgSrc('/poster-placeholder.svg')}
          loading="lazy"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-70 group-hover:opacity-90 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none">
          {/* Rating */}
          {movie.rating ? (
            <span className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold bg-amber-500 text-gray-950 shadow-sm">
              <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
              {movie.rating}
            </span>
          ) : (
            <span className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold bg-red-600 text-white shadow-sm">
              <Sparkles className="w-2.5 h-2.5" />
              HD
            </span>
          )}

          {/* Quality Badge */}
          {movie.qualities && movie.qualities.length > 0 && (
            <span className="px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[11px] font-extrabold tracking-wider uppercase bg-black/80 text-red-400 border border-red-500/30 backdrop-blur-md">
              {movie.qualities[0]}
            </span>
          )}
        </div>

        {/* Bottom Poster Badges: Year & Upload Relative Time */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none">
          {movie.year ? (
            <span className="px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-semibold bg-black/75 text-gray-200 backdrop-blur-md border border-white/10">
              {movie.year}
            </span>
          ) : <span />}

          {movie.date && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-black/80 text-amber-300 backdrop-blur-md border border-amber-500/30">
              <Clock className="w-2.5 h-2.5 text-amber-400" />
              {formatTimeAgo(movie.date)}
            </span>
          )}
        </div>

        {/* Hover Action Overlay */}
        <div className="absolute inset-0 bg-red-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600 text-white font-semibold text-xs shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </div>
        </div>
      </div>

      {/* Info Content */}
      <div className="p-2.5 sm:p-3 flex flex-col flex-1 justify-between gap-1 bg-white dark:bg-[#0d121c]/95">
        <div>
          <h3
            className="text-xs sm:text-sm font-bold text-slate-900 dark:text-gray-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-2 leading-snug"
            title={movie.rawTitle}
          >
            {movie.title}
          </h3>

          {/* Languages */}
          {movie.languages && movie.languages.length > 0 && (
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-gray-400 mt-1 line-clamp-1 flex items-center gap-1">
              <Film className="w-3 h-3 text-red-500 inline shrink-0" />
              {movie.languages.join(' • ')}
            </p>
          )}
        </div>

        {/* Upload Date & Categories */}
        <div className="pt-1.5 mt-1 border-t border-slate-100 dark:border-white/5 space-y-1">
          {movie.date && (
            <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-slate-400 dark:text-gray-400 font-medium">
              <Calendar className="w-2.5 h-2.5 text-red-500 shrink-0" />
              <span className="truncate">{formatUploadDate(movie.date)}</span>
            </div>
          )}

          {movie.categories && movie.categories.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {movie.categories.slice(0, 2).map((cat) => (
                <span
                  key={cat.id}
                  className="text-[9px] font-medium text-slate-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-gray-200"
                >
                  #{cat.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
