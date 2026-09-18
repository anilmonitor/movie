const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const adminEmails = [
    'anilarangi6@gmail.com',
    'anilaragni7@gmail.com',
    'anilarangi7@gmail.com'
  ];

  console.log('Seeding admin users in database...');
  for (const email of adminEmails) {
    const admin = await prisma.adminUser.upsert({
      where: { email },
      update: {
        role: 'admin',
        updatedAt: new Date(),
      },
      create: {
        email,
        name: email.split('@')[0],
        role: 'admin',
      }
    });
    console.log(`Seeded admin: ${admin.email} (ID: ${admin.id}, Role: ${admin.role})`);
  }

  const allAdmins = await prisma.adminUser.findMany();
  console.log('All admins currently in DB:', allAdmins.map(a => ({ id: a.id, email: a.email, role: a.role })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
