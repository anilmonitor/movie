const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const [totalMovies, totalCategories, totalLinks] = await Promise.all([
    prisma.movie.count(),
    prisma.category.count(),
    prisma.downloadLink.count()
  ]);

  const latestLinks = await prisma.downloadLink.findMany({
    take: 5,
    orderBy: { id: 'desc' },
    select: {
      id: true,
      movieId: true,
      title: true,
      quality: true,
      size: true,
      url: true
    }
  });

  console.log('=== VERIFIED DOWNLOAD LINKS ===');
  console.log(JSON.stringify(latestLinks, null, 2));

  await prisma.$disconnect();
}

check().catch(console.error);
