import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.movie.man&pcampaignid=web_share';

// Default App Version Configuration (can be updated here or via environment variables)
const APP_VERSION_CONFIG = {
  latestVersion: process.env.LATEST_APP_VERSION || '1.0.5',
  latestVersionCode: parseInt(process.env.LATEST_APP_VERSION_CODE || '6', 10),
  minSupportedVersion: '1.0.0',
  minSupportedVersionCode: 1,
  forceUpdate: process.env.APP_FORCE_UPDATE === 'true', // true if older versions are blocked
  title: 'New Update Available on Play Store! 🚀',
  message:
    'A new and upgraded version of Movie Man is available on Google Play Store with lightning-fast streaming, 4K download links, and live movie updates.',
  playStoreUrl: PLAY_STORE_URL,
  whatsNew: [
    '⚡ Ultra-fast movie streaming & 4K download links',
    '🎬 Live New Movies discovery & 1-click sync',
    '✨ Dark & Light mode polish with zero lag',
    '🐞 Fixed video player playback & performance bugs',
  ],
};

function compareSemVer(v1: string, v2: string): number {
  const parts1 = v1.split('.').map((p) => parseInt(p, 10) || 0);
  const parts2 = v2.split('.').map((p) => parseInt(p, 10) || 0);
  const len = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < len; i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientVersion = searchParams.get('version') || searchParams.get('v');
    const clientVersionCode = searchParams.get('versionCode') || searchParams.get('vc');

    let hasUpdate = true;
    let isForceUpdate = APP_VERSION_CONFIG.forceUpdate;

    if (clientVersionCode) {
      const code = parseInt(clientVersionCode, 10);
      if (!isNaN(code)) {
        hasUpdate = code < APP_VERSION_CONFIG.latestVersionCode;
        if (code < APP_VERSION_CONFIG.minSupportedVersionCode) {
          isForceUpdate = true;
        }
      }
    } else if (clientVersion) {
      hasUpdate = compareSemVer(APP_VERSION_CONFIG.latestVersion, clientVersion) > 0;
      if (compareSemVer(APP_VERSION_CONFIG.minSupportedVersion, clientVersion) > 0) {
        isForceUpdate = true;
      }
    }

    return NextResponse.json(
      {
        hasUpdate,
        forceUpdate: isForceUpdate,
        latestVersion: APP_VERSION_CONFIG.latestVersion,
        latestVersionCode: APP_VERSION_CONFIG.latestVersionCode,
        title: APP_VERSION_CONFIG.title,
        message: APP_VERSION_CONFIG.message,
        playStoreUrl: APP_VERSION_CONFIG.playStoreUrl,
        whatsNew: APP_VERSION_CONFIG.whatsNew,
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        hasUpdate: false,
        error: err?.message || 'Error checking app update',
      },
      { status: 500 }
    );
  }
}
