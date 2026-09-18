const fs = require('fs');
const http = require('http');
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

  // Fallback if no heading-based links found: look for download buttons
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

// Get active CDP WebSocket URL
function getCdpWsUrl() {
  return new Promise((resolve) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let raw = '';
      res.on('data', (c) => (raw += c));
      res.on('end', () => {
        try {
          const list = JSON.parse(raw);
          const page = list.find((p) => p.type === 'page' && p.webSocketDebuggerUrl);
          resolve(page ? page.webSocketDebuggerUrl : null);
        } catch (_) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

// Convert image URL to base64 data URI using browser session
async function fetchImageAsBase64(wsUrl, imageUrl) {
  if (!wsUrl || !imageUrl) return null;
  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(wsUrl);
      const timer = setTimeout(() => {
        try { ws.close(); } catch (_) {}
        resolve(null);
      }, 5000);

      ws.onopen = () => {
        const expr = `
          fetch(${JSON.stringify(imageUrl)})
            .then(r => r.blob())
            .then(blob => new Promise(res => {
              const reader = new FileReader();
              reader.onloadend = () => res(reader.result);
              reader.readAsDataURL(blob);
            }))
            .catch(() => null)
        `;
        ws.send(JSON.stringify({
          id: 100,
          method: 'Runtime.evaluate',
          params: { expression: expr, awaitPromise: true }
        }));
      };

      ws.onmessage = (event) => {
        clearTimeout(timer);
        try {
          const data = JSON.parse(event.data);
          if (data.id === 100) {
            const val = data.result?.result?.value;
            ws.close();
            resolve(val && typeof val === 'string' && val.startsWith('data:image') ? val : null);
          }
        } catch (_) {
          ws.close();
          resolve(null);
        }
      };

      ws.onerror = () => {
        clearTimeout(timer);
        resolve(null);
      };
    } catch (_) {
      resolve(null);
    }
  });
}

async function main() {
  console.log('Loading real posts from scripts/real_posts_all.json...');
  const posts = JSON.parse(fs.readFileSync('scripts/real_posts_all.json', 'utf8'));
  console.log(`Found ${posts.length} real posts.`);

  const wsUrl = await getCdpWsUrl();
  console.log('CDP WebSocket URL:', wsUrl ? 'Connected' : 'Not available');

  // Clear existing dummy movies
  console.log('Deleting existing dummy movies from Hostinger DB...');
  await prisma.movie.deleteMany();
  console.log('Database cleared.');

  let insertedCount = 0;

  for (const post of posts) {
    const rawTitle = decodeHtml(post.title?.rendered || '');
    const title = cleanTitle(rawTitle);
    const slug = post.slug;
    const content = post.content?.rendered || '';

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
      languages.push(...langMatch[1].split(/[,|+]|\band\b/i).map((s) => s.trim()).filter(Boolean));
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

    // Convert poster to base64 if CDP available
    let poster = posterUrl;
    if (wsUrl && posterUrl) {
      process.stdout.write(`Fetching base64 for ${title}... `);
      const b64 = await fetchImageAsBase64(wsUrl, posterUrl);
      if (b64) {
        poster = b64;
        console.log(`OK (${(b64.length / 1024).toFixed(1)} KB)`);
      } else {
        console.log('Fallback to URL');
      }
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

    // Create Movie
    const createdMovie = await prisma.movie.create({
      data: {
        wpId: post.id,
        slug: slug,
        title: title,
        rawTitle: rawTitle,
        year: year,
        rating: rating,
        size: size,
        storyline: storyline,
        poster: poster || posterUrl || 'https://via.placeholder.com/300x450',
        screenshots: screenshots,
        languages: languages,
        qualities: qualities.length > 0 ? qualities : ['HD'],
        date: movieDate,
        categories: {
          connectOrCreate: categoryConnectOrCreate,
        },
        downloadLinks: {
          create: downloadLinks.map((link) => ({
            title: link.title,
            url: link.url,
            quality: link.quality,
            size: link.size,
          })),
        },
      },
    });

    console.log(`Inserted: "${createdMovie.title}" (${slug}) with ${downloadLinks.length} links, ${screenshots.length} screenshots.`);
    insertedCount++;
  }

  console.log(`\nAll done! Successfully inserted ${insertedCount} real movies into Hostinger DB.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Fatal error during ingestion:', err);
  process.exit(1);
});
