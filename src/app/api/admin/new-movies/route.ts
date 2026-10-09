import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseMovieFromWpPost } from '@/lib/api';

export const dynamic = 'force-dynamic';

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8',
  Referer: 'https://movies4u.uy/',
  Origin: 'https://movies4u.uy',
};

// GET: Discover new movies from movies4u.uy that do not exist in our MySQL DB
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = Math.min(parseInt(searchParams.get('perPage') || '40', 10), 100);

    const sourceApi =
      process.env.SOURCE_WP_API ||
      process.env.NEXT_PUBLIC_WP_API_BASE ||
      'https://movies4u.uy/wp-json/wp/v2';

    // 1. Fetch latest posts from movies4u.kg
    let posts: any[] = [];
    try {
      const res = await fetch(`${sourceApi}/posts?_embed=1&page=${page}&per_page=${perPage}&orderby=date&order=desc`, {
        headers: BROWSER_HEADERS,
        next: { revalidate: 0 },
        signal: AbortSignal.timeout(15000),
      });

      if (res.ok) {
        posts = await res.json();
      } else {
        console.warn(`Direct fetch from ${sourceApi} returned HTTP ${res.status}`);
      }
    } catch (fetchErr: any) {
      console.warn('Direct fetch from sourceApi failed (may be Cloudflare protected):', fetchErr?.message);
    }

    if (!Array.isArray(posts) || posts.length === 0) {
      return NextResponse.json({
        newMovies: [],
        totalChecked: 0,
        message: 'No posts fetched from source (Cloudflare may require browser-assisted fetch)',
        needsClientFetch: true,
      });
    }

    // 2. Extract wpIds and slugs to query our database
    const wpIds = posts.map((p) => p.id).filter(Boolean);
    const slugs = posts.map((p) => p.slug).filter(Boolean);

    // 3. Find existing movies in our MySQL database
    const existingMovies = await prisma.movie.findMany({
      where: {
        OR: [
          { wpId: { in: wpIds } },
          { slug: { in: slugs } },
        ],
      },
      select: {
        id: true,
        wpId: true,
        slug: true,
      },
    });

    const existingWpIds = new Set(existingMovies.map((m) => m.wpId).filter(Boolean));
    const existingSlugs = new Set(existingMovies.map((m) => m.slug).filter(Boolean));

    // 4. Filter only genuinely NEW movies that do NOT exist in our DB
    const newMovies: any[] = [];

    for (const post of posts) {
      if (existingWpIds.has(post.id) || existingSlugs.has(post.slug)) {
        continue; // Already in our DB!
      }

      const parsed = parseMovieFromWpPost(post);
      newMovies.push({
        wpId: post.id,
        slug: post.slug,
        title: parsed.title,
        rawTitle: parsed.rawTitle,
        year: parsed.year,
        rating: parsed.rating,
        size: parsed.size,
        storyline: parsed.storyline,
        poster: parsed.poster,
        screenshots: parsed.screenshots || [],
        languages: parsed.languages || [],
        qualities: parsed.qualities || [],
        downloadLinks: parsed.downloadLinks || [],
        categories: parsed.categories || [],
        date: post.date, // Exact original date and time from movies4u.kg
        rawPost: post,
      });
    }

    return NextResponse.json({
      newMovies,
      totalChecked: posts.length,
      existingCount: posts.length - newMovies.length,
      newCount: newMovies.length,
    });
  } catch (error: any) {
    console.error('Error discovering new movies:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to check new movies' },
      { status: 500 }
    );
  }
}

// POST: Insert selected movie(s) into database with exact date & time, OR filter incoming posts against DB
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // If client supplied raw posts to filter against DB (e.g. when server faces Cloudflare challenge)
    if (body.action === 'filter' || body.filterOnly === true) {
      const rawPosts: any[] = Array.isArray(body.posts) ? body.posts : [];
      if (rawPosts.length === 0) {
        return NextResponse.json({ error: 'No posts provided to filter' }, { status: 400 });
      }

      const wpIds = rawPosts.map((p) => p.id).filter(Boolean);
      const slugs = rawPosts.map((p) => p.slug).filter(Boolean);

      const existingMovies = await prisma.movie.findMany({
        where: {
          OR: [
            { wpId: { in: wpIds } },
            { slug: { in: slugs } },
          ],
        },
        select: {
          id: true,
          wpId: true,
          slug: true,
        },
      });

      const existingWpIds = new Set(existingMovies.map((m) => m.wpId).filter(Boolean));
      const existingSlugs = new Set(existingMovies.map((m) => m.slug).filter(Boolean));

      const newMovies: any[] = [];
      for (const post of rawPosts) {
        if (existingWpIds.has(post.id) || existingSlugs.has(post.slug)) {
          continue; // Already exists in our DB!
        }
        const parsed = parseMovieFromWpPost(post);
        newMovies.push({
          wpId: post.id,
          slug: post.slug,
          title: parsed.title,
          rawTitle: parsed.rawTitle,
          year: parsed.year,
          rating: parsed.rating,
          size: parsed.size,
          storyline: parsed.storyline,
          poster: parsed.poster,
          screenshots: parsed.screenshots || [],
          languages: parsed.languages || [],
          qualities: parsed.qualities || [],
          downloadLinks: parsed.downloadLinks || [],
          categories: parsed.categories || [],
          date: post.date, // Exact original date and time from movies4u.kg
          rawPost: post,
        });
      }

      return NextResponse.json({
        success: true,
        newMovies,
        totalChecked: rawPosts.length,
        existingCount: rawPosts.length - newMovies.length,
        newCount: newMovies.length,
      });
    }

    let moviesToInsert: any[] = [];

    if (Array.isArray(body.movies)) {
      moviesToInsert = body.movies;
    } else if (body.movie) {
      moviesToInsert = [body.movie];
    } else if (Array.isArray(body.posts)) {
      moviesToInsert = body.posts.map(parseMovieFromWpPost);
    }

    if (moviesToInsert.length === 0) {
      return NextResponse.json(
        { error: 'No movies provided to insert' },
        { status: 400 }
      );
    }

    let insertedCount = 0;
    const insertedIds: number[] = [];

    for (const item of moviesToInsert) {
      const wpId = item.wpId || item.id;
      const slug = item.slug;
      const title = item.title;
      const rawTitle = item.rawTitle || item.title;

      if (!slug || !title) continue;

      // Ensure exact publication date & time from movies4u.kg is preserved
      let exactDate: Date | null = null;
      if (item.date) {
        const d = new Date(item.date);
        if (!isNaN(d.getTime())) {
          exactDate = d;
        }
      }

      // Categories relation
      const categoryConnectOrCreate = (item.categories || []).map((cat: any) => ({
        where: { slug: cat.slug },
        create: {
          wpId: cat.id > 0 ? cat.id : undefined,
          name: cat.name,
          slug: cat.slug,
        },
      }));

      // Insert or Update Movie in database
      const movie = await prisma.movie.upsert({
        where: { slug },
        update: {
          wpId: wpId ? parseInt(wpId, 10) : undefined,
          title,
          rawTitle,
          year: item.year || null,
          rating: item.rating || null,
          size: item.size || null,
          storyline: item.storyline || null,
          poster: item.poster || '',
          screenshots: item.screenshots || [],
          languages: item.languages || [],
          qualities: item.qualities || [],
          date: exactDate,
          categories: {
            connectOrCreate: categoryConnectOrCreate,
          },
        },
        create: {
          wpId: wpId ? parseInt(wpId, 10) : undefined,
          slug,
          title,
          rawTitle,
          year: item.year || null,
          rating: item.rating || null,
          size: item.size || null,
          storyline: item.storyline || null,
          poster: item.poster || '',
          screenshots: item.screenshots || [],
          languages: item.languages || [],
          qualities: item.qualities || [],
          date: exactDate,
          categories: {
            connectOrCreate: categoryConnectOrCreate,
          },
        },
      });

      // Insert Download Links cleanly mapped to this movie.id
      if (Array.isArray(item.downloadLinks) && item.downloadLinks.length > 0) {
        await prisma.downloadLink.deleteMany({
          where: { movieId: movie.id },
        });

        await prisma.downloadLink.createMany({
          data: item.downloadLinks.map((link: any) => ({
            movieId: movie.id,
            title: link.title || 'Download Now',
            url: link.url || '',
            quality: link.quality || null,
            size: link.size || null,
          })),
        });
      }

      insertedCount++;
      insertedIds.push(movie.id);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully inserted ${insertedCount} new movies into the database.`,
      insertedCount,
      insertedIds,
    });
  } catch (error: any) {
    console.error('Error inserting new movie:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to insert movie into database' },
      { status: 500 }
    );
  }
}
