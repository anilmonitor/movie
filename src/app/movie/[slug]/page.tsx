import React from 'react';
import type { Metadata } from 'next';
import { getMovieBySlug, getMovies } from '@/lib/api';
import MovieDetailClient from '@/components/MovieDetailClient';

interface MoviePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const revalidate = 120; // 2 minutes

// Dynamic SEO Metadata for Google Ranking
export async function generateMetadata(props: MoviePageProps): Promise<Metadata> {
  const params = await props.params;
  const movie = await getMovieBySlug(params.slug);

  const cleanYear = movie?.year ? ` (${movie.year})` : '';
  const pageTitle = movie
    ? `${movie.title}${cleanYear} Full Movie Download 480p | 720p | 1080p`
    : 'Download Full Movie HD - Movies4u';
  const metaDesc =
    movie?.storyline?.slice(0, 160) ||
    'Download latest movies in HD 480p, 720p, 1080p, 4K UHD. Fast, direct download links available on Movies4u.';

  return {
    title: pageTitle,
    description: metaDesc,
    keywords: [
      movie?.title || 'movie download',
      'download 720p',
      'download 1080p',
      ...(movie?.languages || []),
      ...(movie?.categories?.map((c) => c.name) || []),
    ],
    openGraph: {
      title: pageTitle,
      description: metaDesc,
      url: `https://movies4u.kg/movie/${params.slug}`,
      siteName: 'Movies4u',
      images: movie?.poster
        ? [
            {
              url: movie.poster,
              width: 800,
              height: 1200,
              alt: movie.title,
            },
          ]
        : [],
      type: 'video.movie',
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: metaDesc,
      images: movie?.poster ? [movie.poster] : [],
    },
    alternates: {
      canonical: `https://movies4u.kg/movie/${params.slug}`,
    },
  };
}

export default async function MoviePage(props: MoviePageProps) {
  const params = await props.params;
  const movie = await getMovieBySlug(params.slug);

  // Fetch related movies based on first category if movie exists
  let relatedMovies: any[] = [];
  if (movie?.categories && movie.categories.length > 0) {
    const primaryCat = movie.categories[0].id;
    const relatedData = await getMovies({ category: primaryCat, perPage: 6 });
    relatedMovies = relatedData.movies.filter((m) => m.id !== movie.id).slice(0, 6);
  }

  // Schema.org JSON-LD for rich snippets
  const jsonLd = movie
    ? {
        '@context': 'https://schema.org',
        '@type': 'Movie',
        name: movie.title,
        description: movie.storyline || movie.rawTitle,
        image: movie.poster,
        datePublished: movie.year || movie.date,
        inLanguage: movie.languages || ['Hindi'],
        aggregateRating: movie.rating
          ? {
              '@type': 'AggregateRating',
              ratingValue: movie.rating,
              bestRating: '10',
              worstRating: '1',
              ratingCount: '150',
            }
          : undefined,
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <MovieDetailClient
        initialMovie={movie}
        slug={params.slug}
        initialRelated={relatedMovies}
      />
    </>
  );
}
