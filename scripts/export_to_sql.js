const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

function escapeSql(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number' || typeof val === 'boolean') return val;
  if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
  const str = String(val)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\x00/g, '\\0');
  return `'${str}'`;
}

async function exportSql() {
  console.log('Fetching all records from Hostinger MySQL...');
  const movies = await prisma.movie.findMany({
    include: {
      categories: true,
      downloadLinks: true,
    }
  });

  const categories = await prisma.category.findMany();

  console.log(`Found ${movies.length} movies and ${categories.length} categories. Generating SQL dump...`);

  const sqlLines = [];
  sqlLines.push('-- Movie Man Database Dump');
  sqlLines.push('-- Generated: ' + new Date().toISOString());
  sqlLines.push('SET FOREIGN_KEY_CHECKS = 0;');
  sqlLines.push('');

  // 1. Categories
  if (categories.length > 0) {
    sqlLines.push('-- --------------------------------------------------------');
    sqlLines.push('-- Categories');
    sqlLines.push('-- --------------------------------------------------------');
    for (const cat of categories) {
      sqlLines.push(
        `INSERT INTO \`Category\` (\`id\`, \`wpId\`, \`name\`, \`slug\`, \`count\`, \`createdAt\`, \`updatedAt\`) VALUES (` +
        `${escapeSql(cat.id)}, ${escapeSql(cat.wpId)}, ${escapeSql(cat.name)}, ${escapeSql(cat.slug)}, ${cat.count || 0}, ${escapeSql(cat.createdAt)}, ${escapeSql(cat.updatedAt)}) ` +
        `ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`);`
      );
    }
    sqlLines.push('');
  }

  // 2. Movies
  if (movies.length > 0) {
    sqlLines.push('-- --------------------------------------------------------');
    sqlLines.push('-- Movies');
    sqlLines.push('-- --------------------------------------------------------');
    for (const m of movies) {
      const qualities = m.qualities ? JSON.stringify(m.qualities) : null;
      const screenshots = m.screenshots ? JSON.stringify(m.screenshots) : null;
      const languages = m.languages ? JSON.stringify(m.languages) : null;

      sqlLines.push(
        `INSERT INTO \`Movie\` (\`id\`, \`wpId\`, \`slug\`, \`title\`, \`rawTitle\`, \`year\`, \`rating\`, \`size\`, \`storyline\`, \`poster\`, \`screenshots\`, \`languages\`, \`qualities\`, \`date\`, \`createdAt\`, \`updatedAt\`) VALUES (` +
        `${escapeSql(m.id)}, ${escapeSql(m.wpId)}, ${escapeSql(m.slug)}, ${escapeSql(m.title)}, ${escapeSql(m.rawTitle)}, ` +
        `${escapeSql(m.year)}, ${escapeSql(m.rating)}, ${escapeSql(m.size)}, ${escapeSql(m.storyline)}, ${escapeSql(m.poster)}, ` +
        `${escapeSql(screenshots)}, ${escapeSql(languages)}, ${escapeSql(qualities)}, ${escapeSql(m.date)}, ` +
        `${escapeSql(m.createdAt)}, ${escapeSql(m.updatedAt)}) ` +
        `ON DUPLICATE KEY UPDATE \`title\`=VALUES(\`title\`), \`poster\`=VALUES(\`poster\`), \`updatedAt\`=VALUES(\`updatedAt\`);`
      );
    }
    sqlLines.push('');
  }

  // 3. CategoryToMovie Implicit Relations
  sqlLines.push('-- --------------------------------------------------------');
  sqlLines.push('-- Implicit Category-Movie Relations');
  sqlLines.push('-- --------------------------------------------------------');
  for (const m of movies) {
    for (const cat of m.categories) {
      sqlLines.push(
        `INSERT IGNORE INTO \`_CategoryToMovie\` (\`A\`, \`B\`) VALUES (${escapeSql(cat.id)}, ${escapeSql(m.id)});`
      );
    }
  }
  sqlLines.push('');

  // 4. Download Links
  sqlLines.push('-- --------------------------------------------------------');
  sqlLines.push('-- Download Links (Direct Cloud Mirrors)');
  sqlLines.push('-- --------------------------------------------------------');
  for (const m of movies) {
    for (const dl of m.downloadLinks) {
      sqlLines.push(
        `INSERT INTO \`DownloadLink\` (\`id\`, \`movieId\`, \`title\`, \`url\`, \`quality\`, \`size\`, \`createdAt\`) VALUES (` +
        `${escapeSql(dl.id)}, ${escapeSql(dl.movieId)}, ${escapeSql(dl.title)}, ${escapeSql(dl.url)}, ${escapeSql(dl.quality)}, ${escapeSql(dl.size)}, ${escapeSql(dl.createdAt)}) ` +
        `ON DUPLICATE KEY UPDATE \`url\`=VALUES(\`url\`), \`size\`=VALUES(\`size\`);`
      );
    }
  }
  sqlLines.push('');
  sqlLines.push('SET FOREIGN_KEY_CHECKS = 1;');

  const outputPath = path.join(__dirname, 'movies_dump.sql');
  fs.writeFileSync(outputPath, sqlLines.join('\n'), 'utf8');
  console.log(`Successfully generated SQL dump: ${outputPath} (${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB)`);

  await prisma.$disconnect();
}

exportSql().catch(e => {
  console.error(e);
  process.exit(1);
});
