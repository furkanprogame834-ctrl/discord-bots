const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { bakiyeAl, paraCikar, bakiyEkle, kumarIzinli, kumarYasakli, kumarSayacVeRol } = require('./kumar-yardimci.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kumar')
    .setDescription('Kirmizi/Siyah/Zar ile sans oyunu oyna')
    .addStringOption(opt => opt.setName('secim').setDescription('Ne oynamak istersin')
      .addChoices(
        { name: 'Kirmizi', value: 'kirmizi' },
        { name: 'Siyah', value: 'siyah' },
        { name: 'Tek', value: 'tek' },
        { name: 'Cift', value: 'cift' },
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

    const zar1 = Math.floor(Math.random() * 6) + 1;
    const zar2 = Math.floor(Math.random() * 6) + 1;
    const toplam = zar1 + zar2;

    const kirmizi = zar1 === zar2 ? false : (zar1 + zar2) % 2 === 0;
    const siyah = !kirmizi && toplam !== 7;
    const tek = toplam % 2 === 1;
    const cift = toplam % 2 === 0 && toplam !== 7;
    const yediMi = toplam === 7;

    let kazandi = false;
    let kazanctl = 0;

    if (secim === 'kirmizi' && kirmizi) {
      kazandi = true; kazanctl = bahis * 2;
    } else if (secim === 'siyah' && siyah) {
      kazandi = true; kazanctl = bahis * 2;
    } else if (secim === 'tek' && tek) {
      kazandi = true; kazanctl = bahis * 2;
    } else if (secim === 'cift' && cift) {
      kazandi = true; kazanctl = bahis * 1.5;
    }

    if (kazandi) {
      bakiyEkle(interaction.user.id, kazanctl);
    }

    const renk = zar1 === zar2 ? ':brown_circle: Aynu' : (toplam % 2 === 0 ? ':red_circle: Kirmizi' : ':black_circle: Siyah');

    const embed = new EmbedBuilder()
      .setTitle(':game_die: Kumar Oyunu')
      .setDescription(`Zarlar: **${zar1}** + **${zar2}** = **${toplam}**\nSonuc: **${yediMi ? ':white_circle: 7!' : renk}** (${tek ? 'Tek' : 'Cift'})`)
      .addFields(
        { name: ':dart: Secimin', value: `${secim}`, inline: true },
        { name: ':banknote: Bahis', value: `${bahis} TL`, inline: true },
        { name: kazandi ? ':moneybag: Kazandin!' : ':x: Kaybettin!', value: kazandi ? `**+${kazanctl} TL**` : `**-${bahis} TL**`, inline: true },
      )
      .setFooter({ text: `Yeni bakiye: ${bakiyeAl(interaction.user.id)} TL` })
      .setTimestamp();

    const embedColor = kazandi ? 0x00FF00 : 0xFF0000;
    embed.setColor(embedColor);

    await interaction.reply({ embeds: [embed] });
  },
};
