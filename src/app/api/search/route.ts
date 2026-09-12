import { NextRequest, NextResponse } from 'next/server';
import { getMovies } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('perPage') || '12', 10);

    if (!query.trim()) {
      return NextResponse.json({ movies: [], totalPages: 0, totalMovies: 0, currentPage: 1 });
    }

    const data = await getMovies({ search: query, page, perPage });

    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to search movies' },
      { status: 500 }
    );
  }
}
