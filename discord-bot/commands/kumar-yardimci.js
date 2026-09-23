const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'balans-db.json');
const kumarDbPath = path.join(__dirname, '..', 'kumarhane-db.json');

function loadJson(p) {
  try { if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) {}
  return {};
}

function saveJson(p, d) {
  fs.writeFileSync(p, JSON.stringify(d, null, 2));
}

function bakiyEkle(userId, miktar) {
  const db = loadJson(dbPath);
  if (!db[userId]) db[userId] = { para: 0, sonBonus: 0 };
  db[userId].para = (db[userId].para || 0) + miktar;
  saveJson(dbPath, db);
  return db[userId].para;
}

function bakiyeAl(userId) {
  const db = loadJson(dbPath);
  if (!db[userId]) db[userId] = { para: 0, sonBonus: 0 };
  return db[userId].para || 0;
}

function paraCikar(userId, miktar) {
  const db = loadJson(dbPath);
  if (!db[userId]) db[userId] = { para: 0, sonBonus: 0 };
  const mevcut = db[userId].para || 0;
  if (mevcut < miktar) return false;
  db[userId].para = mevcut - miktar;
  saveJson(dbPath, db);
  return true;
}

function kumarIzinli(guildId, kanalId) {
  const db = loadJson(kumarDbPath);
  const g = db[guildId];
  if (!g) return false;
  if (g.kapali) return false;
  if (!g.izinliKanal) return true;
  return g.izinliKanal === kanalId;
}

function kumarYasakli(guildId, userId) {
  const db = loadJson(kumarDbPath);
  return db[guildId]?.yasakli?.includes(userId) || false;
}

function oyunSayaciArttir(userId) {
  const db = loadJson(kumarDbPath);
  if (!db[userId]) db[userId] = {};
  db[userId].oyun = (db[userId].oyun || 0) + 1;
  saveJson(kumarDbPath, db);
  return db[userId].oyun;
}

function oyunSayisiAl(userId) {
  const db = loadJson(kumarDbPath);
  return db[userId]?.oyun || 0;
}

async function kumarSayacVeRol(interaction) {
  const guildId = interaction.guild?.id;
  const userId = interaction.user.id;
  if (!guildId) return 0;

  const sayac = oyunSayaciArttir(userId);

  const db = loadJson(kumarDbPath);
  const ayar = db[guildId]?.kumarRol;

  if (ayar && sayac >= ayar.gerekliOyun) {
    try {
      const uye = await interaction.guild.members.fetch(userId);
      if (!uye.roles.cache.has(ayar.rolId)) {
        await uye.roles.add(ayar.rolId);
        if (!db[guildId].verilenRoller) db[guildId].verilenRoller = {};
        db[guildId].verilenRoller[userId] = sayac;
        saveJson(kumarDbPath, db);
        try {
          await interaction.channel?.send({ content: `:tada: **${interaction.user.username}**, ${ayar.gerekliOyun} kumar oynadin! **<@&${ayar.rolId}>** rolünü kazandin!` });
        } catch (e) {}
      }
    } catch (e) {}
  }

  return sayac;
}

module.exports = {
  dbPath,
  kumarDbPath,
  loadJson,
  saveJson,
  bakiyEkle,
  bakiyeAl,
  paraCikar,
  kumarIzinli,
  kumarYasakli,
  oyunSayaciArttir,
  oyunSayisiAl,
  kumarSayacVeRol,
};
