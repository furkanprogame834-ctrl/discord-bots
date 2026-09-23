function toplaIsimler(girdi, guild) {
  const kisiler = [];
  const atilan = new Set();

  if (!girdi) return kisiler;

  const kelimeler = girdi.split(/\s+/);

  for (const kelime of kelimeler) {
    if (/^\d{17,20}$/.test(kelime)) {
      const m = guild.members.cache.get(kelime);
      if (m && !atilan.has(m.id)) { kisiler.push(m); atilan.add(m.id); }
      continue;
    }

    const mention = kelime.match(/^<@!?(\d+)>$/);
    if (mention) {
      const m = guild.members.cache.get(mention[1]);
      if (m && !atilan.has(m.id)) { kisiler.push(m); atilan.add(m.id); }
      continue;
    }

    const duz = kelime.toLowerCase().replace(/[^a-z0-9\u00C0-\u017F_]/gi, '');
    for (const m of guild.members.cache.values()) {
      if (atilan.has(m.id)) continue;
      const isim = (m.displayName || m.user.username || '').toLowerCase().replace(/[^a-z0-9\u00C0-\u017F_]/gi, '');
      if (isim === duz) {
        kisiler.push(m); atilan.add(m.id); break;
      }
    }
  }

  return kisiler;
}

module.exports = { toplaIsimler };
