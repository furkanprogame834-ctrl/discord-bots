const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { bakiyeAl, paraCikar, bakiyEkle, kumarYasakli, kumarSayacVeRol } = require('./kumar-yardimci.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kart-cek')
    .setDescription('Desteden kart cek ve para kazan/kaybet')
    .addIntegerOption(opt => opt.setName('bahis').setDescription('Bahis miktari').setRequired(true).setMinValue(1)),
  async execute(interaction) {
    if (kumarYasakli(interaction.guild.id, interaction.user.id)) {
      return interaction.reply({ content: ':no_entry: Kumarhaneden yasaklandin!', ephemeral: true });
    }

    const bahis = interaction.options.getInteger('bahis');
    if (bakiyeAl(interaction.user.id) < bahis) {
      return interaction.reply({ content: `:x: Yeterli paran yok!`, ephemeral: true });
    }

    paraCikar(interaction.user.id, bahis);
    kumarSayacVeRol(interaction);

    const desteler = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
    const seyler = ['♠','♥','♦','♣'];
    const kart = desteler[Math.floor(Math.random() * desteler.length)];
    const sey = seyler[Math.floor(Math.random() * seyler.length)];

    let kazanc = 0;
    let sonuc = '';

    if (kart === 'A') { kazanc = bahis * 3; sonuc = ':star2: AS cektin!'; }
    else if (kart === 'K') { kazanc = bahis * 2.5; sonuc = ':crown: KRAL cektin!'; }
    else if (kart === 'Q') { kazanc = bahis * 2; sonuc = ':princess: KIZ cektin!'; }
    else if (kart === 'J') { kazanc = bahis * 1.5; sonuc = ':boy: VALE cektin!'; }
    else { sonuc = ':x: Dusuk kart cektin...'; }

    if (kazanc > 0) {
      kazanc = Math.floor(kazanc);
      bakiyEkle(interaction.user.id, kazanc);
    }

    const embed = new EmbedBuilder()
      .setTitle(':black_joker: Kart Cektin!')
      .setDescription(`Kart: **${kart}${sey}**\n${sonuc}`)
      .addFields(
        { name: ':banknote: Bahis', value: `${bahis} TL`, inline: true },
        { name: kazanc > 0 ? ':moneybag: Kazanc' : ':x: Kaybettin', value: kazanc > 0 ? `**+${kazanc} TL**` : `**-${bahis} TL**`, inline: true },
      )
      .setColor(kazanc > 0 ? 0x00FF00 : 0xFF0000)
      .setFooter({ text: `Yeni bakiye: ${bakiyeAl(interaction.user.id)} TL` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
