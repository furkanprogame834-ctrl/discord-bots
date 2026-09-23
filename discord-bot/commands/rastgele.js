const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rastgele')
    .setDescription('Iki secenek arasinda secim yapar')
    .addStringOption(option =>
      option.setName('secenek1').setDescription('Ilk secenek').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('secenek2').setDescription('Ikinci secenek').setRequired(true)
    ),
  async execute(interaction) {
    const s1 = interaction.options.getString('secenek1');
    const s2 = interaction.options.getString('secenek2');
    const kazanan = Math.random() < 0.5 ? s1 : s2;
    await interaction.reply(`:thinking: **Secim:** ${kazanan}`);
  },
};
