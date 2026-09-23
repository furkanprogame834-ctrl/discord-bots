const { SlashCommandBuilder } = require('discord.js');
const { AudioPlayerStatus } = require('@discordjs/voice');
const { sarkiEmbed } = require('./cal.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('devam')
    .setDescription('Duraklatılmış şarkıyı devam ettirir'),
  async execute(interaction) {
    const sikis = global.__muzikAkis?.[interaction.guild.id];
    if (!sikis || sikis.player.state.status !== AudioPlayerStatus.Paused) {
      return interaction.reply({ embeds: [sarkiEmbed('⚠️ Duraklatılmış bir şarkı yok!', 0xFF0000)], flags: 64 });
    }
    sikis.player.unpause();
    return interaction.reply({ embeds: [sarkiEmbed('▶️ Şarkı devam ediyor', 0x57F287)], flags: 64 });
  },
};