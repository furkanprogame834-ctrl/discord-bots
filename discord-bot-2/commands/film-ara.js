const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadDb } = require('../lib/film-db.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('film-ara')
    .setDescription('Sinema listesinde film ara')
    .addStringOption(opt => opt.setName('ad').setDescription('Aranacak film adı').setRequired(true))
    .addBooleanOption(opt => opt.setName('sadece-vizyon').setDescription('Yalnızca vizyondakilerde ara')),
  async execute(interaction) {
    const ad = interaction.options.getString('ad').toLowerCase();
    const sadeceVizyon = interaction.options.getBoolean('sadece-vizyon') ?? false;

    const db = loadDb();
    let filmler = db.filmler.filter(f => f.ad.toLowerCase().includes(ad));
    if (sadeceVizyon) filmler = filmler.filter(f => f.vizyon);

    if (!filmler.length) {
      return interaction.reply({ content: `🔍 **${interaction.options.getString('ad')}** için sonuç bulunamadı.`, flags: 64 });
    }

    const sonuc = filmler.slice(0, 6).map(f =>
      `**${f.ad}** — ${f.tur} • ${f.sure} dk • ${f.vizyon ? '🎬 Vizyonda' : '📀 Arşiv'}` +
      `\n${f.ozet.slice(0, 140)}`
    ).join('\n\n');

    const embed = new EmbedBuilder()
      .setColor(0xE50914)
      .setTitle(`🎬 Sonuçlar (${filmler.length})`)
      .setDescription(sonuc)
      .setTimestamp();

    if (filmler.length) {
      const ilk = filmler[0];
      if (ilk.afis) embed.setThumbnail(ilk.afis);
    }

    return interaction.reply({ embeds: [embed] });
  },
};