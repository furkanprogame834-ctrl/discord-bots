const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'film-db.json');

function loadDb() {
  try {
    if (fs.existsSync(dbPath)) return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  } catch (e) {}
  return { filmler: [] };
}

function saveDb(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

function yeniId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

const TURLER = [
  'Aksiyon', 'Macera', 'Animasyon', 'Belgesel', 'Bilim Kurgu', 'Dram',
  'Fantastik', 'Gerilim', 'Komedi', 'Korku', 'Muzikal', 'Romantik',
];

module.exports = { dbPath, loadDb, saveDb, yeniId, TURLER };