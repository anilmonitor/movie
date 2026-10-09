import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return new NextResponse('Missing url parameter', { status: 400 });
    }

    // Decode URL if encoded
    const targetUrl = decodeURIComponent(imageUrl);

    // Only proxy images from movies4u or trusted CDNs
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      return new NextResponse('Invalid URL scheme', { status: 400 });
    }

    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        Referer: targetUrl.includes('movies4u.uy') ? 'https://movies4u.uy/' : 'https://movies4u.kg/',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    });

    if (!res.ok) {
      return new NextResponse(`Failed to fetch image: HTTP ${res.status}`, { status: res.status });
    }

    const contentType = res.headers.get('content-type') || 'image/webp';
    const imageBuffer = await res.arrayBuffer();

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    return new NextResponse(`Error proxying image: ${err?.message}`, { status: 500 });
  }
}
