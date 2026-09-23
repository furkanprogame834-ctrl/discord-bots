const { SlashCommandBuilder } = require('discord.js');
const { AudioPlayerStatus } = require('@discordjs/voice');
const { sarkiEmbed } = require('./cal.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('duraklat')
    .setDescription('Çalan şarkıyı duraklatır'),
  async execute(interaction) {
    const sikis = global.__muzikAkis?.[interaction.guild.id];
    if (!sikis || sikis.player.state.status !== AudioPlayerStatus.Playing) {
      return interaction.reply({ embeds: [sarkiEmbed('⚠️ Çalan bir şarkı yok!', 0xFF0000)], flags: 64 });
    }
    sikis.player.pause();
    return interaction.reply({ embeds: [sarkiEmbed('⏸️ Şarkı duraklatıldı', 0xFFA500)], flags: 64 });
  },
};