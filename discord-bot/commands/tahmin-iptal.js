const { SlashCommandBuilder } = require('discord.js');
const { aktifOyunlar } = require('./tahmin.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tahmin-iptal')
    .setDescription('Aktif tahmin oyununu iptal et'),
  async execute(interaction) {
    const userId = interaction.user.id;

    if (!aktifOyunlar[userId]) {
      return interaction.reply({ content: 'Aktif bir tahmin oyunun yok!', ephemeral: true });
    }

    const hedef = aktifOyunlar[userId].hedef;
    delete aktifOyunlar[userId];

    await interaction.reply({
      embeds: [{
        color: 0xFFA500,
        title: ':no_entry: Oyun Iptal Edildi',
        description: `Dogru cevap: **${hedef}**`,
        timestamp: new Date().toISOString(),
      }],
    });
  },
};
