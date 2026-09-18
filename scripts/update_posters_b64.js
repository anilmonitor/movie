const https = require('https');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function fetchPosterBuffer(url) {
  return new Promise((resolve) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'Referer': 'https://movies4u.kg/',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      }
    }, (res) => {
      if (res.statusCode !== 200) {
        console.log(`Failed ${url}: HTTP ${res.statusCode}`);
        return resolve(null);
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const mime = res.headers['content-type'] || 'image/webp';
        const b64 = `data:${mime};base64,${buffer.toString('base64')}`;
        resolve(b64);
      });
    }).on('error', (e) => {
      console.error(`Error fetching ${url}:`, e.message);
      resolve(null);
    });
  });
}

async function main() {
  const movies = await prisma.movie.findMany({
    select: { id: true, title: true, poster: true, slug: true }
  });

  console.log(`Found ${movies.length} movies to check posters.`);

  for (const m of movies) {
    if (m.poster && m.poster.startsWith('http')) {
      process.stdout.write(`Fetching poster for "${m.title}"... `);
      const b64 = await fetchPosterBuffer(m.poster);
      if (b64) {
        await prisma.movie.update({
          where: { id: m.id },
          data: { poster: b64 }
        });
        console.log(`Updated! (${(b64.length / 1024).toFixed(1)} KB)`);
      } else {
        console.log('Skipped (fetch failed)');
      }
    } else if (m.poster && m.poster.startsWith('data:image')) {
      console.log(`"${m.title}" already has base64 poster.`);
    }
  }

  console.log('All posters processed successfully!');
  await prisma.$disconnect();
}

main().catch(console.error);
