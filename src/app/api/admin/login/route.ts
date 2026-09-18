import { NextRequest, NextResponse } from 'next/server';
import { validateAdminUser, verifyAdminPasscode } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, passcode } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Verify passcode
    if (!verifyAdminPasscode(passcode)) {
      return NextResponse.json(
        { error: 'Invalid admin passcode' },
        { status: 401 }
      );
    }

    // 2. Verify email is in BOTH .env AND database
    const isValidAdmin = await validateAdminUser(cleanEmail);
    if (!isValidAdmin) {
      return NextResponse.json(
        {
          error:
            'Access Denied: Email must be whitelisted in .env (ADMIN_EMAILS) AND registered as an Admin in the database.',
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Admin authenticated successfully',
      user: {
        email: cleanEmail,
        role: 'admin',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Login verification failed' },
      { status: 500 }
    );
  }
}
