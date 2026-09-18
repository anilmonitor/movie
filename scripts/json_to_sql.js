const fs = require('fs');
const path = require('path');

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

function parseDownloadLinks(html) {
  const links = [];
  if (!html) return links;

  const blocks = html.split(/(?=<h[34][^>]*>)/i);
  for (const block of blocks) {
    const qualityMatch = block.match(/Download\s+.*?(480p|720p|1080p|2160p|4k)/i);
    const sizeMatch = block.match(/\[([0-9.]+\s*(?:MB|GB))\]/i);

    const detectedQuality = qualityMatch ? qualityMatch[1].toUpperCase() : null;
    const detectedSize = sizeMatch ? sizeMatch[1].toUpperCase() : null;

    const hrefRegex = /href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
    let match;
    while ((match = hrefRegex.exec(block)) !== null) {
      const url = match[1].trim();
      const anchorText = match[2].replace(/<[^>]+>/g, '').trim();

      if (url.includes('movies4u.kg')) continue;
      if (!url.startsWith('http')) continue;

      const isMirror = url.includes('mdrive') || url.includes('mdisk') || url.includes('hubcloud') || url.includes('gdflix') || url.includes('drive');
      if (isMirror || anchorText.toLowerCase().includes('download') || anchorText.toLowerCase().includes('link')) {
        let q = detectedQuality;
        if (!q) {
          const qM = anchorText.match(/\b(480p|720p|1080p|2160p|4k)\b/i);
          if (qM) q = qM[1].toUpperCase();
        }
        let s = detectedSize;
        if (!s) {
          const sM = anchorText.match(/\[([0-9.]+\s*(?:MB|GB))\]/i);
          if (sM) s = sM[1].toUpperCase();
        }

        if (!links.some(l => l.url === url)) {
          links.push({
            title: anchorText || 'Download Link',
            url: url,
            quality: q || 'HD',
            size: s || null,
          });
        }
      }
    }
  }

  return links;
}

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

function convertJsonToSql(jsonFilePath, outputSqlPath) {
  if (!fs.existsSync(jsonFilePath)) {
    console.error(`File not found: ${jsonFilePath}`);
    process.exit(1);
  }

  console.log(`Reading JSON from ${jsonFilePath}...`);
  const rawData = fs.readFileSync(jsonFilePath, 'utf8');
  const posts = JSON.parse(rawData);

  if (!Array.isArray(posts)) {
    console.error('Invalid JSON: expected array of posts');
    process.exit(1);
  }

  console.log(`Found ${posts.length} posts. Generating SQL...`);

  const categoriesMap = new Map(); // slug -> { id, name, wpId }
  let nextCatId = 100;
  let nextMovieId = 1000;
  let nextLinkId = 5000;

  const sqlLines = [];
  sqlLines.push('-- Movie Man Complete Catalog SQL Dump');
  sqlLines.push('-- Generated: ' + new Date().toISOString());
  sqlLines.push('-- Total Posts in source: ' + posts.length);
  sqlLines.push('SET FOREIGN_KEY_CHECKS = 0;');
  sqlLines.push('');

  const movieInserts = [];
  const linkInserts = [];
  const catMovieInserts = [];

  for (const post of posts) {
    const rawTitle = decodeHtml(post.title?.rendered || '');
    const title = cleanTitle(rawTitle);
    const slug = post.slug || `movie-${post.id}`;
    const content = post.content?.rendered || '';

    if (!title) continue;

    // Year
    const yearMatch = rawTitle.match(/\b(19\d{2}|20\d{2})\b/) || content.match(/Released?\s*Year:\s*([^\n<]+)/i);
    const year = yearMatch ? yearMatch[1].trim() : null;

    // Rating
    const ratingMatch = content.match(/IMDb\s*Rating:?-?\s*([0-9.]+(?:\/10)?)/i);
    const rating = ratingMatch ? ratingMatch[1].replace('/10', '').trim() : null;

    // Qualities
    const qualities = [];
    const qMatches = rawTitle.match(/\b(480p|720p|1080p|2160p|4K|HQ-HDTC|WEB-DL)\b/gi) || [];
    for (const q of qMatches) {
      const uq = q.toUpperCase();
      if (!qualities.includes(uq)) qualities.push(uq);
    }

    // Languages
    const languages = [];
    const langMatch = content.match(/Language:\s*([^\n<]+)/i);
    if (langMatch) {
      const cleanLang = decodeHtml(langMatch[1].replace(/<[^>]+>/g, '')).trim();
      if (cleanLang) languages.push(cleanLang);
    }

    // Size
    const sizeMatch = content.match(/Size:\s*([^\n<]+)/i);
    const size = sizeMatch ? decodeHtml(sizeMatch[1].replace(/<[^>]+>/g, '')).trim() : null;

    // Storyline
    const storyMatch = content.match(/Storyline:?\s*([^\n<]+)/i);
    let storyline = storyMatch ? decodeHtml(storyMatch[1].replace(/<[^>]+>/g, '')).trim() : null;
    if (!storyline) {
      storyline = decodeHtml((post.excerpt?.rendered || '').replace(/<[^>]+>/g, '')).trim() || null;
    }

    // Poster
    let poster = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;
    if (!poster) {
      const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
      poster = imgMatch ? imgMatch[1] : null;
    }
    if (!poster) {
      poster = '/poster-placeholder.svg';
    }

    // Screenshots
    const screenshots = [];
    const ssRegex = /<img[^>]+src=["']([^"']+)["']/gi;
    let m;
    while ((m = ssRegex.exec(content)) !== null) {
      const src = m[1];
      if (src && !src.includes('logo') && !src.includes('banner') && src !== poster) {
        if (!screenshots.includes(src)) screenshots.push(src);
      }
    }

    // Parse links
    const dlLinks = parseDownloadLinks(content);

    // Categories
    const postCategories = [];
    if (post._embedded?.['wp:term']?.[0]) {
      for (const term of post._embedded['wp:term'][0]) {
        if (term.taxonomy === 'category') {
          const cName = decodeHtml(term.name);
          const cSlug = term.slug;
          if (!categoriesMap.has(cSlug)) {
            categoriesMap.set(cSlug, { id: nextCatId++, name: cName, wpId: term.id });
          }
          postCategories.push(categoriesMap.get(cSlug));
        }
      }
    }

    const mId = nextMovieId++;
    const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const postDate = post.date ? post.date.replace('T', ' ') : nowStr;

    movieInserts.push(
      `INSERT INTO \`Movie\` (\`id\`, \`wpId\`, \`slug\`, \`title\`, \`rawTitle\`, \`year\`, \`rating\`, \`size\`, \`storyline\`, \`poster\`, \`screenshots\`, \`languages\`, \`qualities\`, \`date\`, \`createdAt\`, \`updatedAt\`) VALUES (` +
      `${mId}, ${post.id}, ${escapeSql(slug)}, ${escapeSql(title)}, ${escapeSql(rawTitle)}, ${escapeSql(year)}, ${escapeSql(rating)}, ` +
      `${escapeSql(size)}, ${escapeSql(storyline)}, ${escapeSql(poster)}, ` +
      `${escapeSql(JSON.stringify(screenshots))}, ${escapeSql(JSON.stringify(languages))}, ${escapeSql(JSON.stringify(qualities))}, ` +
      `${escapeSql(postDate)}, '${nowStr}', '${nowStr}') ` +
      `ON DUPLICATE KEY UPDATE \`title\`=VALUES(\`title\`), \`poster\`=VALUES(\`poster\`), \`updatedAt\`=VALUES(\`updatedAt\`);`
    );

    for (const cat of postCategories) {
      catMovieInserts.push(`INSERT IGNORE INTO \`_CategoryToMovie\` (\`A\`, \`B\`) VALUES (${cat.id}, ${mId});`);
    }

    for (const link of dlLinks) {
      linkInserts.push(
        `INSERT INTO \`DownloadLink\` (\`id\`, \`movieId\`, \`title\`, \`url\`, \`quality\`, \`size\`, \`createdAt\`) VALUES (` +
        `${nextLinkId++}, ${mId}, ${escapeSql(link.title)}, ${escapeSql(link.url)}, ${escapeSql(link.quality)}, ${escapeSql(link.size)}, '${nowStr}') ` +
        `ON DUPLICATE KEY UPDATE \`url\`=VALUES(\`url\`), \`size\`=VALUES(\`size\`);`
      );
    }
  }

  // Categories DDL
  sqlLines.push('-- Categories');
  for (const [, cat] of categoriesMap) {
    sqlLines.push(
      `INSERT INTO \`Category\` (\`id\`, \`wpId\`, \`name\`, \`slug\`, \`count\`, \`createdAt\`, \`updatedAt\`) VALUES (` +
      `${cat.id}, ${cat.wpId}, ${escapeSql(cat.name)}, ${escapeSql(cat.slug)}, 0, NOW(), NOW()) ` +
      `ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`);`
    );
  }
  sqlLines.push('');

  // Movies
  sqlLines.push('-- Movies (' + movieInserts.length + ')');
  sqlLines.push(...movieInserts);
  sqlLines.push('');

  // Categories Relations
  sqlLines.push('-- Categories Relations');
  sqlLines.push(...catMovieInserts);
  sqlLines.push('');

  // Download Links
  sqlLines.push('-- Download Links (' + linkInserts.length + ')');
  sqlLines.push(...linkInserts);
  sqlLines.push('');

  sqlLines.push('SET FOREIGN_KEY_CHECKS = 1;');

  fs.writeFileSync(outputSqlPath, sqlLines.join('\n'), 'utf8');
  console.log(`\n🎉 Successfully generated: ${outputSqlPath}`);
  console.log(`- Total Movies: ${movieInserts.length}`);
  console.log(`- Total Download Links: ${linkInserts.length}`);
  console.log(`- File Size: ${(fs.statSync(outputSqlPath).size / 1024 / 1024).toFixed(2)} MB`);
}

const inputArg = process.argv[2] || path.join(__dirname, 'real_posts_all.json');
const outputArg = process.argv[3] || path.join(__dirname, 'catalog_all_movies.sql');
convertJsonToSql(inputArg, outputArg);
