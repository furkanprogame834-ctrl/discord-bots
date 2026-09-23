const https = require('https');

function fetchRss(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseRss(xml) {
  const items = [];
  const regex = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = regex.exec(xml)) !== null) {
    const block = m[1];
    const title = (block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || block.match(/<title>([\s\S]*?)<\/title>/))?.[1] || '';
    const link = block.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '';
    const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || '';
    const descMatch = block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || block.match(/<description>([\s\S]*?)<\/description>/);
    let desc = descMatch?.[1] || '';
    desc = desc.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();
    if (title && link) {
      items.push({ title: title.replace(/<!\[CDATA\[|\]\]>/g, ''), link, pubDate, desc: desc.slice(0, 200) });
    }
  }
  return items;
}

async function sonHaberler(limit = 8) {
  const url = 'https://news.google.com/rss?hl=tr&gl=TR&ceid=TR:tr';
  const xml = await fetchRss(url);
  const items = parseRss(xml).slice(0, limit);
  return items.map((it, i) => ({ no: i + 1, ...it }));
}

async function haberAra(kelime, limit = 8) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(kelime)}&hl=tr&gl=TR&ceid=TR:tr`;
  const xml = await fetchRss(url);
  const items = parseRss(xml).slice(0, limit);
  return items.map((it, i) => ({ no: i + 1, ...it }));
}

module.exports = { sonHaberler, haberAra };
