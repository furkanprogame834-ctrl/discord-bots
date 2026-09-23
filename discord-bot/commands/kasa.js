const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadJson, saveJson, kumarDbPath, bakiyeAl } = require('./kumar-yardimci.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kasa')
    .setDescription('Kumarhane kasa durumunu gosterir'),
  async execute(interaction) {
    const db = loadJson(kumarDbPath);
    const g = db[interaction.guild.id] || {};

    const euvel = g.kasa || 0;
    const oyuncular = Object.keys(require('fs').existsSync(require('path').join(__dirname, '..', 'balans-db.json'))
      ? JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '..', 'balans-db.json'), 'utf8')) : {})
      .filter(id => bakiyeAl(id) > 0).length;

    const embed = new EmbedBuilder()
      .setTitle(':bank: Kumarhane Kasasi')
      .addFields(
        { name: ':banknote: Kasa Dengesi', value: `${euvel} TL`, inline: true },
        { name: ':bust_in_silhouette: Aktif Oyuncu', value: `${oyuncular}`, inline: true },
        { name: ':slot_machine: Oyunlar', value: 'Kumar, Slots, Rulet, Blackjack, Poker, Zar, Yazi-Tura', inline: false },
      )
      .setColor(0xFFD700)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
