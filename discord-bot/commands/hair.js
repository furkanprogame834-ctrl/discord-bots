const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hair')
    .setDescription('Harf hesapla'),
  async execute(interaction) {
    await interaction.reply({
      embeds: [{
        color: 0xFF69B4,
        title: ':abacus: Hesap Makinesi',
        description: 'Yakinda!'
      }]
    });
  },
};
