const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { bakiyeAl, paraCikar, bakiyEkle, kumarYasakli, kumarSayacVeRol } = require('./kumar-yardimci.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('yildiz')
    .setDescription('3 kapali kutu - birinde yildiz var!')
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

    const dogru = Math.floor(Math.random() * 3) + 1;

    const embed = new EmbedBuilder()
      .setTitle(':star: Kapali Kutular')
      .setDescription('Bir kutuda **YILDIZ** var! Dogru kutuyu sec!')
      .addFields({ name: ':banknote: Bahis', value: `${bahis} TL`, inline: true })
      .setColor(0xFFD700)
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('yil_1').setLabel(':package: 1').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('yil_2').setLabel(':package: 2').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('yil_3').setLabel(':package: 3').setStyle(ButtonStyle.Secondary),
    );

    const msg = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    const collector = msg.createMessageComponentCollector({ time: 20000, max: 1 });

    collector.on('collect', async (i) => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: 'Sadece oyunu baslatan kisi!' , ephemeral: true });
      }

      const secim = parseInt(i.customId.split('_')[1]);
      const kazandi = secim === dogru;
      const kazanc = kazandi ? bahis * 3 : 0;
      if (kazanc > 0) bakiyEkle(interaction.user.id, kazanc);

      const embed2 = new EmbedBuilder()
        .setTitle(':star: Sonuc!')
        .setDescription(`Yildiz **${dogru}. kutuda** idi!\nSen **${secim}. kutuyu** sectin.`)
        .addFields(
          { name: kazandi ? ':moneybag: Kazandin!' : ':x: Kaybettin!', value: kazandi ? `**+${kazanc} TL**` : `**-${bahis} TL**` },
          { name: ':banknote: Yeni Bakiye', value: `${bakiyeAl(interaction.user.id)} TL`, inline: true },
        )
        .setColor(kazandi ? 0x00FF00 : 0xFF0000)
        .setTimestamp();

      await i.update({ embeds: [embed2], components: [] });
    });
  },
};
