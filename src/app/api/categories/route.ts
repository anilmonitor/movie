import { NextResponse } from 'next/server';
import { getCategories } from '@/lib/api';

export async function GET() {
  try {
    const categories = await getCategories();

    return NextResponse.json(categories, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
