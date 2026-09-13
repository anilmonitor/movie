import React from 'react';
import type { Metadata } from 'next';
import { getMovies } from '@/lib/api';
import SearchPageClient from '@/components/SearchPageClient';
import SearchBar from '@/components/SearchBar';
import { Search } from 'lucide-react';

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
    title: q ? `Search Results for "${q}" - Movie Man` : 'Search Movies - Movie Man',
    description: `Browse movie and web series search results for "${q}". Explore high quality 480p, 720p, 1080p movies on Movie Man.`,
    robots: {
      index: false,
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
      <div className="p-6 sm:p-10 rounded-3xl glass-card border border-gray-200 dark:border-white/10 text-center space-y-4 shadow-xl">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white flex items-center justify-center gap-2">
          <Search className="w-6 h-6 text-red-500" />
          <span>Search Cinema & Web Series</span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
          Find any Bollywood, Hollywood, South Indian, or Web Series download by entering name, actor, or year.
        </p>

        <div className="flex justify-center max-w-md mx-auto pt-2">
          <SearchBar />
        </div>
      </div>

      {query ? (
        <SearchPageClient
          initialMovies={movies}
          initialTotalPages={totalPages}
          initialTotalMovies={totalMovies}
          query={query}
          page={page}
        />
      ) : (
        <div className="py-16 text-center glass-card rounded-2xl p-6">
          <Search className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-300">Enter a title to search</h3>
          <p className="text-sm text-gray-500 mt-1">
            Type movie title, series name, or genre in the search box above.
          </p>
        </div>
      )}
    </div>
  );
}
