const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadDb, TURLER } = require('../lib/film-db.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('film-oneri')
    .setDescription('Rastgele film öner')
    .addStringOption(opt => opt.setName('tur').setDescription('İstediğin tür').addChoices(...TURLER.map(t => ({ name: t, value: t })))),
  async execute(interaction) {
    const tur = interaction.options.getString('tur');
    const db = loadDb();

    let filmler = db.filmler;
    if (filmler.length === 0) {
      return interaction.reply({ content: '📭 Henüz liste boş. Bir adminden film eklemesini iste!', flags: 64 });
    }
    if (tur) {
      filmler = filmler.filter(f => f.tur === tur);
      if (!filmler.length) {
        return interaction.reply({ content: `❌ **${tur}** türünde film yok.`, flags: 64 });
      }
    }

    const f = filmler[Math.floor(Math.random() * filmler.length)];
    const embed = new EmbedBuilder()
      .setColor(0xE50914)
      .setTitle(f.afis ? `🎥 ${f.ad}` : `🍿 ${f.ad}`)
      .setDescription(
        `${f.vizyon ? '🎬 **Vizyonda**' : '📀 **Arşiv**'} • ${f.tur} • ${f.sure} dk\n\n${f.ozet}`,
      )
      .setFooter({ text: 'Bu akşam bunu izlemeye ne dersin?' })
      .setTimestamp();

    if (f.afis) embed.setThumbnail(f.afis);

    return interaction.reply({ embeds: [embed] });
  },
};