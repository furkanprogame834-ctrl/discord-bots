const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { haberAra } = require('./haber-yardimci.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('haber-ara')
    .setDescription('Konuya gore haber ara')
    .addStringOption(opt => opt.setName('kelime').setDescription('Aratilacak kelime/konu').setRequired(true))
    .addIntegerOption(opt => opt.setName('adet').setDescription('Kac haber (1-5)').setMinValue(1).setMaxValue(5)),
  async execute(interaction) {
    const kelime = interaction.options.getString('kelime');
    const adet = interaction.options.getInteger('adet') || 3;
    await interaction.deferReply();
    try {
      const haberler = await haberAra(kelime, adet);
      if (haberler.length === 0) {
        return interaction.editReply({ content: `:grey_exclamation: **${kelime}** icin haber bulunamadi.` });
      }
      const embed = new EmbedBuilder()
        .setTitle(`:mag_right: "${kelime}" haberleri`)
        .setColor(0x5865F2)
        .setTimestamp();
      for (const h of haberler) {
        embed.addFields({ name: `${h.no}. ${h.title}`, value: `[Haber linki](${h.link})`, inline: false });
      }
      await interaction.editReply({ embeds: [embed] });
    } catch (e) {
      await interaction.editReply({ content: ':x: Haber aranamadi.' });
    }
  },
};
