const fs = require('fs');
const posts = JSON.parse(fs.readFileSync('scripts/real_posts_all.json', 'utf8'));

for (const p of posts.slice(0, 5)) {
  console.log('====================================');
  console.log('POST ID:', p.id);
  console.log('TITLE:', p.title.rendered);
  console.log('SLUG:', p.slug);
  
  // Find all a hrefs
  const aRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
  let aMatch;
  while ((aMatch = aRegex.exec(p.content.rendered)) !== null) {
    const href = aMatch[1];
    const text = aMatch[2].replace(/<[^>]+>/g, '').trim();
    console.log('  [A HREF]:', href, ' | text:', text);
  }
}
