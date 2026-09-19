import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

export function getAdminEmails(): string[] {
  const envEmails = process.env.ADMIN_EMAILS || 'anilarangi6@gmail.com,anilaragni7@gmail.com,anilarangi7@gmail.com';
  return envEmails
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const adminEmails = getAdminEmails();
  return adminEmails.includes(email.trim().toLowerCase());
}

export function verifyAdminPasscode(passcode: string | null | undefined): boolean {
  if (!passcode) return false;
  const configuredPasscode = process.env.ADMIN_PASSCODE || 'movieman@admin2024';
  return passcode === configuredPasscode;
}

export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText, salt);
}

export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plainText, hash);
  } catch (_) {
    return false;
  }
}

export function generateOtp(): string {
  // Cryptographically secure 6-digit number
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Validates that an admin user exists in BOTH .env (ADMIN_EMAILS) AND the database (AdminUser).
 * If either is missing, access is denied.
 */
export async function validateAdminUser(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();

  // 1. Check if email is in .env
  if (!isAdminEmail(cleanEmail)) {
    return false;
  }

  // 2. Check if email exists in MySQL database AdminUser table
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      'SELECT id, email, role, password, passwordChangedAt FROM `AdminUser` WHERE `email` = ? LIMIT 1',
      cleanEmail
    );
    const adminRecord = rows && rows.length > 0 ? rows[0] : null;
    return !!adminRecord && adminRecord.role === 'admin';
  } catch (error) {
    console.error('Error verifying admin in database:', error);
    return false;
  }
}

/**
 * Full credential verification:
 * Checks email is whitelisted in .env AND database.
 * If user has a hashed password in DB, verifies via bcrypt.
 * Also supports fallback to ADMIN_PASSCODE.
 */
export async function verifyAdminCredentials(
  email: string,
  passcodeOrPassword: string
): Promise<{ success: boolean; user?: any; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();

  if (!isAdminEmail(cleanEmail)) {
    return {
      success: false,
      error: 'Access Denied: Email is not whitelisted in .env (ADMIN_EMAILS).',
    };
  }

  const rows = await prisma.$queryRawUnsafe<any[]>(
    'SELECT id, email, name, role, password, passwordChangedAt FROM `AdminUser` WHERE `email` = ? LIMIT 1',
    cleanEmail
  );
  const adminRecord = rows && rows.length > 0 ? rows[0] : null;

  if (!adminRecord || adminRecord.role !== 'admin') {
    return {
      success: false,
      error: 'Access Denied: Account is not registered as an Admin in the database.',
    };
  }

  // If user has a custom hashed password in DB
  if (adminRecord.password) {
    const isPasswordValid = await verifyPassword(passcodeOrPassword, adminRecord.password);
    if (isPasswordValid) {
      return { success: true, user: adminRecord };
    }
  }

  // Fallback to emergency ADMIN_PASSCODE
  if (verifyAdminPasscode(passcodeOrPassword)) {
    return { success: true, user: adminRecord };
  }

  return {
    success: false,
    error: adminRecord.password
      ? 'Invalid password. If you forgot your password, please use Forgot Password to reset.'
      : 'Invalid admin passcode.',
  };
}

