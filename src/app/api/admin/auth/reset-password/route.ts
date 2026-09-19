import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminEmail, hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, otp, newPassword } = await request.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { error: 'Email, OTP, and New Password are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    // 1. Verify email whitelist
    if (!isAdminEmail(cleanEmail)) {
      return NextResponse.json(
        { error: 'Access Denied: Email not whitelisted.' },
        { status: 403 }
      );
    }

    // 2. Fetch admin record
    const rows = await prisma.$queryRawUnsafe<any[]>(
      'SELECT id, email, role, otp, otpExpiresAt FROM `AdminUser` WHERE `email` = ? LIMIT 1',
      cleanEmail
    );
    const adminUser = rows && rows.length > 0 ? rows[0] : null;

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access Denied: Account not registered in database.' },
        { status: 403 }
      );
    }

    // 3. Verify OTP
    if (!adminUser.otp || adminUser.otp !== cleanOtp) {
      return NextResponse.json(
        { error: 'Invalid verification code (OTP). Please check and try again.' },
        { status: 400 }
      );
    }

    // 4. Check OTP expiration
    if (!adminUser.otpExpiresAt || new Date() > new Date(adminUser.otpExpiresAt)) {
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new OTP.' },
        { status: 400 }
      );
    }

    // 5. Hash new password securely with bcrypt
    const hashedPassword = await hashPassword(newPassword);

    // 6. Update database & set passwordChangedAt (Invalidates all active sessions)
    const now = new Date();
    await prisma.$executeRawUnsafe(
      'UPDATE `AdminUser` SET `password` = ?, `otp` = NULL, `otpExpiresAt` = NULL, `passwordChangedAt` = ? WHERE `email` = ?',
      hashedPassword,
      now,
      cleanEmail
    );

    return NextResponse.json({
      success: true,
      message:
        'Password reset successfully! All previous active sessions have been terminated. Please log in with your new password.',
      passwordChangedAt: now.toISOString(),
    });
  } catch (error: any) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to reset password.' },
      { status: 500 }
    );
  }
}
