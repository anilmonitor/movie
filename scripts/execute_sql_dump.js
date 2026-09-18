const fs = require('fs');
const readline = require('readline');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function runImport() {
  const sqlFile = path.join(__dirname, 'movies_full_catalog_8000_movies.sql');
  if (!fs.existsSync(sqlFile)) {
    console.error(`File not found: ${sqlFile}`);
    process.exit(1);
  }

  console.log(`Starting import from ${sqlFile}...`);
  const fileStream = fs.createReadStream(sqlFile, { encoding: 'utf8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');

  let count = 0;
  let skipped = 0;
  let errors = 0;
  let currentBatch = [];
  const BATCH_SIZE = 50;

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('--') || trimmed.startsWith('SET ')) continue;

    currentBatch.push(trimmed);

    if (currentBatch.length >= BATCH_SIZE) {
      try {
        await prisma.$transaction(
          currentBatch.map(stmt => prisma.$executeRawUnsafe(stmt))
        );
        count += currentBatch.length;
        if (count % 500 === 0) {
          console.log(`Progress: ${count} statements executed into Hostinger MySQL...`);
        }
      } catch (err) {
        // Fallback execute one by one
        for (const s of currentBatch) {
          try {
            await prisma.$executeRawUnsafe(s);
            count++;
          } catch (e) {
            errors++;
          }
        }
      }
      currentBatch = [];
    }
  }

  if (currentBatch.length > 0) {
    for (const s of currentBatch) {
      try {
        await prisma.$executeRawUnsafe(s);
        count++;
      } catch (e) {
        errors++;
      }
    }
  }

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
  console.log(`\n🎉 IMPORT COMPLETED!`);
  console.log(`- Total executed: ${count}`);
  console.log(`- Errors: ${errors}`);

  await prisma.$disconnect();
}

runImport().catch(e => {
  console.error(e);
  process.exit(1);
});
