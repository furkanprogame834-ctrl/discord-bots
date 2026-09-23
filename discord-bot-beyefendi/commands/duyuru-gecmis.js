const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'duyuru-gecmis-db.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('duyuru-gecmis')
    .setDescription('Yapilan duyurularin gecmisini gosterir'),
  async execute(interaction) {
    let gecmis = [];
    try { gecmis = JSON.parse(fs.readFileSync(dbPath, 'utf8')); } catch { gecmis = []; }

    const guildDuyurulari = gecmis.filter(d => d.guildId === interaction.guild.id).slice(-15);

    if (guildDuyurulari.length === 0) {
      const bos = new EmbedBuilder()
        .setTitle(':open_file_folder: Duyuru Gecmisi')
        .setDescription(':grey_exclamation: Kayitli duyuru bulunmuyor.')
        .setColor(0x5865F2);
      return interaction.reply({ embeds: [bos] });
    }

    const embed = new EmbedBuilder()
      .setTitle(':open_file_folder: Duyuru Gecmisi')
      .setColor(0x5865F2)
      .setTimestamp();

    for (const d of guildDuyurulari) {
      const tarih = new Date(d.zaman).toLocaleString('tr-TR');
      embed.addFields({ name: `${d.baslik}`, value: `${d.metin}\n:clock1: ${tarih} — <#${d.kanalId}>`, inline: false });
    }

    await interaction.reply({ embeds: [embed] });
  },
};
