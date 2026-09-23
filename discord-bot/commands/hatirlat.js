const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hatirlat')
    .setDescription('Belirli sure sonra hatirlatir')
    .addIntegerOption(option => option.setName('sure').setDescription('Sure (dakika)').setRequired(true).setMinValue(1).setMaxValue(1440))
    .addStringOption(option => option.setName('mesaj').setDescription('Hatirlatma mesaji').setRequired(true)),
  async execute(interaction) {
    const sure = interaction.options.getInteger('sure');
    const mesaj = interaction.options.getString('mesaj');

    await interaction.reply(`:clock1: **${sure} dakika** sonra hatirlatilacaksin!`);

    setTimeout(async () => {
      try {
        await interaction.user.send(`:bell: **Hatirlatma:** ${mesaj}`);
      } catch (e) {
        const channel = interaction.channel;
        if (channel) {
          channel.send(`${interaction.user} :bell: **Hatirlatma:** ${mesaj}`);
        }
      }
    }, sure * 60 * 1000);
  },
};
