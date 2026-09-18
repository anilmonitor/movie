// MovieMan 1-Click Complete .SQL Generator & Downloader
(function() {
  if (window._movieManSqlActive) {
    alert("SQL Generator is already running!");
    return;
  }
  window._movieManSqlActive = true;

  // Create UI overlay
  const container = document.createElement('div');
  container.id = 'movieman-sql-box';
  container.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 380px;
    background: #0b1120;
    border: 2px solid #ef4444;
    border-radius: 16px;
    padding: 18px;
    color: #fff;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 13px;
    box-shadow: 0 15px 40px rgba(0,0,0,0.9);
    z-index: 99999999;
    line-height: 1.5;
  `;

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
      <div style="display:flex; align-items:center; gap:8px;">
        <div style="width:10px; height:10px; border-radius:50%; background:#22c55e; box-shadow:0 0 10px #22c55e;" id="sql-dot"></div>
        <strong style="font-size:15px; font-weight:800; color:#fff;">MOVIE MAN .SQL GENERATOR</strong>
      </div>
      <button id="sql-finish-btn" style="background:#2563eb; color:#fff; border:none; border-radius:6px; padding:4px 10px; font-size:11px; cursor:pointer; font-weight:bold;">Save SQL Now</button>
    </div>
    <div style="background:#1e293b; border-radius:8px; height:12px; width:100%; overflow:hidden; margin-bottom:12px;">
      <div id="sql-bar" style="background:linear-gradient(90deg, #ef4444, #f59e0b, #10b981); width:0%; height:100%; transition:width 0.3s ease;"></div>
    </div>
    <div id="sql-status" style="color:#94a3b8; font-size:12px; margin-bottom:8px;">Preparing catalog download...</div>
    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px; background:#1e293b; padding:8px; border-radius:8px; text-align:center; font-size:11px;">
      <div><span style="color:#94a3b8;">Page:</span> <strong id="sql-stat-page" style="color:#f8fafc;">0 / 160</strong></div>
      <div><span style="color:#94a3b8;">Movies:</span> <strong id="sql-stat-movies" style="color:#22c55e;">0</strong></div>
      <div><span style="color:#94a3b8;">Links:</span> <strong id="sql-stat-links" style="color:#38bdf8;">0</strong></div>
    </div>
  `;

  document.body.appendChild(container);

  const bar = document.getElementById('sql-bar');
  const status = document.getElementById('sql-status');
  const statPage = document.getElementById('sql-stat-page');
  const statMovies = document.getElementById('sql-stat-movies');
  const statLinks = document.getElementById('sql-stat-links');
  const finishBtn = document.getElementById('sql-finish-btn');

  function decodeHtml(t) {
    if (!t) return '';
    const txt = document.createElement('textarea');
    txt.innerHTML = t;
    return txt.value.trim();
  }

  function cleanTitle(raw) {
    const decoded = decodeHtml(raw);
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

    const m = title.match(/^(.*?)\s*\(\d{4}\)/);
    if (m && m[1].length > 2) title = m[1].trim();
    return title || decoded;
  }

  function parseDownloadLinks(html) {
    const links = [];
    if (!html) return links;
    const blocks = html.split(/(?=<h[34][^>]*>)/i);
    for (const block of blocks) {
      const qM = block.match(/Download\s+.*?(480p|720p|1080p|2160p|4k)/i);
      const sM = block.match(/\[([0-9.]+\s*(?:MB|GB))\]/i);
      const dQ = qM ? qM[1].toUpperCase() : null;
      const dS = sM ? sM[1].toUpperCase() : null;

      const regex = /href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
      let match;
      while ((match = regex.exec(block)) !== null) {
        const url = match[1].trim();
        const text = match[2].replace(/<[^>]+>/g, '').trim();
        if (url.includes('movies4u.kg') || !url.startsWith('http')) continue;

        const isMirror = url.includes('mdrive') || url.includes('mdisk') || url.includes('hubcloud') || url.includes('gdflix') || url.includes('drive');
        if (isMirror || text.toLowerCase().includes('download') || text.toLowerCase().includes('link')) {
          let q = dQ;
          if (!q) {
            const m = text.match(/\b(480p|720p|1080p|2160p|4k)\b/i);
            if (m) q = m[1].toUpperCase();
          }
          let s = dS;
          if (!s) {
            const m = text.match(/\[([0-9.]+\s*(?:MB|GB))\]/i);
            if (m) s = m[1].toUpperCase();
          }
          if (!links.some(l => l.url === url)) {
            links.push({ title: text || 'Download Link', url, quality: q || 'HD', size: s || null });
          }
        }
      }
    }
    return links;
  }

  function escapeSql(val) {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number' || typeof val === 'boolean') return val;
    const str = String(val)
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\r/g, '\\r')
      .replace(/\n/g, '\\n')
      .replace(/\x00/g, '\\0');
    return `'${str}'`;
  }

  const categoriesMap = new Map();
  let nextCatId = 1;
  let nextMovieId = 1;
  let nextLinkId = 1;

  const movieSql = [];
  const linkSql = [];
  const joinSql = [];

  let totalMovies = 0;
  let totalLinks = 0;
  let isDone = false;

  function triggerDownload() {
    isDone = true;
    status.innerHTML = "<b>Building .SQL file...</b>";

    const lines = [];
    lines.push('-- Movie Man Complete Catalog Dump');
    lines.push('-- Generated: ' + new Date().toISOString());
    lines.push('SET FOREIGN_KEY_CHECKS = 0;');
    lines.push('');

    // Categories
    lines.push('-- Categories');
    for (const [, cat] of categoriesMap) {
      lines.push(
        `INSERT INTO \`Category\` (\`id\`, \`wpId\`, \`name\`, \`slug\`, \`count\`, \`createdAt\`, \`updatedAt\`) VALUES ` +
        `(${cat.id}, ${cat.wpId}, ${escapeSql(cat.name)}, ${escapeSql(cat.slug)}, 0, NOW(), NOW()) ` +
        `ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`);`
      );
    }
    lines.push('');

    // Movies
    lines.push(`-- Movies (${movieSql.length})`);
    lines.push(...movieSql);
    lines.push('');

    // CategoryJoins
    lines.push(`-- Category Joins (${joinSql.length})`);
    lines.push(...joinSql);
    lines.push('');

    // Download Links
    lines.push(`-- Download Links (${linkSql.length})`);
    lines.push(...linkSql);
    lines.push('');

    lines.push('SET FOREIGN_KEY_CHECKS = 1;');

    const blob = new Blob([lines.join('\n')], { type: 'application/sql;charset=utf-8' });
    const dlUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = dlUrl;
    a.download = `movies_full_catalog_${totalMovies}_movies.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    status.innerHTML = `<b>🎉 Downloaded!</b> ${totalMovies} movies saved in .SQL file.`;
    bar.style.width = '100%';
  }

  finishBtn.onclick = triggerDownload;

  async function processCatalog() {
    const TOTAL_PAGES = 160;

    for (let page = 1; page <= TOTAL_PAGES; page++) {
      if (isDone) break;

      statPage.textContent = `${page} / ${TOTAL_PAGES}`;
      bar.style.width = `${Math.round((page / TOTAL_PAGES) * 100)}%`;
      status.innerHTML = `Fetching page <b>${page}</b> of ${TOTAL_PAGES}...`;

      let posts = [];
      try {
        const res = await fetch(`/wp-json/wp/v2/posts?_embed=1&per_page=50&page=${page}`);
        if (!res.ok && res.status === 400) {
          status.innerHTML = "Reached catalog end!";
          break;
        }
        posts = await res.json();
      } catch (e) {
        console.error(e);
        await new Promise(r => setTimeout(r, 1500));
        continue;
      }

      if (!Array.isArray(posts) || posts.length === 0) break;

      for (const post of posts) {
        const rawTitle = decodeHtml(post.title?.rendered || '');
        const title = cleanTitle(rawTitle);
        const slug = post.slug || `movie-${post.id}`;
        const content = post.content?.rendered || '';
        if (!title) continue;

        const yearMatch = rawTitle.match(/\b(19\d{2}|20\d{2})\b/) || content.match(/Released?\s*Year:\s*([^\n<]+)/i);
        const year = yearMatch ? yearMatch[1].trim() : null;

        const ratingMatch = content.match(/IMDb\s*Rating:?-?\s*([0-9.]+(?:\/10)?)/i);
        const rating = ratingMatch ? ratingMatch[1].replace('/10', '').trim() : null;

        const qualities = [];
        const qMatches = rawTitle.match(/\b(480p|720p|1080p|2160p|4K|HQ-HDTC|WEB-DL)\b/gi) || [];
        for (const q of qMatches) {
          const uq = q.toUpperCase();
          if (!qualities.includes(uq)) qualities.push(uq);
        }

        const languages = [];
        const langMatch = content.match(/Language:\s*([^\n<]+)/i);
        if (langMatch) {
          const cleanLang = decodeHtml(langMatch[1].replace(/<[^>]+>/g, '')).trim();
          if (cleanLang) languages.push(cleanLang);
        }

        const sizeMatch = content.match(/Size:\s*([^\n<]+)/i);
        const size = sizeMatch ? decodeHtml(sizeMatch[1].replace(/<[^>]+>/g, '')).trim() : null;

        const storyMatch = content.match(/Storyline:?\s*([^\n<]+)/i);
        let storyline = storyMatch ? decodeHtml(storyMatch[1].replace(/<[^>]+>/g, '')).trim() : null;
        if (!storyline) {
          storyline = decodeHtml((post.excerpt?.rendered || '').replace(/<[^>]+>/g, '')).trim() || null;
        }

        let poster = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;
        if (!poster) {
          const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
          poster = imgMatch ? imgMatch[1] : '/poster-placeholder.svg';
        }

        const screenshots = [];
        const ssRegex = /<img[^>]+src=["']([^"']+)["']/gi;
        let m;
        while ((m = ssRegex.exec(content)) !== null) {
          const src = m[1];
          if (src && !src.includes('logo') && !src.includes('banner') && src !== poster) {
            if (!screenshots.includes(src)) screenshots.push(src);
          }
        }

        const dlLinks = parseDownloadLinks(content);
        const postCategories = [];
        if (post._embedded?.['wp:term']?.[0]) {
          for (const term of post._embedded['wp:term'][0]) {
            if (term.taxonomy === 'category') {
              const cName = decodeHtml(term.name);
              const cSlug = term.slug;
              if (!categoriesMap.has(cSlug)) {
                categoriesMap.set(cSlug, { id: nextCatId++, name: cName, wpId: term.id, slug: cSlug });
              }
              postCategories.push(categoriesMap.get(cSlug));
            }
          }
        }

        const mId = nextMovieId++;
        const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const postDate = post.date ? post.date.replace('T', ' ') : nowStr;

        movieSql.push(
          `INSERT INTO \`Movie\` (\`id\`, \`wpId\`, \`slug\`, \`title\`, \`rawTitle\`, \`year\`, \`rating\`, \`size\`, \`storyline\`, \`poster\`, \`screenshots\`, \`languages\`, \`qualities\`, \`date\`, \`createdAt\`, \`updatedAt\`) VALUES ` +
          `(${mId}, ${post.id}, ${escapeSql(slug)}, ${escapeSql(title)}, ${escapeSql(rawTitle)}, ${escapeSql(year)}, ${escapeSql(rating)}, ` +
          `${escapeSql(size)}, ${escapeSql(storyline)}, ${escapeSql(poster)}, ` +
          `${escapeSql(JSON.stringify(screenshots))}, ${escapeSql(JSON.stringify(languages))}, ${escapeSql(JSON.stringify(qualities))}, ` +
          `${escapeSql(postDate)}, '${nowStr}', '${nowStr}') ` +
          `ON DUPLICATE KEY UPDATE \`title\`=VALUES(\`title\`), \`poster\`=VALUES(\`poster\`), \`updatedAt\`=VALUES(\`updatedAt\`);`
        );

        for (const cat of postCategories) {
          joinSql.push(`INSERT IGNORE INTO \`_CategoryToMovie\` (\`A\`, \`B\`) VALUES (${cat.id}, ${mId});`);
        }

        for (const link of dlLinks) {
          linkSql.push(
            `INSERT INTO \`DownloadLink\` (\`id\`, \`movieId\`, \`title\`, \`url\`, \`quality\`, \`size\`, \`createdAt\`) VALUES ` +
            `(${nextLinkId++}, ${mId}, ${escapeSql(link.title)}, ${escapeSql(link.url)}, ${escapeSql(link.quality)}, ${escapeSql(link.size)}, '${nowStr}') ` +
            `ON DUPLICATE KEY UPDATE \`url\`=VALUES(\`url\`), \`size\`=VALUES(\`size\`);`
          );
        }

        totalMovies++;
        totalLinks += dlLinks.length;
      }

      statMovies.textContent = totalMovies;
      statLinks.textContent = totalLinks;
      await new Promise(r => setTimeout(r, 200));
    }

    if (!isDone) triggerDownload();
  }

  processCatalog();
})();
