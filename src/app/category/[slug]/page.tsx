import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getCategories, getMovies } from '@/lib/api';
import MovieCard from '@/components/MovieCard';
import Pagination from '@/components/Pagination';
import { Film, Sparkles, Folder } from 'lucide-react';

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    page?: string;
  }>;
}

export const revalidate = 120; // 2 minutes

export async function generateMetadata(props: CategoryPageProps): Promise<Metadata> {
  const params = await props.params;
  const categories = await getCategories();
  const category = categories.find((c) => c.slug.toLowerCase() === params.slug.toLowerCase());

  if (!category) {
    return {
      title: 'Category Not Found - Movies4u',
    };
  }

  const title = `${category.name} Movies & Web Series Download - Movies4u`;
  const description = `Explore the latest ${category.name} movies and web series available for free high-speed download in 480p, 720p, 1080p & 4K resolutions on Movies4u.`;

  return {
    title,
    description,
    keywords: [
      category.name,
      `${category.name} movies`,
      `${category.name} download`,
      `${category.name} 720p 1080p`,
    ],
    openGraph: {
      title,
      description,
      url: `https://movies4u.kg/category/${category.slug}`,
      siteName: 'Movies4u',
    },
    alternates: {
      canonical: `https://movies4u.kg/category/${category.slug}`,
    },
  };
}

export default async function CategoryPage(props: CategoryPageProps) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const page = parseInt(searchParams.page || '1', 10);

  const categories = await getCategories();
  const category = categories.find((c) => c.slug.toLowerCase() === params.slug.toLowerCase());

  if (!category) {
    notFound();
  }

  const data = await getMovies({ category: category.id, page, perPage: 18 });
  const { movies, totalPages, totalMovies } = data;

  return (
    <div className="space-y-8">
      {/* Category Header Banner */}
      <div className="p-6 sm:p-10 rounded-3xl glass-card border border-white/10 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-500">
              <Folder className="w-4 h-4" />
              <span>Genre / Category</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white">
              {category.name} Movies
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 max-w-xl">
              Download latest and trending {category.name} movies and shows in HD 480p, 720p, 1080p, and 4K UHD.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto bg-black/40 px-4 py-2 rounded-2xl border border-white/10">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-gray-300 font-semibold">
              {totalMovies} Titles Available
            </span>
          </div>
        </div>
      </div>

      {/* Movies Grid */}
      {movies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center glass-card rounded-2xl p-8">
          <Film className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-300">No movies found in this category</h3>
          <p className="text-sm text-gray-500 mt-1">Please check back soon for new uploads.</p>
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        basePath={`/category/${category.slug}`}
      />
    </div>
  );
}
