const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadDb } = require('../lib/film-db.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vizyon')
    .setDescription('Vizyondaki filmleri listele'),
  async execute(interaction) {
    const db = loadDb();
    const vizyon = db.filmler.filter(f => f.vizyon);

    if (!vizyon.length) {
      return interaction.reply({ content: '🎬 Şu an vizyonda film yok.', flags: 64 });
    }

    const liste = vizyon.slice(0, 10).map((f, i) =>
      `${i + 1}. **${f.ad}** — ${f.tur} • ${f.sure} dk${f.gosterimler.length ? `\n   ⏰ Gösterimler: ${f.gosterimler.join(' • ')}` : ''}`
    ).join('\n');

    const embed = new EmbedBuilder()
      .setColor(0xE50914)
      .setTitle(`🎬 Şu an Vizyonda (${vizyon.length})`)
      .setDescription(liste)
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};