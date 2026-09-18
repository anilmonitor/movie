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
    poster: 'https://image.tmdb.org/t/p/w500/m2zELz9XmD3s1B8d2kXvP2W6M4.jpg',
    screenshots: ['https://image.tmdb.org/t/p/w780/m2zELz9XmD3s1B8d2kXvP2W6M4.jpg'],
    categories: ['Bollywood', 'Hindi', 'Comedy', 'Horror'],
    downloadLinks: [
      { title: 'Download 480p [450MB]', url: 'https://movies4u.kg/download/stree-2-480p', quality: '480p', size: '450MB' },
      { title: 'Download 720p HEVC [950MB]', url: 'https://movies4u.kg/download/stree-2-720p', quality: '720p', size: '950MB' },
      { title: 'Download 1080p FHD [2.1GB]', url: 'https://movies4u.kg/download/stree-2-1080p', quality: '1080p', size: '2.1GB' },
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
    poster: 'https://image.tmdb.org/t/p/w500/3UoJ4w2Vqf91rN0D3S2fW3L8b8V.jpg',
    screenshots: ['https://image.tmdb.org/t/p/w780/3UoJ4w2Vqf91rN0D3S2fW3L8b8V.jpg'],
    categories: ['South Indian', 'Dual Audio', 'Action', 'Sci-Fi & Fantasy'],
    downloadLinks: [
      { title: 'Download 480p [550MB]', url: 'https://movies4u.kg/download/kalki-480p', quality: '480p', size: '550MB' },
      { title: 'Download 720p [1.3GB]', url: 'https://movies4u.kg/download/kalki-720p', quality: '720p', size: '1.3GB' },
      { title: 'Download 1080p [2.8GB]', url: 'https://movies4u.kg/download/kalki-1080p', quality: '1080p', size: '2.8GB' },
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
      { title: 'Download 480p [480MB]', url: 'https://movies4u.kg/download/dp-wolverine-480p', quality: '480p', size: '480MB' },
      { title: 'Download 720p [1.1GB]', url: 'https://movies4u.kg/download/dp-wolverine-720p', quality: '720p', size: '1.1GB' },
      { title: 'Download 1080p [2.4GB]', url: 'https://movies4u.kg/download/dp-wolverine-1080p', quality: '1080p', size: '2.4GB' },
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
    poster: 'https://image.tmdb.org/t/p/w500/zDZow7elTij7Aelr8P96w6u11h8.jpg',
    screenshots: ['https://image.tmdb.org/t/p/w780/zDZow7elTij7Aelr8P96w6u11h8.jpg'],
    categories: ['Bollywood', 'Hindi', 'Action'],
    downloadLinks: [
      { title: 'Download 480p [500MB]', url: 'https://movies4u.kg/download/fighter-480p', quality: '480p', size: '500MB' },
      { title: 'Download 720p [1.2GB]', url: 'https://movies4u.kg/download/fighter-720p', quality: '720p', size: '1.2GB' },
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
      { title: 'Download 720p [1.4GB]', url: 'https://movies4u.kg/download/dune-2-720p', quality: '720p', size: '1.4GB' },
      { title: 'Download 1080p [3.1GB]', url: 'https://movies4u.kg/download/dune-2-1080p', quality: '1080p', size: '3.1GB' },
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
    poster: 'https://image.tmdb.org/t/p/w500/hr9rjR4JOpFiIM3j4dHJfACH3cu.jpg',
    screenshots: ['https://image.tmdb.org/t/p/w780/hr9rjR4JOpFiIM3j4dHJfACH3cu.jpg'],
    categories: ['Bollywood', 'Hindi', 'Action', 'Drama'],
    downloadLinks: [
      { title: 'Download 480p [600MB]', url: 'https://movies4u.kg/download/animal-480p', quality: '480p', size: '600MB' },
      { title: 'Download 720p [1.5GB]', url: 'https://movies4u.kg/download/animal-720p', quality: '720p', size: '1.5GB' },
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
    poster: 'https://image.tmdb.org/t/p/w500/7dJ5v46X2rQf6u8kL78w8m4t.jpg',
    screenshots: ['https://image.tmdb.org/t/p/w780/7dJ5v46X2rQf6u8kL78w8m4t.jpg'],
    categories: ['Web Series', 'Hindi', 'Crime & Mystery', 'Drama'],
    downloadLinks: [
      { title: 'Download All Episodes 720p [2.8GB]', url: 'https://movies4u.kg/download/mirzapur-s3-720p', quality: '720p', size: '2.8GB' },
      { title: 'Download All Episodes 1080p [5.5GB]', url: 'https://movies4u.kg/download/mirzapur-s3-1080p', quality: '1080p', size: '5.5GB' },
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
    poster: 'https://image.tmdb.org/t/p/w500/oEuhXGqMfZw59j7Z6QGg7l8f.jpg',
    screenshots: ['https://image.tmdb.org/t/p/w780/oEuhXGqMfZw59j7Z6QGg7l8f.jpg'],
    categories: ['Bollywood', 'Hindi', 'Drama'],
    downloadLinks: [
      { title: 'Download 720p [1.1GB]', url: 'https://movies4u.kg/download/12th-fail-720p', quality: '720p', size: '1.1GB' },
      { title: 'Download 1080p [2.2GB]', url: 'https://movies4u.kg/download/12th-fail-1080p', quality: '1080p', size: '2.2GB' },
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
    poster: 'https://image.tmdb.org/t/p/w500/404n3tQW2d3m5R9d6f8m3v.jpg',
    screenshots: ['https://image.tmdb.org/t/p/w780/404n3tQW2d3m5R9d6f8m3v.jpg'],
    categories: ['South Indian', 'Dual Audio', 'Action', 'Thriller'],
    downloadLinks: [
      { title: 'Download 720p [1.3GB]', url: 'https://movies4u.kg/download/salaar-720p', quality: '720p', size: '1.3GB' },
      { title: 'Download 1080p [2.6GB]', url: 'https://movies4u.kg/download/salaar-1080p', quality: '1080p', size: '2.6GB' },
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
    poster: 'https://image.tmdb.org/t/p/w500/xVbY4wQz7r6G8m4k8L8h8.jpg',
    screenshots: ['https://image.tmdb.org/t/p/w780/xVbY4wQz7r6G8m4k8L8h8.jpg'],
    categories: ['Web Series', 'Hindi', 'Comedy', 'Drama'],
    downloadLinks: [
      { title: 'Download All Episodes 720p [1.8GB]', url: 'https://movies4u.kg/download/panchayat-s3-720p', quality: '720p', size: '1.8GB' },
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
    poster: 'https://image.tmdb.org/t/p/w500/jWsHn5J0wHj5H8o6K7m8.jpg',
    screenshots: ['https://image.tmdb.org/t/p/w780/jWsHn5J0wHj5H8o6K7m8.jpg'],
    categories: ['Bollywood', 'Hindi', 'Action', 'Thriller'],
    downloadLinks: [
      { title: 'Download 720p [1.3GB]', url: 'https://movies4u.kg/download/jawan-720p', quality: '720p', size: '1.3GB' },
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
    poster: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    screenshots: ['https://image.tmdb.org/t/p/w780/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg'],
    categories: ['Hollywood', 'Dual Audio', 'Drama'],
    downloadLinks: [
      { title: 'Download 720p [1.6GB]', url: 'https://movies4u.kg/download/oppenheimer-720p', quality: '720p', size: '1.6GB' },
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

    await prisma.downloadLink.deleteMany({ where: { movieId: movie.id } });
    await prisma.downloadLink.createMany({
      data: m.downloadLinks.map((l) => ({
        movieId: movie.id,
        title: l.title,
        url: l.url,
        quality: l.quality,
        size: l.size,
      })),
    });

    console.log(`Synced: ${m.title}`);
  }

  const count = await prisma.movie.count();
  console.log(`DONE! Total movies in Hostinger MySQL DB: ${count}`);
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error('Seed error:', e);
  process.exit(1);
});
