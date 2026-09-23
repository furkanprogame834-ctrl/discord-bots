const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const aktifOyunlar = {};

module.exports = {
  aktifOyunlar,
  data: new SlashCommandBuilder()
    .setName('tahmin')
    .setDescription('1-100 arasi sayi tahmin oyunu'),
  async execute(interaction) {
    const userId = interaction.user.id;

    if (aktifOyunlar[userId]) {
      return interaction.reply({ content: 'Zaten bir oyunun var! Tahminini yaz: `/tahmin-oyunla <sayi>`', ephemeral: true });
    }

    const hedef = Math.floor(Math.random() * 100) + 1;
    aktifOyunlar[userId] = { hedef, deneme: 0, baslangic: Date.now() };

    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle(':game_die: Sayi Tahmin Oyunu')
      .setDescription('1 ile 100 arasinda bir sayi tuttum!\nTahminini `/tahmin-oyunla <sayi>` komutuyla yaz.')
      .addFields(
        { name: ':dart: Hedef', value: '???', inline: true },
        { name: ':hourglass: Deneme', value: '0', inline: true },
      )
      .setFooter({ text: 'Iptal icin /tahmin-iptal' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    setTimeout(() => {
      if (aktifOyunlar[userId]) {
        delete aktifOyunlar[userId];
        interaction.followUp({ content: ':warning: Tahmin oyunu sure asimi nedeniyle iptal edildi.', ephemeral: true }).catch(() => {});
      }
    }, 60000);
  },
};
