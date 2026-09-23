const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('metin-sayim')
    .setDescription('Bir metnin kelime/karakter/harf sayisini hesaplar')
    .addStringOption(opt => opt.setName('metin').setDescription('Sayilacak metin').setRequired(true)),
  async execute(interaction) {
    const metin = interaction.options.getString('metin');

    const karakter = metin.length;
    const kelimeler = metin.trim() === '' ? 0 : metin.trim().split(/\s+/).length;
    const harfler = metin.replace(/[^a-zA-ZçğıöşüÇĞİÖŞÜ]/g, '').length;
    const sayilar = (metin.match(/[0-9]/g) || []).length;
    const satirlar = metin.split('\n').length;

    const embed = new EmbedBuilder()
      .setTitle(':abacus: Metin Sayimi')
      .setDescription(`> ${metin.slice(0, 300)}${metin.length > 300 ? '...' : ''}`)
      .setColor(0x5865F2)
      .addFields(
        { name: ':keyboard: Karakter', value: `**${karakter}**`, inline: true },
        { name: ':scroll: Kelime', value: `**${kelimeler}**`, inline: true },
        { name: ':abc: Harf', value: `**${harfler}**`, inline: true },
        { name: ':1234: Rakam', value: `**${sayilar}**`, inline: true },
        { name: ':page_facing_up: Satir', value: `**${satirlar}**`, inline: true },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
