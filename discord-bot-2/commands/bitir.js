const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { sarkiEmbed } = require('./cal.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bitir')
    .setDescription('Müziği durdurur ve bot ses kanalından ayrılır'),
  async execute(interaction) {
    const sikis = global.__muzikAkis?.[interaction.guild.id];
    if (!sikis) {
      return interaction.reply({ embeds: [sarkiEmbed('⚠️ Aktif bir müzik sistemi yok!', 0xFF0000)], flags: 64 });
    }
    sikis.player.stop();
    sikis.baglanti.destroy();
    delete global.__muzikAkis[interaction.guild.id];
    return interaction.reply({ embeds: [sarkiEmbed('⏹️ Müzik durduruldu, kanaldan ayrıldım.', 0xFF0000)], flags: 64 });
  },
};