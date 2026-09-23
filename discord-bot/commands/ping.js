const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Bot gecikme suren gosterir'),
  async execute(interaction) {
    const sent = await interaction.reply({ content: 'Hesapliyorum...', fetchReply: true });
    await interaction.editReply(`Pong! Gecikme: ${sent.createdTimestamp - interaction.createdTimestamp}ms | API: ${interaction.client.ws.ping}ms`);
  },
};
