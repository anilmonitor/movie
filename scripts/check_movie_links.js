const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const m = await prisma.movie.findFirst({
    where: { slug: { contains: 'stree-2' } },
    include: { downloadLinks: true }
  });
  console.log('Movie found:', m?.id, m?.title);
  console.log('Download links count:', m?.downloadLinks?.length);
  console.log('Download links:', m?.downloadLinks);

  // Also check general download links count grouped or total
  const totalLinks = await prisma.downloadLink.count();
  console.log('Total DownloadLinks in DB:', totalLinks);

  const sampleLinks = await prisma.downloadLink.findMany({ take: 5 });
  console.log('Sample DownloadLinks in DB:', sampleLinks);

  await prisma.$disconnect();
}

run().catch(console.error);
