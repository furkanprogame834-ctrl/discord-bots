const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const xpDbPath = path.join(__dirname, '..', 'xp-db.json');
const { bakiyEkle } = require('./commands/kumar-yardimci.js');

function loadJson(p) {
  try { if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) {}
  return {};
}
function saveJson(p, d) { fs.writeFileSync(p, JSON.stringify(d, null, 2)); }

const levelRoleDbPath = path.join(__dirname, '..', 'level-roles.json');

function loadXpDb() {
  try {
    if (fs.existsSync(xpDbPath)) return JSON.parse(fs.readFileSync(xpDbPath, 'utf8'));
  } catch (e) {}
  return {};
}

function saveXpDb(db) {
  fs.writeFileSync(xpDbPath, JSON.stringify(db, null, 2));
}

function getLevel(xp) {
  return Math.floor(0.1 * Math.sqrt(xp));
}

function getXpForLevel(level) {
  return Math.pow(level / 0.1, 2);
}

module.exports = {
  name: 'xp-handler',
  execute(message) {
    if (message.author.bot) return;

    const db = loadXpDb();
    const userId = message.author.id;

    if (!db[userId]) db[userId] = { xp: 0, level: 0, mesaj: 0 };

    const xpGain = Math.floor(Math.random() * 8) + 3;
    db[userId].xp += xpGain;
    db[userId].mesaj = (db[userId].mesaj || 0) + 1;

    const oldLevel = db[userId].level;
    const newLevel = getLevel(db[userId].xp);
    db[userId].level = newLevel;

    saveXpDb(db);

    if (newLevel > oldLevel && newLevel > 0) {
      // Level atladikca artan odul: 1. seviye 5.000, her seviyede +1.000 TL
      const levelPara = 5000 + (newLevel - 1) * 1000;
      const yeniBakiye = bakiyEkle(userId, levelPara);

      let paraMsg = `\n:moneybag: **+${levelPara.toLocaleString('tr-TR')} TL** kumarhane parasi kazandin! (Yeni bakiye: ${yeniBakiye.toLocaleString('tr-TR')} TL)`;

      // Level rol sistemi: guild-config icinden /level-kayit ile ayarlanan rol
      let rolMsg = '';
      try {
        const ayrilar = message.guild.id;
        const lrDb = loadJson(levelRoleDbPath);
        const guildRoles = lrDb[ayrilar];
        if (guildRoles && guildRoles[newLevel] && message.member) {
          const rol = message.guild.roles.cache.get(guildRoles[newLevel].rolId);
          if (rol && !message.member.roles.cache.has(rol.id)) {
            message.member.roles.add(rol.id).catch(() => {});
            rolMsg = `\n:label: **${rol.name}** rolünü kazandin!`;
          }
        }
      } catch (e) {}

      message.reply(`:tada: **Tebrikler ${message.author.username}!** Seviye **${newLevel}** oldun!${paraMsg}${rolMsg}`);
    }
  },
};

