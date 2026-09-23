const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const xpDbPath = path.join(__dirname, '..', 'xp-db.json');

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
  data: new SlashCommandBuilder()
    .setName('seviye')
    .setDescription('Seviye bilgini gosterir')
    .addUserOption(option => option.setName('kullanici').setDescription('Seviyesini gormek istedigin kisi')),
  async execute(interaction) {
    const user = interaction.options.getUser('kullanici') || interaction.user;
    const db = loadXpDb();
    const userData = db[user.id] || { xp: 0, level: 0 };
    const level = getLevel(userData.xp);
    const nextLevelXp = Math.floor(getXpForLevel(level + 1));
    const currentLevelXp = Math.floor(getXpForLevel(level));
    const progress = userData.xp - currentLevelXp;
    const needed = nextLevelXp - currentLevelXp;

    const bar = ':blue_square:'.repeat(Math.floor((progress / needed) * 10)) + ':white_large_square:'.repeat(10 - Math.floor((progress / needed) * 10));

    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle(`:star: ${user.username} Seviyesi`)
      .addFields(
        { name: 'Seviye', value: `${level}`, inline: true },
        { name: 'XP', value: `${userData.xp}`, inline: true },
        { name: 'Siradaki Seviye', value: `${nextLevelXp} XP`, inline: true },
        { name: 'Ilerleme', value: bar },
      )
      .setThumbnail(user.displayAvatarURL({ dynamic: true }));

    await interaction.reply({ embeds: [embed] });
  },
};
