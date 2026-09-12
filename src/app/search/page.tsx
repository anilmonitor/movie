import React from 'react';
import type { Metadata } from 'next';
import { getMovies } from '@/lib/api';
import MovieCard from '@/components/MovieCard';
import Pagination from '@/components/Pagination';
import SearchBar from '@/components/SearchBar';
import { Search, Film, AlertCircle } from 'lucide-react';

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
  }>;
}

export async function generateMetadata(props: SearchPageProps): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const q = searchParams.q || '';

  return {
    title: q ? `Search Results for "${q}" - Movies4u` : 'Search Movies - Movies4u',
    description: `Browse movie and web series search results for "${q}". Download high quality 480p, 720p, 1080p movies on Movies4u.`,
    robots: {
      index: false, // Prevents thin query indexation while keeping crawling friendly
      follow: true,
    },
  };
}

export default async function SearchPage(props: SearchPageProps) {
  const searchParams = await props.searchParams;
  const query = searchParams.q?.trim() || '';
  const page = parseInt(searchParams.page || '1', 10);

  const data = query ? await getMovies({ search: query, page, perPage: 18 }) : null;
  const movies = data?.movies || [];
  const totalPages = data?.totalPages || 1;
  const totalMovies = data?.totalMovies || 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Search Header Banner */}
      <div className="p-6 sm:p-10 rounded-3xl glass-card border border-white/10 text-center space-y-4 shadow-xl">
        <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center justify-center gap-2">
          <Search className="w-6 h-6 text-red-500" />
          <span>Search Cinema & Web Series</span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 max-w-lg mx-auto">
          Find any Bollywood, Hollywood, South Indian, or Web Series download by entering name, actor, or year.
        </p>

        <div className="flex justify-center max-w-md mx-auto pt-2">
          <SearchBar />
        </div>
      </div>

      {/* Results Header */}
      {query ? (
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-200">
              Results for <span className="text-red-400">&quot;{query}&quot;</span>
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Found {totalMovies} title{totalMovies === 1 ? '' : 's'} (Page {page} of {totalPages})
            </p>
          </div>
        </div>
      ) : (
        <div className="py-16 text-center glass-card rounded-2xl p-6">
          <Search className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-300">Enter a title to search</h3>
          <p className="text-sm text-gray-500 mt-1">
            Type movie title, series name, or genre in the search box above.
          </p>
        </div>
      )}

      {/* Results Grid */}
      {movies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ) : query ? (
        <div className="py-16 text-center glass-card rounded-2xl p-8 space-y-3">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="text-lg font-bold text-gray-200">
            No matching movies found for &quot;{query}&quot;
          </h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Try checking the spelling, or search for an alternate keyword or English / Hindi title.
          </p>
        </div>
      ) : null}

      {/* Pagination */}
      {query && totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          basePath={`/search?q=${encodeURIComponent(query)}`}
        />
      )}
    </div>
  );
}
