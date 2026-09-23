const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('not')
    .setDescription('Kendine not birakir')
    .addStringOption(option =>
      option.setName('metin').setDescription('Notun').setRequired(true)
    ),
  async execute(interaction) {
    const metin = interaction.options.getString('metin');
    await interaction.reply({
      embeds: [{
        color: 0xFFD700,
        title: ':memo: Notun',
        description: metin,
        footer: { text: `${interaction.user.username} tarafindan yazildi` },
        timestamp: new Date().toISOString(),
      }],
    });
  },
};
