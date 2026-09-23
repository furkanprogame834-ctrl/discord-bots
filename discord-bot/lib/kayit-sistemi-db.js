const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'kayit-sistemi-db.json');

function loadDb() {
  try {
    if (fs.existsSync(dbPath)) return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  } catch (e) {}
  return {};
}
function saveDb(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

module.exports = { dbPath, loadDb, saveDb };