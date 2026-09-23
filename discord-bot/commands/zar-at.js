const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { bakiyeAl, paraCikar, bakiyEkle, kumarYasakli, kumarSayacVeRol } = require('./kumar-yardimci.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('zar-at')
    .setDescription('2 zar at - 7 veya 11 kazanir')
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

    const z1 = Math.floor(Math.random() * 6) + 1;
    const z2 = Math.floor(Math.random() * 6) + 1;
    const toplam = z1 + z2;

    let kazanc = 0;
    let sonuc = '';

    if (toplam === 7 || toplam === 11) {
      kazanc = bahis * 2;
      sonuc = ':tada: **Kazandin!**';
    } else {
      sonuc = ':x: Kaybettin!';
    }

    if (kazanc > 0) bakiyEkle(interaction.user.id, kazanc);

    const embed = new EmbedBuilder()
      .setTitle(':game_die: Zar At')
      .setDescription(`Zarlar: **${z1}** + **${z2}** = **${toplam}**\n${sonuc}`)
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
