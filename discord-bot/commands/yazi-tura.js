const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { bakiyeAl, paraCikar, bakiyEkle, kumarYasakli, kumarSayacVeRol } = require('./kumar-yardimci.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('yazi-tura')
    .setDescription('Bahisli yazi tura at')
    .addStringOption(opt => opt.setName('secim').setDescription('Secim')
      .addChoices(
        { name: 'Yazi', value: 'yazi' },
        { name: 'Tura', value: 'tura' },
      ).setRequired(true))
    .addIntegerOption(opt => opt.setName('bahis').setDescription('Bahis miktari').setRequired(true).setMinValue(1)),
  async execute(interaction) {
    if (kumarYasakli(interaction.guild.id, interaction.user.id)) {
      return interaction.reply({ content: ':no_entry: Kumarhaneden yasaklandin!', ephemeral: true });
    }

    const secim = interaction.options.getString('secim');
    const bahis = interaction.options.getInteger('bahis');

    if (bakiyeAl(interaction.user.id) < bahis) {
      return interaction.reply({ content: ':x: Yeterli paran yok!', ephemeral: true });
    }

    paraCikar(interaction.user.id, bahis);
    kumarSayacVeRol(interaction);

    const sonuc = Math.random() < 0.5 ? 'yazi' : 'tura';
    const kazandi = secim === sonuc;
    const kazanc = kazandi ? bahis * 2 : 0;
    if (kazanc > 0) bakiyEkle(interaction.user.id, kazanc);

    const embed = new EmbedBuilder()
      .setTitle(':coin: Yazi Tura')
      .setDescription(`Para: **${sonuc === 'yazi' ? ':coin: Yazi' : ':first_place: Tura'}**\nSen: **${secim}**`)
      .addFields(
        { name: kazandi ? ':moneybag: Kazandin!' : ':x: Kaybettin!', value: kazandi ? `**+${kazanc} TL**` : `**-${bahis} TL**` },
        { name: ':banknote: Yeni Bakiye', value: `${bakiyeAl(interaction.user.id)} TL`, inline: true },
      )
      .setColor(kazandi ? 0x00FF00 : 0xFF0000)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
