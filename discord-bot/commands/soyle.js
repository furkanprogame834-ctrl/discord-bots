const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('soyle')
    .setDescription('Botun soylemesini istedigin seyi soyletir')
    .addStringOption(option =>
      option.setName('mesaj').setDescription('Soyletielecek mesaj').setRequired(true)
    ),
  async execute(interaction) {
    const mesaj = interaction.options.getString('mesaj');
    await interaction.reply({ content: mesaj, allowedMentions: { parse: [] } });
  },
};
