const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { loadJson, saveJson, kumarDbPath } = require('./kumar-yardimci.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kumarhane-kurulum')
    .setDescription('Kumarhane sistemini kurulum rehberi gosterir'),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle(':slot_machine: KUMARHANE KURULUMU')
      .setDescription('Kumarhane sistemi kurulum rehberi!')
      .addFields(
        { name: ':one: Adim', value: 'Sunucuda bir **KUMARHANE** kanal kategorisi olustur' },
        { name: ':two: Adim', value: 'Kategori icinde **rulet**, **slots**, **blackjack** kanallari ac' },
        { name: ':three: Adim', value: 'Yonetici `/kumar-izin` komutuyla kumar kanalini ayarla' },
        { name: ':four: Adim', value: '`/odul` ile gunluk bonus, `/is` ile para kazan' },
        { name: ':five: Adim', value: '`/slots`, `/kumar`, `/roulette`, `/blackjack` ile oyna!' },
      )
      .setColor(0xFFD700)
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  },
};
