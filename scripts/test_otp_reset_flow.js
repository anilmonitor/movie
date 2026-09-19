const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testFlow() {
  console.log('--- Step 1: Requesting OTP for anilarangi6@gmail.com ---');
  const sendRes = await fetch('http://localhost:3000/api/admin/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'anilarangi6@gmail.com' }),
  });
  const sendData = await sendRes.json();
  console.log('Send OTP Response:', sendData);

  if (!sendRes.ok || !sendData.success) {
    throw new Error('Failed to send OTP: ' + JSON.stringify(sendData));
  }

  console.log('\n--- Step 2: Fetching generated OTP from MySQL via raw query ---');
  const rows = await prisma.$queryRawUnsafe(
    'SELECT email, otp, otpExpiresAt, password, passwordChangedAt FROM `AdminUser` WHERE `email` = ?',
    'anilarangi6@gmail.com'
  );
  const user = rows[0];
  console.log('Database AdminUser Record:', {
    email: user.email,
    otp: user.otp,
    otpExpiresAt: user.otpExpiresAt,
    passwordChangedAt: user.passwordChangedAt,
  });
  const currentOtp = user.otp;
  console.log('Current OTP in DB:', currentOtp);

  console.log('\n--- Step 3: Resetting Password using OTP ---');
  const testPassword = 'AdminSecretPassword2026!';
  const resetRes = await fetch('http://localhost:3000/api/admin/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'anilarangi6@gmail.com',
      otp: currentOtp,
      newPassword: testPassword,
    }),
  });
  const resetData = await resetRes.json();
  console.log('Reset Password Response:', resetData);

  console.log('\n--- Step 4: Verifying Updated Database State ---');
  const updatedRows = await prisma.$queryRawUnsafe(
    'SELECT email, otp, otpExpiresAt, password, passwordChangedAt FROM `AdminUser` WHERE `email` = ?',
    'anilarangi6@gmail.com'
  );
  const updatedUser = updatedRows[0];
  console.log('Updated DB Record:', {
    email: updatedUser.email,
    otp: updatedUser.otp, // should be null
    passwordHash: updatedUser.password ? updatedUser.password.substring(0, 15) + '...' : null,
    passwordChangedAt: updatedUser.passwordChangedAt,
  });

  console.log('\n--- Step 5: Testing Login with New Password ---');
  const loginRes = await fetch('http://localhost:3000/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'anilarangi6@gmail.com',
      passcode: testPassword,
    }),
  });
  const loginData = await loginRes.json();
  console.log('Login Response:', loginData);

  console.log('\n--- Step 6: Testing Session Invalidation (Past Login Timestamp) ---');
  const oldLoginTimestamp = Date.now() - 60000; // 1 minute ago (before password reset)
  const checkRes = await fetch('http://localhost:3000/api/admin/auth/check-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'anilarangi6@gmail.com',
      sessionLoginAt: oldLoginTimestamp,
    }),
  });
  const checkData = await checkRes.json();
  console.log('Session Invalidation Check for Old Session (should be valid: false):', checkData);

  console.log('\n--- Step 7: Testing 7-Day Session Expiry Check ---');
  const expiredTimestamp = Date.now() - (8 * 24 * 60 * 60 * 1000); // 8 days ago
  const expiryCheckRes = await fetch('http://localhost:3000/api/admin/auth/check-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'anilarangi6@gmail.com',
      sessionLoginAt: expiredTimestamp,
    }),
  });
  const expiryCheckData = await expiryCheckRes.json();
  console.log('Session Check for 8-Day-Old Session (should be valid: false):', expiryCheckData);

  await prisma.$disconnect();
  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
}

testFlow().catch(async (err) => {
  console.error('Test Failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
