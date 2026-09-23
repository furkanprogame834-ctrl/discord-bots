const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { bakiyeAl, paraCikar, bakiyEkle, kumarYasakli, kumarSayacVeRol } = require('./kumar-yardimci.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roulette')
    .setDescription('Rulet oynalani - kirmizi/siyah/tek/cift/sayi')
    .addStringOption(opt => opt.setName('secim').setDescription('Rulet secimin')
      .addChoices(
        { name: 'Kirmizi', value: 'kirmizi' },
        { name: 'Siyah', value: 'siyah' },
        { name: 'Tek', value: 'tek' },
        { name: 'Cift', value: 'cift' },
        { name: '1-18', value: '1-18' },
        { name: '19-36', value: '19-36' },
      ).setRequired(true))
    .addIntegerOption(opt => opt.setName('bahis').setDescription('Bahis miktari').setRequired(true).setMinValue(1))
    .setDefaultMemberPermissions(0),
  async execute(interaction) {
    if (kumarYasakli(interaction.guild.id, interaction.user.id)) {
      return interaction.reply({ content: ':no_entry: Kumarhaneden yasaklandin!', ephemeral: true });
    }

    const secim = interaction.options.getString('secim');
    const bahis = interaction.options.getInteger('bahis');

    if (bakiyeAl(interaction.user.id) < bahis) {
      return interaction.reply({ content: `:x: Yeterli paran yok! Bakiyen: **${bakiyeAl(interaction.user.id)} TL**`, ephemeral: true });
    }

    paraCikar(interaction.user.id, bahis);
    kumarSayacVeRol(interaction);

    const sayi = Math.floor(Math.random() * 37);
    const rengi = sayi === 0 ? 'Yesil' : sayi % 2 === 0 ? 'Siyah' : 'Kirmizi';

    let kazandi = false;
    let kazanct = 0;

    if (secim === 'kirmizi' && rengi === 'Kirmizi') { kazandi = true; kazanct = bahis * 2; }
    else if (secim === 'siyah' && rengi === 'Siyah') { kazandi = true; kazanct = bahis * 2; }
    else if (secim === 'tek' && sayi !== 0 && sayi % 2 === 1) { kazandi = true; kazanct = bahis * 2; }
    else if (secim === 'cift' && sayi !== 0 && sayi % 2 === 0) { kazandi = true; kazanct = bahis * 2; }
    else if (secim === '1-18' && sayi >= 1 && sayi <= 18) { kazandi = true; kazanct = bahis * 2; }
    else if (secim === '19-36' && sayi >= 19 && sayi <= 36) { kazandi = true; kazanct = bahis * 2; }

    if (kazandi) bakiyEkle(interaction.user.id, kazanct);

    const renkEmoji = rengi === 'Kirmizi' ? ':red_circle:' : rengi === 'Siyah' ? ':black_circle:' : ':green_circle:';

    const embed = new EmbedBuilder()
      .setTitle(':red_circle: Rulet')
      .setDescription(`${renkEmoji} Top durdu: **${sayi}** (${rengi})`)
      .addFields(
        { name: ':dart: Secimin', value: secim, inline: true },
        { name: ':banknote: Bahis', value: `${bahis} TL`, inline: true },
        { name: kazandi ? ':moneybag: Kazandin!' : ':x: Kaybettin!', value: kazandi ? `**+${kazanct} TL**` : `**-${bahis} TL**`, inline: true },
      )
      .setColor(kazandi ? 0x00FF00 : 0xFF0000)
      .setFooter({ text: `Yeni bakiye: ${bakiyeAl(interaction.user.id)} TL` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
