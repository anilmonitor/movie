const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const sampleMovies = [
  {
    wpId: 1001,
    slug: 'stree-2-2024-hindi',
    title: 'Stree 2: Sarkate Ka Aatank',
    rawTitle: 'Stree 2 (2024) Hindi 480p | 720p | 1080p HQ HDRip Full Movie',
    year: '2024',
    rating: '7.8',
    languages: ['Hindi'],
    qualities: ['480P', '720P', '1080P', '4K'],
    size: '1.2 GB',
    storyline:
      'After the events of Stree, the town of Chanderi is being haunted by a new headless monster named Sarkata who abducts modern independent women. Vicky and his friends must team up once again to save their town.',
    poster: 'https://m.media-amazon.com/images/M/MV5BMjA4NzUyNWEtZTI0Mi00MThhLThlYjktYzA1Y2VjYmFiY2I5XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
    screenshots: ['https://m.media-amazon.com/images/M/MV5BMjA4NzUyNWEtZTI0Mi00MThhLThlYjktYzA1Y2VjYmFiY2I5XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg'],
    categories: ['Bollywood', 'Hindi', 'Comedy', 'Horror'],
    downloadLinks: [
      { title: 'Download 480p [450MB] - Direct Cloud', url: 'https://hubcloud.club/drive/stree2-480p-hindi', quality: '480p', size: '450MB' },
      { title: 'Download 720p HEVC [950MB] - Fast Server', url: 'https://hubcloud.club/drive/stree2-720p-hevc', quality: '720p', size: '950MB' },
      { title: 'Download 1080p FHD [2.1GB] - Ultra HD', url: 'https://hubcloud.club/drive/stree2-1080p-fhd', quality: '1080p', size: '2.1GB' },
    ],
    date: new Date('2024-08-16T12:00:00Z'),
  },
  {
    wpId: 1002,
    slug: 'kalki-2898-ad-2024',
    title: 'Kalki 2898 AD',
    rawTitle: 'Kalki 2898 AD (2024) Multi Audio Hindi + Telugu 480p 720p 1080p WEB-DL',
    year: '2024',
    rating: '7.6',
    languages: ['Hindi', 'Telugu', 'Tamil', 'English'],
    qualities: ['480P', '720P', '1080P', '4K'],
    size: '1.8 GB',
    storyline:
      'Set in a post-apocalyptic world in the year 2898 AD, a modern avatar of Vishnu descends to Earth to protect the world from evil forces in the city of Kasi.',
    poster: 'https://m.media-amazon.com/images/M/MV5BZGQ1NWFiZjEtYTI2MS00N2Y3LTkzMDAtODExYzQ3ZDQ3YWFjXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
    screenshots: ['https://m.media-amazon.com/images/M/MV5BZGQ1NWFiZjEtYTI2MS00N2Y3LTkzMDAtODExYzQ3ZDQ3YWFjXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg'],
    categories: ['South Indian', 'Dual Audio', 'Action', 'Sci-Fi & Fantasy'],
    downloadLinks: [
      { title: 'Download 480p [550MB] - Direct Cloud', url: 'https://hubcloud.club/drive/kalki-480p-multi', quality: '480p', size: '550MB' },
      { title: 'Download 720p [1.3GB] - Fast Server', url: 'https://hubcloud.club/drive/kalki-720p-multi', quality: '720p', size: '1.3GB' },
      { title: 'Download 1080p [2.8GB] - Ultra HD', url: 'https://hubcloud.club/drive/kalki-1080p-multi', quality: '1080p', size: '2.8GB' },
    ],
    date: new Date('2024-07-28T14:30:00Z'),
  },
  {
    wpId: 1003,
    slug: 'deadpool-and-wolverine-2024',
    title: 'Deadpool & Wolverine',
    rawTitle: 'Deadpool and Wolverine (2024) Dual Audio [Hindi-English] 720p 1080p WEB-DL',
    year: '2024',
    rating: '8.0',
    languages: ['Hindi', 'English'],
    qualities: ['720P', '1080P', '4K'],
    size: '1.5 GB',
    storyline:
      'Wade Wilson’s peaceful life is shattered when the Time Variance Authority recruits him to help safeguard the multiverse alongside a reluctant Wolverine.',
    poster: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
    screenshots: ['https://image.tmdb.org/t/p/w780/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg'],
    categories: ['Hollywood', 'Dual Audio', 'Action', 'Comedy'],
    downloadLinks: [
      { title: 'Download 480p [480MB] - Direct Cloud', url: 'https://hubcloud.club/drive/dp-wolverine-480p', quality: '480p', size: '480MB' },
      { title: 'Download 720p [1.1GB] - Fast Server', url: 'https://hubcloud.club/drive/dp-wolverine-720p', quality: '720p', size: '1.1GB' },
      { title: 'Download 1080p [2.4GB] - Ultra HD', url: 'https://hubcloud.club/drive/dp-wolverine-1080p', quality: '1080p', size: '2.4GB' },
    ],
    date: new Date('2024-07-26T10:15:00Z'),
  },
  {
    wpId: 1004,
    slug: 'fighter-2024-hindi',
    title: 'Fighter',
    rawTitle: 'Fighter (2024) Hindi 480p | 720p | 1080p HDRip Full Movie',
    year: '2024',
    rating: '7.0',
    languages: ['Hindi'],
    qualities: ['480P', '720P', '1080P'],
    size: '1.4 GB',
    storyline:
      'Top IAF aviators come together in the face of imminent danger to form Air Dragons, giving their all for the country whilst going through emotional highs and lows.',
    poster: 'https://m.media-amazon.com/images/M/MV5BM2M0YzQyOTktMjkzYS00YjVlLWI5YjktN2FjMDliMjg1Y2U1XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
    screenshots: ['https://m.media-amazon.com/images/M/MV5BM2M0YzQyOTktMjkzYS00YjVlLWI5YjktN2FjMDliMjg1Y2U1XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg'],
    categories: ['Bollywood', 'Hindi', 'Action'],
    downloadLinks: [
      { title: 'Download 480p [500MB] - Direct Cloud', url: 'https://hubcloud.club/drive/fighter-480p-hindi', quality: '480p', size: '500MB' },
      { title: 'Download 720p [1.2GB] - Fast Server', url: 'https://hubcloud.club/drive/fighter-720p-hindi', quality: '720p', size: '1.2GB' },
      { title: 'Download 1080p [2.5GB] - Ultra HD', url: 'https://hubcloud.club/drive/fighter-1080p-hindi', quality: '1080p', size: '2.5GB' },
    ],
    date: new Date('2024-03-21T09:00:00Z'),
  },
  {
    wpId: 1005,
    slug: 'dune-part-two-2024',
    title: 'Dune: Part Two',
    rawTitle: 'Dune Part Two (2024) Dual Audio Hindi ORG + English 720p 1080p BluRay',
    year: '2024',
    rating: '8.6',
    languages: ['Hindi', 'English'],
    qualities: ['720P', '1080P', '4K'],
    size: '2.2 GB',
    storyline:
      'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
    poster: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    screenshots: ['https://image.tmdb.org/t/p/w780/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg'],
    categories: ['Hollywood', 'Dual Audio', 'Sci-Fi & Fantasy', 'Adventure'],
    downloadLinks: [
      { title: 'Download 720p [1.4GB] - Direct Cloud', url: 'https://hubcloud.club/drive/dune2-720p-dual', quality: '720p', size: '1.4GB' },
      { title: 'Download 1080p [3.1GB] - Ultra HD', url: 'https://hubcloud.club/drive/dune2-1080p-dual', quality: '1080p', size: '3.1GB' },
    ],
    date: new Date('2024-04-16T18:45:00Z'),
  },
  {
    wpId: 1006,
    slug: 'animal-2023-hindi',
    title: 'Animal',
    rawTitle: 'Animal (2023) Hindi 480p 720p 1080p WEB-DL Clean Audio',
    year: '2023',
    rating: '6.8',
    languages: ['Hindi'],
    qualities: ['480P', '720P', '1080P'],
    size: '1.7 GB',
    storyline:
      'A father-son bond carved in blood. Ranvijay sets out on a ruthless path of vengeance across the globe when an assassination attempt is made on his father.',
    poster: 'https://m.media-amazon.com/images/M/MV5BNGViM2M4NmUtMmNkNy00MTU5LWIyYzgtYDA2NzFiZGU4MzVkXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
    screenshots: ['https://m.media-amazon.com/images/M/MV5BNGViM2M4NmUtMmNkNy00MTU5LWIyYzgtYDA2NzFiZGU4MzVkXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg'],
    categories: ['Bollywood', 'Hindi', 'Action', 'Drama'],
    downloadLinks: [
      { title: 'Download 480p [600MB] - Direct Cloud', url: 'https://hubcloud.club/drive/animal-480p-hindi', quality: '480p', size: '600MB' },
      { title: 'Download 720p [1.5GB] - Fast Server', url: 'https://hubcloud.club/drive/animal-720p-hindi', quality: '720p', size: '1.5GB' },
      { title: 'Download 1080p [3.0GB] - Ultra HD', url: 'https://hubcloud.club/drive/animal-1080p-hindi', quality: '1080p', size: '3.0GB' },
    ],
    date: new Date('2024-01-26T08:30:00Z'),
  },
  {
    wpId: 1007,
    slug: 'mirzapur-season-3',
    title: 'Mirzapur (Season 3)',
    rawTitle: 'Mirzapur Season 3 Complete Hindi [All Episodes] 720p 1080p WEB Series',
    year: '2024',
    rating: '8.5',
    languages: ['Hindi'],
    qualities: ['720P', '1080P'],
    size: '3.5 GB',
    storyline:
      'Guddu and Golu stake their claim to the throne of Mirzapur while Kaleen Bhaiya plots his ultimate resurgence in the heartland of Purvanchal.',
    poster: 'https://m.media-amazon.com/images/M/MV5BZDU5ZGYzZTYtMTZhYS00MjY1LWE4MmItYmI2M2RkOTYwZWE2XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
    screenshots: ['https://m.media-amazon.com/images/M/MV5BZDU5ZGYzZTYtMTZhYS00MjY1LWE4MmItYmI2M2RkOTYwZWE2XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg'],
    categories: ['Web Series', 'Hindi', 'Crime & Mystery', 'Drama'],
    downloadLinks: [
      { title: 'Download All Episodes 720p [2.8GB] - Fast Server', url: 'https://hubcloud.club/drive/mirzapur-s3-720p', quality: '720p', size: '2.8GB' },
      { title: 'Download All Episodes 1080p [5.5GB] - Ultra HD', url: 'https://hubcloud.club/drive/mirzapur-s3-1080p', quality: '1080p', size: '5.5GB' },
    ],
    date: new Date('2024-07-05T00:00:00Z'),
  },
  {
    wpId: 1008,
    slug: '12th-fail-2023',
    title: '12th Fail',
    rawTitle: '12th Fail (2023) Hindi 480p 720p 1080p WEB-DL Full Movie',
    year: '2023',
    rating: '8.9',
    languages: ['Hindi'],
    qualities: ['480P', '720P', '1080P'],
    size: '1.2 GB',
    storyline:
      'Inspired by real-life events, Manoj Kumar Sharma from Chambal overcomes extreme poverty, academic setbacks, and relentless struggles to crack the prestigious UPSC exam.',
    poster: 'https://m.media-amazon.com/images/M/MV5BOTU2NWVmMzYtNDVjMC00NWY2LWFmZTUtYzg2MGNhZGUzYmM2XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
    screenshots: ['https://m.media-amazon.com/images/M/MV5BOTU2NWVmMzYtNDVjMC00NWY2LWFmZTUtYzg2MGNhZGUzYmM2XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg'],
    categories: ['Bollywood', 'Hindi', 'Drama'],
    downloadLinks: [
      { title: 'Download 720p [1.1GB] - Direct Cloud', url: 'https://hubcloud.club/drive/12thfail-720p-hindi', quality: '720p', size: '1.1GB' },
      { title: 'Download 1080p [2.2GB] - Ultra HD', url: 'https://hubcloud.club/drive/12thfail-1080p-hindi', quality: '1080p', size: '2.2GB' },
    ],
    date: new Date('2023-12-29T11:00:00Z'),
  },
  {
    wpId: 1009,
    slug: 'salaar-part-1-ceasefire-2023',
    title: 'Salaar: Part 1 – Ceasefire',
    rawTitle: 'Salaar (2023) Multi Audio [Hindi + Telugu] 480p 720p 1080p HDRip',
    year: '2023',
    rating: '7.5',
    languages: ['Hindi', 'Telugu', 'Tamil', 'Kannada'],
    qualities: ['480P', '720P', '1080P'],
    size: '1.6 GB',
    storyline:
      'In the violent dystopian city-state of Khansaar, Deva returns from exile to help his childhood friend Varadha secure his rightful place as the ruler.',
    poster: 'https://m.media-amazon.com/images/M/MV5BMmU1YWU1MmMtMTNkMy00OGZmLTgwOWYtNjc5NmVkMDFmNTM2XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
    screenshots: ['https://m.media-amazon.com/images/M/MV5BMmU1YWU1MmMtMTNkMy00OGZmLTgwOWYtNjc5NmVkMDFmNTM2XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg'],
    categories: ['South Indian', 'Dual Audio', 'Action', 'Thriller'],
    downloadLinks: [
      { title: 'Download 720p [1.4GB] - Direct Cloud', url: 'https://hubcloud.club/drive/salaar-720p-multi', quality: '720p', size: '1.4GB' },
      { title: 'Download 1080p [2.9GB] - Ultra HD', url: 'https://hubcloud.club/drive/salaar-1080p-multi', quality: '1080p', size: '2.9GB' },
    ],
    date: new Date('2024-01-20T16:20:00Z'),
  },
  {
    wpId: 1010,
    slug: 'panchayat-season-3',
    title: 'Panchayat (Season 3)',
    rawTitle: 'Panchayat Season 3 Complete Hindi WEB-DL 720p 1080p',
    year: '2024',
    rating: '8.9',
    languages: ['Hindi'],
    qualities: ['720P', '1080P'],
    size: '2.1 GB',
    storyline:
      'Abhishek Tripathi tackles local elections, village politics, and administrative rivalries in the quirky village of Phulera.',
    poster: 'https://m.media-amazon.com/images/M/MV5BMjY5ZGE1N2ItMjA1Zi00YmY5LWI4NGEtNmQzYWMzOWExYTFmXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
    screenshots: ['https://m.media-amazon.com/images/M/MV5BMjY5ZGE1N2ItMjA1Zi00YmY5LWI4NGEtNmQzYWMzOWExYTFmXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg'],
    categories: ['Web Series', 'Hindi', 'Comedy', 'Drama'],
    downloadLinks: [
      { title: 'Download All Episodes 720p [1.8GB] - Fast Server', url: 'https://hubcloud.club/drive/panchayat-s3-720p', quality: '720p', size: '1.8GB' },
    ],
    date: new Date('2024-05-28T05:00:00Z'),
  },
  {
    wpId: 1011,
    slug: 'jawan-2023-hindi',
    title: 'Jawan',
    rawTitle: 'Jawan (2023) Extended Cut Hindi 480p 720p 1080p HDRip',
    year: '2023',
    rating: '7.4',
    languages: ['Hindi', 'Tamil', 'Telugu'],
    qualities: ['480P', '720P', '1080P', '4K'],
    size: '1.5 GB',
    storyline:
      'A prison warden driven by a personal vendetta recruits inmates to commit outrageous acts of vigilante justice to right the wrongs of society.',
    poster: 'https://m.media-amazon.com/images/M/MV5BN2E1ZWI1NzUtOTk4OC00YzQ4LThjYmQtODhjNWU3OWEzODFkXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
    screenshots: ['https://m.media-amazon.com/images/M/MV5BN2E1ZWI1NzUtOTk4OC00YzQ4LThjYmQtODhjNWU3OWEzODFkXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg'],
    categories: ['Bollywood', 'Hindi', 'Action', 'Thriller'],
    downloadLinks: [
      { title: 'Download 480p [500MB] - Direct Cloud', url: 'https://hubcloud.club/drive/jawan-480p-hindi', quality: '480p', size: '500MB' },
      { title: 'Download 720p [1.3GB] - Fast Server', url: 'https://hubcloud.club/drive/jawan-720p-hindi', quality: '720p', size: '1.3GB' },
      { title: 'Download 1080p [2.6GB] - Ultra HD', url: 'https://hubcloud.club/drive/jawan-1080p-hindi', quality: '1080p', size: '2.6GB' },
    ],
    date: new Date('2023-11-02T10:00:00Z'),
  },
  {
    wpId: 1012,
    slug: 'oppenheimer-2023',
    title: 'Oppenheimer',
    rawTitle: 'Oppenheimer (2023) Dual Audio [Hindi + English] 720p 1080p BluRay',
    year: '2023',
    rating: '8.9',
    languages: ['Hindi', 'English'],
    qualities: ['720P', '1080P', '4K'],
    size: '2.5 GB',
    storyline:
      'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during the Manhattan Project.',
    poster: 'https://m.media-amazon.com/images/M/MV5BMDBmYTZjNjUtN2M1MS00MTQ2LTk2ODgtNzc2M2QyZGE5NTVjXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
    screenshots: ['https://m.media-amazon.com/images/M/MV5BMDBmYTZjNjUtN2M1MS00MTQ2LTk2ODgtNzc2M2QyZGE5NTVjXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg'],
    categories: ['Hollywood', 'Dual Audio', 'Drama'],
    downloadLinks: [
      { title: 'Download 720p [1.6GB] - Direct Cloud', url: 'https://hubcloud.club/drive/oppenheimer-720p-dual', quality: '720p', size: '1.6GB' },
      { title: 'Download 1080p [3.4GB] - Ultra HD', url: 'https://hubcloud.club/drive/oppenheimer-1080p-dual', quality: '1080p', size: '3.4GB' },
    ],
    date: new Date('2023-11-21T14:00:00Z'),
  },
];

async function seed() {
  console.log('Seeding initial movie catalog into Hostinger MySQL...');

  for (const m of sampleMovies) {
    const categoriesConnectOrCreate = m.categories.map((catName) => {
      const slug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return {
        where: { slug },
        create: { name: catName, slug },
      };
    });

    const movie = await prisma.movie.upsert({
      where: { slug: m.slug },
      update: {
        wpId: m.wpId,
        title: m.title,
        rawTitle: m.rawTitle,
        year: m.year,
        rating: m.rating,
        size: m.size,
        storyline: m.storyline,
        poster: m.poster,
        screenshots: m.screenshots,
        languages: m.languages,
        qualities: m.qualities,
        date: m.date,
        categories: { connectOrCreate: categoriesConnectOrCreate },
      },
      create: {
        wpId: m.wpId,
        slug: m.slug,
        title: m.title,
        rawTitle: m.rawTitle,
        year: m.year,
        rating: m.rating,
        size: m.size,
        storyline: m.storyline,
        poster: m.poster,
        screenshots: m.screenshots,
        languages: m.languages,
        qualities: m.qualities,
        date: m.date,
        categories: { connectOrCreate: categoriesConnectOrCreate },
      },
    });

    await prisma.downloadLink.deleteMany({
      where: { movieId: movie.id },
    });

    await prisma.downloadLink.createMany({
      data: m.downloadLinks.map((link) => ({
        movieId: movie.id,
        title: link.title,
        url: link.url,
        quality: link.quality,
        size: link.size,
      })),
    });

    console.log(`Seeded: ${m.title}`);
  }

  console.log('Seed completed successfully!');
}

seed()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
