import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminEmail, generateOtp } from '@/lib/auth';
import { sendOtpEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Check if email is in .env whitelist
    if (!isAdminEmail(cleanEmail)) {
      return NextResponse.json(
        { error: 'Access Denied: This email is not authorized as an administrator in .env.' },
        { status: 403 }
      );
    }

    // 2. Check if admin exists in database
    const rows = await prisma.$queryRawUnsafe<any[]>(
      'SELECT id, email, name, role FROM `AdminUser` WHERE `email` = ? LIMIT 1',
      cleanEmail
    );
    const adminUser = rows && rows.length > 0 ? rows[0] : null;

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access Denied: This account is not registered as an Admin in the database.' },
        { status: 403 }
      );
    }

    // 3. Generate 6-digit OTP & 10-minute expiry
    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // 4. Save in database
    await prisma.$executeRawUnsafe(
      'UPDATE `AdminUser` SET `otp` = ?, `otpExpiresAt` = ? WHERE `email` = ?',
      otp,
      otpExpiresAt,
      cleanEmail
    );

    // 5. Send via Gmail SMTP
    try {
      await sendOtpEmail({
        to: cleanEmail,
        otp,
        name: adminUser.name,
      });
    } catch (mailError: any) {
      console.error('SMTP Send Error:', mailError);
      return NextResponse.json(
        {
          error: `Failed to dispatch email via SMTP: ${mailError.message || 'Please check SMTP settings in .env'}.`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `A 6-digit verification code (OTP) has been sent to ${cleanEmail}. It will expire in 10 minutes.`,
    });
  } catch (error: any) {
    console.error('Error in send-otp route:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process OTP request.' },
      { status: 500 }
    );
  }
}
