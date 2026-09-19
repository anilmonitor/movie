import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCredentials } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, passcode } = await request.json();

    if (!email || !passcode) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Verify credentials against DB (bcrypt hash) and .env
    const result = await verifyAdminCredentials(cleanEmail, passcode);
    if (!result.success || !result.user) {
      return NextResponse.json(
        { error: result.error || 'Access Denied: Invalid credentials.' },
        { status: 401 }
      );
    }

    const now = Date.now();
    const maxAgeMs = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

    return NextResponse.json({
      success: true,
      message: 'Admin authenticated successfully',
      user: {
        email: cleanEmail,
        role: result.user.role || 'admin',
        name: result.user.name,
      },
      session: {
        loginAt: now,
        expiresAt: now + maxAgeMs,
        maxAgeDays: 7,
        passwordChangedAt: result.user.passwordChangedAt
          ? new Date(result.user.passwordChangedAt).getTime()
          : null,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Login verification failed' },
      { status: 500 }
    );
  }
}
