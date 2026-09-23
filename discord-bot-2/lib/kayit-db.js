const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'kayit-db.json');

function loadDb() {
  try {
    if (fs.existsSync(dbPath)) return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  } catch (e) {}
  return {};
}
function saveDb(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

function uyeEkle(guildId, member) {
  const db = loadDb();
  if (!db[guildId]) db[guildId] = [];
  const varMi = db[guildId].some(k => k.id === member.id);
  if (varMi) return { eklendi: false };
  db[guildId].push({
    id: member.id,
    isim: member.user.username,
    tag: member.user.tag,
    zaman: Date.now(),
  });
  if (db[guildId].length > 100) db[guildId] = db[guildId].slice(-100);
  saveDb(db);
  return { eklendi: true, sayi: db[guildId].length };
}

function listele(guildId) {
  const db = loadDb();
  return (db[guildId] || []).slice().reverse();
}

module.exports = { loadDb, saveDb, uyeEkle, listele };