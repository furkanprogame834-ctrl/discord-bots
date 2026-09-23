const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { bakiyeAl, paraCikar, bakiyEkle, kumarYasakli, kumarSayacVeRol } = require('./kumar-yardimci.js');

const notlar = { 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };

function kartNot(k) {
  const parca = k.slice(0, -1);
  return notlar[parca] || parseInt(parca);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('poker')
    .setDescription('Basit poker - yuksek kart kazanir')
    .addIntegerOption(opt => opt.setName('bahis').setDescription('Bahis miktari').setRequired(true).setMinValue(1)),
  async execute(interaction) {
    if (kumarYasakli(interaction.guild.id, interaction.user.id)) {
      return interaction.reply({ content: ':no_entry: Kumarhaneden yasaklandin!', ephemeral: true });
    }

    const bahis = interaction.options.getInteger('bahis');
    if (bakiyeAl(interaction.user.id) < bahis) {
      return interaction.reply({ content: ':x: Yeterli paran yok!', ephemeral: true });
    }

    paraCikar(interaction.user.id, bahis);
    kumarSayacVeRol(interaction);

    const desteler = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
    const seyler = ['♠','♥','♦','♣'];

    const oyuncuKart = desteler[Math.floor(Math.random() * desteler.length)] + seyler[Math.floor(Math.random() * seyler.length)];
    let botKart;
    do {
      botKart = desteler[Math.floor(Math.random() * desteler.length)] + seyler[Math.floor(Math.random() * seyler.length)];
    } while (botKart === oyuncuKart);

    const po = kartNot(oyuncuKart);
    const pb = kartNot(botKart);

    let kazandi = false;
    let kazanc = 0;
    let sonuc = '';

    if (po > pb) { kazandi = true; kazanc = bahis * 2; sonuc = ':tada: **Kazandin!**'; }
    else { sonuc = ':x: **Kasa kazandi!**'; }

    if (kazanc > 0) bakiyEkle(interaction.user.id, kazanc);

    const embed = new EmbedBuilder()
      .setTitle(':spades: Poker')
      .setDescription(`${sonuc}`)
      .addFields(
        { name: ':bust_in_silhouette: Sen', value: `**${oyuncuKart}** (${po})`, inline: true },
        { name: ':trophy: Kasa', value: `**${botKart}** (${pb})`, inline: true },
        { name: kazandi ? ':moneybag: Kazanc' : ':x: Kaybettin', value: kazandi ? `**+${kazanc} TL**` : `**-${bahis} TL**`, inline: true },
      )
      .setColor(kazandi ? 0x00FF00 : 0xFF0000)
      .setFooter({ text: `Yeni bakiye: ${bakiyeAl(interaction.user.id)} TL` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
