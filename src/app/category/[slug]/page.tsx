import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getCategories, getMovies } from '@/lib/api';
import MovieListClient from '@/components/MovieListClient';
import { Sparkles, Folder } from 'lucide-react';

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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://allmoviesite.vercel.app';

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
      url: `${siteUrl}/category/${category.slug}`,
      siteName: 'Movies4u',
    },
    alternates: {
      canonical: `${siteUrl}/category/${category.slug}`,
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
    <div className="space-y-6 sm:space-y-8">
      {/* Category Header Banner */}
      <div className="p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl glass-card border border-slate-200 dark:border-white/10 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-500">
              <Folder className="w-3.5 h-3.5" />
              <span>Genre / Category</span>
            </div>
            <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white">
              {category.name} Movies
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 max-w-xl">
              Download latest and trending {category.name} movies and shows in HD 480p, 720p, 1080p, and 4K UHD.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-100 dark:bg-black/40 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs text-slate-700 dark:text-gray-300 font-semibold">
              {category.count || totalMovies} Titles
            </span>
          </div>
        </div>
      </div>

      {/* Hybrid Client/Server Movies Grid */}
      <MovieListClient
        initialMovies={movies}
        initialTotalPages={totalPages}
        initialTotalMovies={totalMovies}
        page={page}
        category={category.id}
        basePath={`/category/${category.slug}`}
      />
    </div>
  );
}
