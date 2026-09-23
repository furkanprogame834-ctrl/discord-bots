const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kufur')
    .setDescription('Bot seni kufurler')
    .addUserOption(option =>
      option.setName('kisi').setDescription('Kufrolenecek kisi').setRequired(true)
    ),
  async execute(interaction) {
    const kisi = interaction.options.getUser('kisi');
    const kufurler = [
      'Seni seviyorum seni sevmeyenleri de seviyorum!',
      'Sen birIncisin!',
      'Hayat seni seviyor!',
      'Gulumse, dunya gulumsun!',
      'En guzel gunler senin olsun!',
    ];
    const kufur = kufurler[Math.floor(Math.random() * kufurler.length)];
    await interaction.reply(`:kiss: ${kisi} ${kufur}`);
  },
};
