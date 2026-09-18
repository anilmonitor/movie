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
    const adminRecord = await prisma.adminUser.findUnique({
      where: { email: cleanEmail },
    });
    return !!adminRecord && adminRecord.role === 'admin';
  } catch (error) {
    console.error('Error verifying admin in database:', error);
    return false;
  }
}

