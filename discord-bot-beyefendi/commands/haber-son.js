const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { sonHaberler } = require('./haber-yardimci.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('haber-son')
    .setDescription('Guncel haber basliklarini gosterir'),
  async execute(interaction) {
    await interaction.deferReply();
    try {
      const haberler = await sonHaberler(8);
      const embed = new EmbedBuilder()
        .setTitle(':newspaper: Son Dakika Haberler')
        .setColor(0xED4245)
        .setTimestamp();

      for (const h of haberler) {
        embed.addFields({
          name: `${h.no}. ${h.title}`,
          value: h.desc ? `${h.desc.slice(0, 100)}` : `${new Date(h.pubDate).toLocaleTimeString('tr-TR')}`,
          inline: false,
        });
      }

      embed.setFooter({ text: 'Kaynak: Google News (Turkiye)' });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel('Haberleri Gormek Icin Tikla').setURL('https://news.google.com/topstories?hl=tr&gl=TR&ceid=TR:tr')
      );

      await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (e) {
      await interaction.editReply({ content: ':x: Haber alinamadi. (Internet baglantisi veya kaynak kaynakli olabilir)' });
    }
  },
};
