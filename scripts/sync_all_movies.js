const http = require('http');
const https = require('https');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper to decode HTML entities
function decodeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8216;/g, '‘')
    .replace(/&#8217;/g, '’')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&#8230;/g, '…')
    .replace(/&nbsp;/g, ' ')
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .trim();
}

// Clean title
function cleanTitle(rawTitle) {
  const decoded = decodeHtml(rawTitle);
  let title = decoded
    .replace(/\b(480p|720p|1080p|2160p|4K|HQ-HDTC|WEB-DL|Blu-Ray|HDRip|HDCAMRip|HDCAM)\b/gi, '')
    .replace(/\|/g, '')
    .replace(/\s*–\s*/g, ' - ')
    .replace(/\s*-\s*$/, '')
    .replace(/\[.*?Added.*?\]/gi, '')
    .replace(/\{.*?Added.*?\}/gi, '')
    .replace(/\(Season\s*\d+(?:-\d+)?\)/gi, '')
    .replace(/Full Movie/gi, '')
    .replace(/WEB Series/gi, '')
    .replace(/Reality Show/gi, '')
    .replace(/TV Show/gi, '')
    .replace(/LiNE/gi, '')
    .replace(/Clean/gi, '')
    .replace(/ORG\.?/gi, '')
    .trim();

  const nameWithYear = title.match(/^(.*?)\s*\(\d{4}\)/);
  if (nameWithYear && nameWithYear[1].length > 2) {
    title = nameWithYear[1].trim();
  }
  return title || decoded;
}

// Parse download links accurately block-by-block
function parseDownloadLinks(html) {
  const links = [];
  if (!html) return links;

  const blocks = html.split(/(?=<h[34][^>]*>)/i);
  const seenUrls = new Set();

  for (const block of blocks) {
    const headingMatch = block.match(/<h[34][^>]*>(.*?)<\/h[34]>/i);
    if (!headingMatch) continue;

    const heading = decodeHtml(headingMatch[1].replace(/<[^>]+>/g, '').trim());
    const lowerHead = heading.toLowerCase();

    // Skip metadata headings
    if (
      lowerHead.includes('movie info') ||
      lowerHead.includes('series info') ||
      lowerHead.includes('show info') ||
      lowerHead.includes('storyline') ||
      lowerHead.includes('screenshot')
    ) {
      continue;
    }

    const aMatch = block.match(/<a\s+[^>]*href=["']([^"']+)["']/i);
    if (!aMatch) continue;

    const url = aMatch[1].trim();
    if (
      !url ||
      url.includes('movies4u.kg') ||
      url.includes('t.me') ||
      url.includes('how-to-download') ||
      url.startsWith('#') ||
      seenUrls.has(url)
    ) {
      continue;
    }

    seenUrls.add(url);

    const qMatch = heading.match(/\b(480p|720p|1080p|2160p|4K|HEVC)\b/i);
    const sMatch = heading.match(/\[?([0-9.]+\s*(?:MB|GB)(?:\/[A-Za-z]+)?)\]?/i);

    links.push({
      title: heading,
      url: url,
      quality: qMatch ? qMatch[1].toUpperCase() : undefined,
      size: sMatch ? sMatch[1] : undefined,
    });
  }

  // Fallback
  if (links.length === 0) {
    const buttonRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>(?:<button[^>]*>)?([\s\S]*?)(?:<\/button>)?<\/a>/gi;
    let btnMatch;
    while ((btnMatch = buttonRegex.exec(html)) !== null) {
      const url = btnMatch[1].trim();
      const text = decodeHtml(btnMatch[2].replace(/<[^>]+>/g, '').trim());
      if (
        url &&
        !seenUrls.has(url) &&
        !url.includes('movies4u.kg') &&
        !url.includes('t.me') &&
        !url.includes('how-to-download') &&
        !url.startsWith('#')
      ) {
        seenUrls.add(url);
        links.push({
          title: text || 'Download Mirror',
          url: url,
          quality: 'HD',
        });
      }
    }
  }

  return links;
}

// Fetch poster buffer with Referer header and convert to base64
function fetchPosterAsBase64(url) {
  if (!url || !url.startsWith('http')) return Promise.resolve(url);
  return new Promise((resolve) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'Referer': 'https://movies4u.kg/',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      },
      timeout: 6000
    }, (res) => {
      if (res.statusCode !== 200) {
        return resolve(url);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const mime = res.headers['content-type'] || 'image/webp';
        resolve(`data:${mime};base64,${buffer.toString('base64')}`);
      });
    }).on('error', () => resolve(url));
  });
}

// Get active CDP WebSocket URL
function getTabWsUrl() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try {
          const list = JSON.parse(raw);
          const tab = list.find(t => t.url && t.url.includes('movies4u.kg'));
          resolve(tab ? tab.webSocketDebuggerUrl : null);
        } catch (_) {
          resolve(null);
        }
      });
    }).on('error', reject);
  });
}

// Fetch page via Chrome Tab
function fetchPageViaWs(wsUrl, page = 1, perPage = 30) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const timer = setTimeout(() => {
      try { ws.close(); } catch (_) {}
      reject(new Error(`Timeout fetching page ${page}`));
    }, 20000);

    ws.onopen = () => {
      const expr = `
        fetch('https://movies4u.kg/wp-json/wp/v2/posts?_embed=1&per_page=${perPage}&page=${page}')
          .then(r => r.json())
      `;
      ws.send(JSON.stringify({
        id: page,
        method: 'Runtime.evaluate',
        params: { expression: expr, awaitPromise: true, returnByValue: true }
      }));
    };

    ws.onmessage = (event) => {
      clearTimeout(timer);
      const data = JSON.parse(event.data);
      if (data.id === page) {
        ws.close();
        resolve(data.result?.result?.value);
      }
    };

    ws.onerror = (e) => {
      clearTimeout(timer);
      reject(e);
    };
  });
}

async function main() {
  const wsUrl = await getTabWsUrl();
  console.log('Connected to Chrome Tab:', wsUrl);
  if (!wsUrl) {
    console.error('No movies4u tab found!');
    process.exit(1);
  }

  const PAGES_TO_FETCH = 4; // 4 pages x 30 = 120 latest movies
  const PER_PAGE = 30;

  let totalProcessed = 0;
  let totalAdded = 0;
  let totalUpdated = 0;

  for (let page = 1; page <= PAGES_TO_FETCH; page++) {
    console.log(`\n======================================================`);
    console.log(`[Page ${page}/${PAGES_TO_FETCH}] Fetching ${PER_PAGE} movies from movies4u.kg...`);
    
    let posts;
    try {
      posts = await fetchPageViaWs(wsUrl, page, PER_PAGE);
    } catch (err) {
      console.error(`Failed to fetch page ${page}:`, err.message);
      continue;
    }

    if (!Array.isArray(posts) || posts.length === 0) {
      console.log(`No more posts on page ${page}. Stopping.`);
      break;
    }

    console.log(`Received ${posts.length} posts for page ${page}. Processing and saving into Hostinger MySQL...`);

    for (const post of posts) {
      const rawTitle = decodeHtml(post.title?.rendered || '');
      const title = cleanTitle(rawTitle);
      const slug = post.slug;
      const content = post.content?.rendered || '';

      if (!title || !slug) continue;

      // Extract year
      const yearMatch = rawTitle.match(/\b(19\d{2}|20\d{2})\b/) || content.match(/Released?\s*Year:\s*([^\n<]+)/i);
      const year = yearMatch ? yearMatch[1].trim() : undefined;

      // Extract rating
      const ratingMatch = content.match(/IMDb\s*Rating:?-?\s*([0-9.]+(?:\/10)?)/i);
      const rating = ratingMatch ? ratingMatch[1].replace('/10', '').trim() : undefined;

      // Extract qualities
      const qualities = [];
      const qMatches = rawTitle.match(/\b(480p|720p|1080p|2160p|4K|HQ-HDTC|WEB-DL)\b/gi) || [];
      for (const q of qMatches) {
        const uq = q.toUpperCase();
        if (!qualities.includes(uq)) qualities.push(uq);
      }

      // Extract languages
      const languages = [];
      const langMatch = content.match(/Language:\s*([^\n<]+)/i);
      if (langMatch) {
        languages.push(...langMatch[1].split(/[,|+]|\band\b/i).map(s => s.trim()).filter(Boolean));
      }

      // Extract storyline
      let storyline = null;
      const storyMatch = content.match(/Storyline:<\/h[23]>\s*<p>(.*?)<\/p>/i) || content.match(/Storyline:<\/h[23]>\s*([^<]+)/i);
      if (storyMatch) {
        storyline = decodeHtml(storyMatch[1].replace(/<[^>]+>/g, '').trim());
      }

      // Extract poster
      let posterUrl = '';
      try {
        const media = post._embedded?.['wp:featuredmedia'];
        if (Array.isArray(media) && media.length > 0) {
          posterUrl = media[0].source_url || '';
        }
      } catch (_) {}

      // Convert poster to base64
      let poster = posterUrl;
      if (posterUrl) {
        poster = await fetchPosterAsBase64(posterUrl);
      }

      // Extract screenshots
      const screenshots = [];
      const imgRegex = /<img\s+[^>]*src=["']([^"']+)["']/gi;
      let imgMatch;
      while ((imgMatch = imgRegex.exec(content)) !== null) {
        const src = imgMatch[1].trim();
        if (
          src &&
          !src.includes('gravatar') &&
          !src.includes('emoji') &&
          (src.includes('catimages.org') || src.includes('pixelbb.com') || src.includes('image')) &&
          !screenshots.includes(src)
        ) {
          screenshots.push(src);
        }
      }

      // Extract categories
      const categories = [];
      try {
        const terms = post._embedded?.['wp:term'];
        if (Array.isArray(terms) && terms.length > 0) {
          const catList = terms[0];
          if (Array.isArray(catList)) {
            for (const c of catList) {
              const catName = decodeHtml(c.name || '');
              const catSlug = c.slug || '';
              if (catSlug && catSlug !== 'uncategorized') {
                categories.push({ name: catName, slug: catSlug, wpId: c.id });
              }
            }
          }
        }
      } catch (_) {}

      // Extract download links
      const downloadLinks = parseDownloadLinks(content);

      // Extract size
      let size = undefined;
      const sizeMatch = content.match(/Size:\s*([^\n<]+)/i);
      if (sizeMatch) {
        size = sizeMatch[1].trim();
      } else if (downloadLinks.length > 0 && downloadLinks[0].size) {
        size = downloadLinks[0].size;
      }

      // Parse date
      let movieDate = null;
      if (post.date) {
        const d = new Date(post.date);
        if (!isNaN(d.getTime())) movieDate = d;
      }

      // Category connectOrCreate
      const categoryConnectOrCreate = categories.map((cat) => ({
        where: { slug: cat.slug },
        create: {
          wpId: cat.wpId > 0 ? cat.wpId : undefined,
          name: cat.name,
          slug: cat.slug,
        },
      }));

      // Upsert Movie in Prisma
      const movie = await prisma.movie.upsert({
        where: { slug },
        update: {
          wpId: post.id,
          title,
          rawTitle,
          year,
          rating,
          size,
          storyline,
          poster: poster || posterUrl || '',
          screenshots,
          languages,
          qualities: qualities.length > 0 ? qualities : ['HD'],
          date: movieDate,
          categories: {
            connectOrCreate: categoryConnectOrCreate,
          },
        },
        create: {
          wpId: post.id,
          slug,
          title,
          rawTitle,
          year,
          rating,
          size,
          storyline,
          poster: poster || posterUrl || '',
          screenshots,
          languages,
          qualities: qualities.length > 0 ? qualities : ['HD'],
          date: movieDate,
          categories: {
            connectOrCreate: categoryConnectOrCreate,
          },
        },
      });

      // Update download links
      if (downloadLinks.length > 0) {
        await prisma.downloadLink.deleteMany({ where: { movieId: movie.id } });
        await prisma.downloadLink.createMany({
          data: downloadLinks.map((link) => ({
            movieId: movie.id,
            title: link.title,
            url: link.url,
            quality: link.quality,
            size: link.size,
          })),
        });
      }

      if (movie.createdAt.getTime() === movie.updatedAt.getTime()) {
        totalAdded++;
      } else {
        totalUpdated++;
      }
      totalProcessed++;
      console.log(`  ✓ [${movie.id}] "${title}" (${downloadLinks.length} links, poster: ${poster.startsWith('data:') ? 'base64' : 'url'})`);
    }

    console.log(`Page ${page} complete! Processed: ${posts.length}`);
  }

  console.log(`\n======================================================`);
  console.log(`SYNC FINISHED! Total processed: ${totalProcessed}, Added: ${totalAdded}, Updated: ${totalUpdated}`);
  
  const totalCountInDb = await prisma.movie.count();
  console.log(`Total movies now in Hostinger MySQL: ${totalCountInDb}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Fatal sync error:', e);
  process.exit(1);
});
