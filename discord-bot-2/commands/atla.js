const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { AudioPlayerStatus } = require('@discordjs/voice');
const { sarkiEmbed } = require('./cal.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('atla')
    .setDescription('Çalan şarkıyı atlar, sıradakini çalar'),
  async execute(interaction) {
    const sikis = global.__muzikAkis?.[interaction.guild.id];
    if (!sikis || sikis.player.state.status !== AudioPlayerStatus.Playing) {
      return interaction.reply({ embeds: [sarkiEmbed('⚠️ Çalan bir şarkı yok!', 0xFF0000)], flags: 64 });
    }
    sikis.player.stop();
    return interaction.reply({ embeds: [sarkiEmbed('⏭️ Şarkı atlandı', 0xFFA500)], flags: 64 });
  },
};