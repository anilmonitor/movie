// MovieMan 1-Click Catalog Ingestion Script
(function() {
  if (window._movieManSyncActive) {
    alert("MovieMan Sync is already running!");
    return;
  }
  window._movieManSyncActive = true;

  // Create UI overlay
  const container = document.createElement('div');
  container.id = 'movieman-sync-box';
  container.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 360px;
    background: #0d131f;
    border: 2px solid #ef4444;
    border-radius: 16px;
    padding: 16px;
    color: #fff;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 13px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.8);
    z-index: 9999999;
    line-height: 1.5;
  `;

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
      <div style="display:flex; align-items:center; gap:8px;">
        <div style="width:10px; height:10px; border-radius:50%; background:#22c55e; box-shadow:0 0 8px #22c55e;" id="mm-status-dot"></div>
        <strong style="font-size:14px; font-weight:800; letter-spacing:0.5px; color:#fff;">MOVIE MAN SYNC</strong>
      </div>
      <button id="mm-pause-btn" style="background:#374151; color:#fff; border:none; border-radius:6px; padding:3px 10px; font-size:11px; cursor:pointer; font-weight:bold;">Pause</button>
    </div>
    <div style="background:#1e293b; border-radius:8px; height:10px; width:100%; overflow:hidden; margin-bottom:10px;">
      <div id="mm-progress-bar" style="background:linear-gradient(90deg, #ef4444, #f97316); width:0%; height:100%; transition:width 0.3s ease;"></div>
    </div>
    <div id="mm-status-text" style="color:#94a3b8; font-size:12px; margin-bottom:6px;">Starting synchronization...</div>
    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px; background:#1e293b; padding:8px; border-radius:8px; text-align:center; font-size:11px;">
      <div><span style="color:#94a3b8;">Page:</span> <strong id="mm-stat-page" style="color:#f8fafc;">1 / 160</strong></div>
      <div><span style="color:#94a3b8;">Added:</span> <strong id="mm-stat-added" style="color:#22c55e;">0</strong></div>
      <div><span style="color:#94a3b8;">Updated:</span> <strong id="mm-stat-updated" style="color:#38bdf8;">0</strong></div>
    </div>
  `;

  document.body.appendChild(container);

  const statusDot = document.getElementById('mm-status-dot');
  const progressBar = document.getElementById('mm-progress-bar');
  const statusText = document.getElementById('mm-status-text');
  const statPage = document.getElementById('mm-stat-page');
  const statAdded = document.getElementById('mm-stat-added');
  const statUpdated = document.getElementById('mm-stat-updated');
  const pauseBtn = document.getElementById('mm-pause-btn');

  let isPaused = false;
  pauseBtn.onclick = () => {
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? "Resume" : "Pause";
    pauseBtn.style.background = isPaused ? "#ef4444" : "#374151";
    statusText.textContent = isPaused ? "Sync paused by user." : "Resuming...";
  };

  const API_ENDPOINT = "https://movieman4u.vercel.app/api/admin/sync";
  const ADMIN_EMAIL = "anilarangi6@gmail.com";
  const ADMIN_PASS = "movieman@admin2024";
  const TOTAL_PAGES = 160;
  const START_PAGE = parseInt(localStorage.getItem('mm_last_page') || '1', 10);

  let totalAdded = 0;
  let totalUpdated = 0;

  async function runSync() {
    for (let page = START_PAGE; page <= TOTAL_PAGES; page++) {
      while (isPaused) {
        await new Promise(r => setTimeout(r, 500));
      }

      statPage.textContent = `${page} / ${TOTAL_PAGES}`;
      const pct = Math.round((page / TOTAL_PAGES) * 100);
      progressBar.style.width = `${pct}%`;
      statusText.innerHTML = `Fetching page <b>${page}</b> of ${TOTAL_PAGES} (50 posts)...`;

      let posts = [];
      let retries = 0;
      while (retries < 3) {
        try {
          const res = await fetch(`/wp-json/wp/v2/posts?_embed=1&per_page=50&page=${page}`);
          if (!res.ok && res.status === 400) {
            // End of pages reached
            statusText.textContent = "🎉 Reached end of posts catalog!";
            progressBar.style.width = '100%';
            return;
          }
          posts = await res.json();
          if (Array.isArray(posts)) break;
        } catch (e) {
          retries++;
          statusText.textContent = `Retrying page ${page} (attempt ${retries})...`;
          await new Promise(r => setTimeout(r, 2000));
        }
      }

      if (!Array.isArray(posts) || posts.length === 0) {
        statusText.textContent = `All available posts synced (${page - 1} pages)!`;
        progressBar.style.width = '100%';
        break;
      }

      statusText.innerHTML = `Saving <b>${posts.length}</b> movies to Hostinger MySQL...`;

      try {
        const syncRes = await fetch(API_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-email": ADMIN_EMAIL,
            "x-admin-passcode": ADMIN_PASS
          },
          body: JSON.stringify({ posts })
        });

        const data = await syncRes.json();
        totalAdded += (data.added || 0);
        totalUpdated += (data.updated || 0);

        statAdded.textContent = totalAdded;
        statUpdated.textContent = totalUpdated;
        localStorage.setItem('mm_last_page', String(page + 1));
      } catch (err) {
        console.error(`Error saving page ${page}:`, err);
        statusText.textContent = `Failed page ${page}, retrying next...`;
      }

      // Small 300ms breather
      await new Promise(r => setTimeout(r, 300));
    }

    statusDot.style.background = "#38bdf8";
    statusDot.style.boxShadow = "0 0 8px #38bdf8";
    progressBar.style.width = "100%";
    statusText.innerHTML = `<b>🎉 SUCCESS!</b> All movies saved in Hostinger MySQL.`;
    localStorage.removeItem('mm_last_page');
  }

  runSync();
})();
