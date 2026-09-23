const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('merhaba')
    .setDescription('Botla selallasir'),
  async execute(interaction) {
    await interaction.reply(`Merhaba ${interaction.user.username}! Ben botunuz, size nasil yardimci olabilirim?`);
  },
};
