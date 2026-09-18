const http = require('http');

async function getTabWsUrl() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        const list = JSON.parse(raw);
        const tab = list.find(t => t.url && t.url.includes('movies4u.kg'));
        resolve(tab ? tab.webSocketDebuggerUrl : null);
      });
    }).on('error', reject);
  });
}

async function fetchPage(wsUrl, page = 1, perPage = 30) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
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
      const data = JSON.parse(event.data);
      if (data.id === page) {
        ws.close();
        resolve(data.result?.result?.value);
      }
    };
    ws.onerror = reject;
  });
}

async function main() {
  const wsUrl = await getTabWsUrl();
  console.log('WS URL:', wsUrl);
  if (!wsUrl) {
    console.error('No movies4u tab found!');
    return;
  }

  console.log('Fetching page 1 (30 posts)...');
  const postsP1 = await fetchPage(wsUrl, 1, 30);
  console.log('Page 1 fetched, count:', Array.isArray(postsP1) ? postsP1.length : 'Not array');
  if (Array.isArray(postsP1) && postsP1.length > 0) {
    console.log('Sample post title:', postsP1[0].title?.rendered);
  }
}

main().catch(console.error);
