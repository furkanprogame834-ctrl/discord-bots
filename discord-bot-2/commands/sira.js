const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { AudioPlayerStatus } = require('@discordjs/voice');
const { sarkiEmbed } = require('./cal.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sira')
    .setDescription('Çalma sırasındaki şarkıları gösterir'),
  async execute(interaction) {
    const sikis = global.__muzikAkis?.[interaction.guild.id];
    if (!sikis) {
      return interaction.reply({ embeds: [sarkiEmbed('⚠️ Aktif bir müzik listesi yok!', 0xFF0000)], flags: 64 });
    }

    let aciklama = '';
    if (sikis.suan) aciklama += `▶️ **Şu an:** ${sikis.suan.titulo}\n\n`;
    if (sikis.sira.length === 0) {
      aciklama += 'Sırada başka şarkı yok.';
    } else {
      aciklama += '📜 **Sırada:**\n' + sikis.sira.map((s, i) => `${i + 1}. ${s.titulo} (${s.formattedTime || '?'})`).join('\n');
    }

    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle('🎵 Çalma Listesi')
      .setDescription(aciklama || 'Liste boş.')
      .setTimestamp();
    return interaction.reply({ embeds: [embed], flags: 64 });
  },
};