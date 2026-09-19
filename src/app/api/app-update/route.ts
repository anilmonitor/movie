import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.movie.man&pcampaignid=web_share';

// Default App Version Configuration
const APP_VERSION_CONFIG = {
  latestVersion: process.env.LATEST_APP_VERSION || '1.0.5',
  latestVersionCode: parseInt(process.env.LATEST_APP_VERSION_CODE || '6', 10),
  minSupportedVersion: '1.0.5',
  minSupportedVersionCode: 6,
  forceUpdate: true, // Compulsory update to view latest movies without issues
  title: 'Important App Update Required! 🚀',
  message:
    'Updating this app is compulsory so you can watch and download all the latest movies without any errors or interruptions.',
  playStoreUrl: PLAY_STORE_URL,
  whatsNew: [
    '🎬 Mandatory update: Watch all latest movies without issues',
    '⚡ Fixed movie playback errors and broken links',
    '🚀 Faster loading speed & 4K download support',
    '🛡️ Improved stability and smooth performance',
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
