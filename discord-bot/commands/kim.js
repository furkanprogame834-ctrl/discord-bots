const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kim')
    .setDescription('Rastgele bir uye secer'),
  async execute(interaction) {
    const uyeler = interaction.guild.members.cache.filter(m => !m.user.bot);
    const secilen = uyeler.random();
    await interaction.reply(`:drum: **Rastgele secilen:** ${secilen}`);
  },
};
