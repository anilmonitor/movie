import { Movie, MovieCategory, MovieListResponse, DownloadLink } from './types';

const WP_API_BASE = process.env.NEXT_PUBLIC_WP_API_BASE || 'https://movies4u.kg/wp-json/wp/v2';

// Helper to decode HTML entities
export function decodeHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8216;/g, "‘")
    .replace(/&#8217;/g, "’")
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&#8230;/g, '…')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

// Clean raw title
export function cleanTitle(rawTitle: string): { title: string; year?: string; qualities: string[] } {
  const decoded = decodeHtml(rawTitle);
  const qualities: string[] = [];

  const qualityMatches = decoded.match(/\b(480p|720p|1080p|2160p|4K|HQ-HDTC|WEB-DL|Blu-Ray|HDRip|HDCAMRip|HDCAM)\b/gi);
  if (qualityMatches) {
    qualityMatches.forEach((q) => {
      const normalized = q.toUpperCase();
      if (!qualities.includes(normalized)) qualities.push(normalized);
    });
  }

  // Extract year
  const yearMatch = decoded.match(/\b(19\d{2}|20\d{2})\b/);
  const year = yearMatch ? yearMatch[1] : undefined;

  // Primary title cleaning
  let title = decoded
    .replace(/\b(480p|720p|1080p|2160p|4K|HQ-HDTC|WEB-DL|Blu-Ray|HDRip|HDCAMRip|HDCAM)\b/gi, '')
    .replace(/\|/g, '')
    .replace(/\s*–\s*/g, ' - ')
    .replace(/\s*-\s*$/, '')
    .replace(/\[.*?Added.*?\]/gi, '')
    .replace(/\{.*?Added.*?\}/gi, '')
    .replace(/\(Season\s*\d+(?:-\d+)?\)/gi, '')
    .replace(/Full Movie/gi, '')
    .replace(/WEB Series/gi, '')
    .replace(/Reality Show/gi, '')
    .replace(/TV-Show/gi, '')
    .replace(/LiNE/gi, '')
    .replace(/Clean/gi, '')
    .replace(/ORG\.?/gi, '')
    .trim();

  // If year is in title, we can also extract main name
  const nameWithYearMatch = title.match(/^(.*?)\s*\(\d{4}\)/);
  if (nameWithYearMatch && nameWithYearMatch[1].length > 2) {
    title = nameWithYearMatch[1].trim();
  }

  return { title: title || decoded, year, qualities };
}

// Extract download links from HTML
export function parseDownloadLinks(html: string): DownloadLink[] {
  const links: DownloadLink[] = [];
  if (!html) return links;

  // Find blocks with headings and download links
  // Patterns like: <h4>Title with Quality [Size]</h4>...<a href="URL">...Download Now...</a>
  const blockRegex = /<h[34][^>]*>(.*?)<\/h[34]>[\s\S]*?<a\s+[^>]*href=["']([^"']+)["'][^>]*>(?:<button[^>]*>)?(.*?)(?:<\/button>)?<\/a>/gi;
  let match;
  while ((match = blockRegex.exec(html)) !== null) {
    const rawHeading = decodeHtml(match[1].replace(/<[^>]+>/g, '').trim());
    const url = match[2];
    const btnText = decodeHtml(match[3].replace(/<[^>]+>/g, '').trim()) || 'Download';

    // Extract quality from heading
    const qualityMatch = rawHeading.match(/\b(480p|720p|1080p|2160p|4K)\b/i);
    const sizeMatch = rawHeading.match(/\[([0-9.]+(?:MB|GB)(?:\/[A-Za-z]+)?)\]/i);

    if (url && !url.includes('t.me') && !url.includes('how-to-download') && !url.startsWith('#')) {
      links.push({
        title: rawHeading || btnText,
        url,
        quality: qualityMatch ? qualityMatch[1] : undefined,
        size: sizeMatch ? sizeMatch[1] : undefined,
      });
    }
  }

  // Fallback: If no headings were matched, extract general anchor tags with download text
  if (links.length === 0) {
    const fallbackRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>(?:<button[^>]*>)?([\s\S]*?)(?:<\/button>)?<\/a>/gi;
    while ((match = fallbackRegex.exec(html)) !== null) {
      const url = match[1];
      const text = decodeHtml(match[2].replace(/<[^>]+>/g, '').trim());
      if (
        (text.toLowerCase().includes('download') ||
          text.toLowerCase().includes('v-cloud') ||
          text.toLowerCase().includes('batch') ||
          text.toLowerCase().includes('zip')) &&
        !url.includes('how-to-download') &&
        !url.includes('t.me')
      ) {
        links.push({
          title: text || 'Download Now',
          url,
        });
      }
    }
  }

  return links;
}

// Extract screenshots from HTML
export function parseScreenshots(html: string): string[] {
  const images: string[] = [];
  if (!html) return images;

  const imgRegex = /<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1];
    // Filter out icons, gravatars, logos
    if (
      src &&
      !src.includes('gravatar') &&
      !src.includes('emoji') &&
      !src.includes('logo') &&
      !images.includes(src)
    ) {
      images.push(src);
    }
  }

  return images;
}

// Normalize WordPress post to Movie object
export function parseMovieFromWpPost(post: any): Movie {
  const rawTitle = post?.title?.rendered || '';
  const decodedRawTitle = decodeHtml(rawTitle);
  const { title, year: parsedYear, qualities } = cleanTitle(rawTitle);

  const contentHtml = post?.content?.rendered || '';
  const excerptText = decodeHtml((post?.excerpt?.rendered || '').replace(/<[^>]+>/g, '').trim());

  // Extract metadata from content
  const imdbMatch = contentHtml.match(/IMDb\s*Rating:?-?\s*([0-9.]+(?:\/10)?)/i);
  const rating = imdbMatch ? imdbMatch[1].replace('/10', '') : undefined;

  const yearContentMatch = contentHtml.match(/Released?\s*Year:\s*([^\n<]+)/i);
  const year = yearContentMatch ? yearContentMatch[1].trim() : parsedYear;

  const langMatch = contentHtml.match(/Language:\s*([^\n<]+)/i);
  const languageStr = langMatch ? langMatch[1].trim() : '';
  const languages = languageStr
    ? languageStr.split(/[,|+]/).map((l: string) => l.trim()).filter(Boolean)
    : [];

  const sizeMatch = contentHtml.match(/(?:Episode\s*)?Size:\s*([^\n<]+)/i);
  const size = sizeMatch ? decodeHtml(sizeMatch[1].trim()) : undefined;

  // Extract Storyline
  let storyline: string | undefined;
  const storylineMatch = contentHtml.match(/Storyline:<\/h2>\s*<p>([\s\S]*?)<\/p>/i) ||
    contentHtml.match(/Storyline:<\/h2>\s*([^<]+)/i);
  if (storylineMatch) {
    storyline = decodeHtml(storylineMatch[1].replace(/<[^>]+>/g, '').trim());
  }
  if (!storyline && excerptText) {
    storyline = excerptText.split('Storyline:')[1]?.trim() || excerptText;
  }

  // Extract poster image
  const featuredMedia = post?._embedded?.['wp:featuredmedia']?.[0];
  const poster =
    featuredMedia?.media_details?.sizes?.large?.source_url ||
    featuredMedia?.source_url ||
    featuredMedia?.media_details?.sizes?.medium_large?.source_url ||
    '/poster-placeholder.svg';

  // Extract categories
  const rawCategories = post?._embedded?.['wp:term']?.[0] || [];
  const categories: MovieCategory[] = rawCategories.map((c: any) => ({
    id: c.id,
    name: decodeHtml(c.name),
    slug: c.slug,
  }));

  // Extract downloads & screenshots
  const downloadLinks = parseDownloadLinks(contentHtml);
  const screenshots = parseScreenshots(contentHtml);

  return {
    id: post.id,
    slug: post.slug,
    title,
    rawTitle: decodedRawTitle,
    year,
    rating,
    languages: languages.length > 0 ? languages : undefined,
    qualities: qualities.length > 0 ? qualities : ['HD'],
    size,
    storyline,
    poster,
    screenshots,
    downloadLinks,
    categories,
    date: post.date,
    contentHtml,
  };
}

// Fetch paginated movies
export async function getMovies({
  page = 1,
  perPage = 18,
  category,
  search,
}: {
  page?: number;
  perPage?: number;
  category?: string | number;
  search?: string;
} = {}): Promise<MovieListResponse> {
  const params = new URLSearchParams();
  params.set('_embed', '1');
  params.set('page', String(page));
  params.set('per_page', String(perPage));

  if (category) {
    params.set('categories', String(category));
  }
  if (search) {
    params.set('search', search);
  }

  try {
    const res = await fetch(`${WP_API_BASE}/posts?${params.toString()}`, {
      next: { revalidate: 120 }, // 2-minute cache for freshness
      signal: AbortSignal.timeout(9000),
    });

    if (!res.ok) {
      if (res.status === 400 || res.status === 404) {
        return { movies: [], totalPages: 0, totalMovies: 0, currentPage: page };
      }
      throw new Error(`Failed to fetch movies: ${res.statusText}`);
    }

    const totalMovies = parseInt(res.headers.get('x-wp-total') || '0', 10);
    const totalPages = parseInt(res.headers.get('x-wp-totalpages') || '1', 10);

    const posts = await res.json();
    const movies = Array.isArray(posts) ? posts.map(parseMovieFromWpPost) : [];

    return {
      movies,
      totalPages,
      totalMovies,
      currentPage: page,
    };
  } catch (error) {
    console.error('Error fetching movies:', error);
    return { movies: [], totalPages: 0, totalMovies: 0, currentPage: page };
  }
}

// Fetch single movie by slug
export async function getMovieBySlug(slug: string): Promise<Movie | null> {
  try {
    const res = await fetch(`${WP_API_BASE}/posts?slug=${encodeURIComponent(slug)}&_embed=1`, {
      next: { revalidate: 120 },
      signal: AbortSignal.timeout(9000),
    });

    if (!res.ok) return null;

    const posts = await res.json();
    if (!Array.isArray(posts) || posts.length === 0) return null;

    return parseMovieFromWpPost(posts[0]);
  } catch (error) {
    console.error(`Error fetching movie by slug ${slug}:`, error);
    return null;
  }
}

// Fetch categories
export async function getCategories(): Promise<MovieCategory[]> {
  try {
    const res = await fetch(`${WP_API_BASE}/categories?per_page=100`, {
      next: { revalidate: 3600 }, // 1 hour cache
      signal: AbortSignal.timeout(9000),
    });

    if (!res.ok) return [];

    const rawCategories = await res.json();
    if (!Array.isArray(rawCategories)) return [];

    return rawCategories
      .filter((c: any) => c.count > 0 && c.slug !== 'uncategorized')
      .map((c: any) => ({
        id: c.id,
        name: decodeHtml(c.name),
        slug: c.slug,
        count: c.count,
      }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}
