const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { bakiyeAl, paraCikar, bakiyEkle, kumarYasakli, kumarSayacVeRol } = require('./kumar-yardimci.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('zar-savas')
    .setDescription('2 zar at - sen ve kasa, buyuk kazanir')
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

    const s1 = Math.floor(Math.random() * 6) + 1;
    const s2 = Math.floor(Math.random() * 6) + 1;
    const b1 = Math.floor(Math.random() * 6) + 1;
    const b2 = Math.floor(Math.random() * 6) + 1;
    const senTop = s1 + s2;
    const botTop = b1 + b2;

    let kazandi = false;
    let kazanc = 0;

    if (senTop > botTop) { kazandi = true; kazanc = bahis * 2; }
    else if (senTop === botTop) { kazanc = bahis; }

    if (kazanc > 0) bakiyEkle(interaction.user.id, kazanc);

    const embed = new EmbedBuilder()
      .setTitle(':crossed_swords: Zar Savasi')
      .setDescription(`Sen: **${s1}+${s2}=${senTop}**\nKasa: **${b1}+${b2}=${botTop}**`)
      .addFields(
        { name: ':banknote: Bahis', value: `${bahis} TL`, inline: true },
        { name: 'Sonuc', value: kazandi ? `:tada: **Kazandin! +${kazanc} TL**` : kazanc === bahis ? `:handshake: **Berabere! ${bahis} TL geri**` : `:x: **Kaybettin! -${bahis} TL**`, inline: true },
        { name: ':banknote: Yeni Bakiye', value: `${bakiyeAl(interaction.user.id)} TL`, inline: true },
      )
      .setColor(kazandi ? 0x00FF00 : kazanc === bahis ? 0xFFD700 : 0xFF0000)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
