const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('asik')
    .setDescription('Aşk ölçer'),
  async execute(interaction) {
    const sayi1 = Math.floor(Math.random() * 101);
    const hearts = ':red_heart:'.repeat(Math.floor(sayi1 / 10));
    await interaction.reply(`:cupid: **Ask Olcer:**\n${hearts}\n**%${sayi1}** ask`);
  },
};
