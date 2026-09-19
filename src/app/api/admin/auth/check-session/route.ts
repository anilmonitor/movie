import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminEmail } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, sessionLoginAt } = await request.json();

    if (!email) {
      return NextResponse.json({ valid: false, reason: 'no_email' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Verify email whitelist
    if (!isAdminEmail(cleanEmail)) {
      return NextResponse.json({
        valid: false,
        reason: 'unauthorized_email',
        message: 'Email is no longer whitelisted in .env.',
      });
    }

    // 2. Fetch admin user from DB
    const rows = await prisma.$queryRawUnsafe<any[]>(
      'SELECT id, email, role, passwordChangedAt FROM `AdminUser` WHERE `email` = ? LIMIT 1',
      cleanEmail
    );
    const adminUser = rows && rows.length > 0 ? rows[0] : null;

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({
        valid: false,
        reason: 'not_found',
        message: 'Admin account not found in database.',
      });
    }

    // 3. Check 7-day automatic expiry
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    if (sessionLoginAt && Date.now() - sessionLoginAt > SEVEN_DAYS_MS) {
      return NextResponse.json({
        valid: false,
        reason: 'session_expired',
        message: 'Session has expired after 7 days. Please log in again.',
      });
    }

    // 4. Check if password was changed after this session was created
    if (adminUser.passwordChangedAt && sessionLoginAt) {
      const passwordChangedTime = new Date(adminUser.passwordChangedAt).getTime();
      // If password was changed after session login (with a 2-second grace margin for clock drift)
      if (passwordChangedTime > sessionLoginAt + 2000) {
        return NextResponse.json({
          valid: false,
          reason: 'password_changed',
          message: 'Password was changed. All active sessions have been terminated. Please log in with your new password.',
        });
      }
    }

    return NextResponse.json({ valid: true });
  } catch (error: any) {
    console.error('Error in check-session route:', error);
    return NextResponse.json({ valid: false, error: error?.message }, { status: 500 });
  }
}
