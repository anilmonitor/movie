const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Altering AdminUser table in MySQL...');
  const columns = [
    { name: 'password', def: 'VARCHAR(255) NULL' },
    { name: 'otp', def: 'VARCHAR(10) NULL' },
    { name: 'otpExpiresAt', def: 'DATETIME NULL' },
    { name: 'passwordChangedAt', def: 'DATETIME NULL' },
  ];

  for (const col of columns) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE \`AdminUser\` ADD COLUMN \`${col.name}\` ${col.def};`);
      console.log(`Added column ${col.name}`);
    } catch (err) {
      if (err.message && err.message.includes('Duplicate column name')) {
        console.log(`Column ${col.name} already exists.`);
      } else {
        console.error(`Error adding ${col.name}:`, err.message);
      }
    }
  }

  const cols = await prisma.$queryRawUnsafe('DESCRIBE `AdminUser`;');
  console.log('Current AdminUser columns:', cols.map(c => c.Field));
}

main().catch(console.error).finally(() => prisma.$disconnect());
