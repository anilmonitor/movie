import { MetadataRoute } from 'next';
import { getCategories, getMovies } from '@/lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://allmoviesite.vercel.app');

  // Base static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  try {
    // Fetch categories
    const categories = await getCategories();
    const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
      url: `${baseUrl}/category/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    }));

    // Fetch latest movies (up to 100 for top indexation)
    const [page1, page2] = await Promise.all([
      getMovies({ page: 1, perPage: 50 }),
      getMovies({ page: 2, perPage: 50 }),
    ]);

    const allMovies = [...page1.movies, ...page2.movies];
    const movieRoutes: MetadataRoute.Sitemap = allMovies.map((movie) => ({
      url: `${baseUrl}/movie/${movie.slug}`,
      lastModified: movie.date ? new Date(movie.date) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    }));

    return [...staticRoutes, ...categoryRoutes, ...movieRoutes];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return staticRoutes;
  }
}
