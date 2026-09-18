async function test() {
  const ws = new WebSocket('ws://127.0.0.1:9222/devtools/page/F757B79E53F7182326B62376146209B1');
  ws.onopen = () => {
    const expr = `
      fetch('https://movies4u.kg/wp-content/uploads/2026/09/Vibe-1.webp')
        .then(r => r.blob())
        .then(blob => new Promise(resolve => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        }))
    `;
    ws.send(JSON.stringify({
      id: 2,
      method: 'Runtime.evaluate',
      params: { expression: expr, awaitPromise: true }
    }));
  };
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id === 2) {
      const base64 = data.result?.result?.value;
      console.log('Base64 length:', base64?.length);
      console.log('Base64 start:', base64?.slice(0, 50));
      ws.close();
      process.exit(0);
    }
  };
  ws.onerror = (e) => {
    console.error('Error:', e);
    process.exit(1);
  };
}

test();
