const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const xpDbPath = path.join(__dirname, '..', '..', 'xp-db.json');
const { bakiyEkle, loadJson, saveJson } = require('./kumar-yardimci.js');

const LEVEL_PARA = 20000;

function getLevel(xp) {
  return Math.floor(0.1 * Math.sqrt(xp));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('level-ver')
    .setDescription('Bir kullaniciya level verir (20.000 TL de verir)')
    .addUserOption(opt => opt.setName('kullanici').setDescription('Level verilecek kisi').setRequired(true))
    .addIntegerOption(opt => opt.setName('seviye').setDescription('Verilecek seviye').setRequired(true).setMinValue(1).setMaxValue(100))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Bu komutu sadece **Yonetici** kullanabilir!', ephemeral: true });
    }

    const hedef = interaction.options.getUser('kullanici');
    const hedefLevel = interaction.options.getInteger('seviye');

    const db = loadJson(xpDbPath);
    if (!db[hedef.id]) db[hedef.id] = { xp: 0, level: 0, mesaj: 0 };

    const oldLevel = db[hedef.id].level || 0;
    const minXp = 100 * hedefLevel * hedefLevel;
    if (db[hedef.id].xp < minXp) db[hedef.id].xp = minXp;
    db[hedef.id].level = getLevel(db[hedef.id].xp);
    saveJson(xpDbPath, db);

    const yeniLevel = db[hedef.id].level;
    const atlanan = yeniLevel - oldLevel;

    let paraMsg = '';
    if (yeniLevel > oldLevel) {
      const yeniBakiye = bakiyEkle(hedef.id, LEVEL_PARA * atlanan);
      paraMsg = `\n:moneybag: **+${(LEVEL_PARA * atlanan).toLocaleString('tr-TR')} TL** kumarhane parasi eklendi! (Bakiye: ${yeniBakiye.toLocaleString('tr-TR')} TL)`;
    }

    const embed = new EmbedBuilder()
      .setTitle(':level_slider: Level Verildi!')
      .setDescription(`**${hedef.username}** icin\nEski seviye: **${oldLevel}**\nYeni seviye: **${yeniLevel}**${paraMsg}`)
      .setColor(0x00FF00)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
