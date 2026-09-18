export function getAdminEmails(): string[] {
  const envEmails = process.env.ADMIN_EMAILS || 'anilarangi6@gmail.com,anilarangi7@gmail.com';
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
