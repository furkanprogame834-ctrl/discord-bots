const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { bakiyeAl, paraCikar, bakiyEkle, kumarYasakli, kumarSayacVeRol } = require('./kumar-yardimci.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sayi-tut')
    .setDescription('1-6 arasi sayi tut ve bahis oyna')
    .addIntegerOption(opt => opt.setName('sayi').setDescription('1-6 arasi sayi').setRequired(true).setMinValue(1).setMaxValue(6))
    .addIntegerOption(opt => opt.setName('bahis').setDescription('Bahis miktari').setRequired(true).setMinValue(1)),
  async execute(interaction) {
    if (kumarYasakli(interaction.guild.id, interaction.user.id)) {
      return interaction.reply({ content: ':no_entry: Kumarhaneden yasaklandin!', ephemeral: true });
    }

    const sayi = interaction.options.getInteger('sayi');
    const bahis = interaction.options.getInteger('bahis');

    if (bakiyeAl(interaction.user.id) < bahis) {
      return interaction.reply({ content: ':x: Yeterli paran yok!', ephemeral: true });
    }

    paraCikar(interaction.user.id, bahis);
    kumarSayacVeRol(interaction);

    const zar = Math.floor(Math.random() * 6) + 1;
    const kazandi = zar === sayi;
    const kazanc = kazandi ? bahis * 5 : 0;
    if (kazanc > 0) bakiyEkle(interaction.user.id, kazanc);

    const embed = new EmbedBuilder()
      .setTitle(':game_die: Sayi Tahmin')
      .setDescription(`Zar: **${zar}**\nTuttugun: **${sayi}**`)
      .addFields(
        { name: kazandi ? ':moneybag: Kazandin!' : ':x: Kaybettin!', value: kazandi ? `**+${kazanc} TL**` : `**-${bahis} TL**` },
        { name: ':banknote: Yeni Bakiye', value: `${bakiyeAl(interaction.user.id)} TL`, inline: true },
      )
      .setColor(kazandi ? 0x00FF00 : 0xFF0000)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
