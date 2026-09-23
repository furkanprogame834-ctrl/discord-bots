const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { loadDb, saveDb, yeniId, TURLER } = require('../lib/film-db.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('film-ekle')
    .setDescription('Admin: Sinema listesine film ekler')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(opt => opt.setName('ad').setDescription('Film adı').setRequired(true).setMaxLength(80))
    .addStringOption(opt => opt.setName('tur').setDescription('Film türü').setRequired(true).addChoices(...TURLER.map(t => ({ name: t, value: t }))))
    .addIntegerOption(opt => opt.setName('sure').setDescription('Süre (dakika)').setRequired(true).setMinValue(1).setMaxValue(600))
    .addStringOption(opt => opt.setName('ozet').setDescription('Kısa özet').setMaxLength(600))
    .addStringOption(opt => opt.setName('afis').setDescription('Afiş görsel URL')) 
    .addBooleanOption(opt => opt.setName('vizyon').setDescription('Vizyonda mı? (varsayılan ✓)').setRequired(false)),
  async execute(interaction) {
    const ad = interaction.options.getString('ad');
    const tur = interaction.options.getString('tur');
    const sure = interaction.options.getInteger('sure');
    const ozet = interaction.options.getString('ozet') || 'Özet girilmedi.';
    const afis = interaction.options.getString('afis');
    const vizyon = interaction.options.getBoolean('vizyon') ?? true;

    const db = loadDb();
    if (db.filmler.some(f => f.ad.toLowerCase() === ad.toLowerCase())) {
      return interaction.reply({ content: `❌ **${ad}** zaten listede!`, flags: 64 });
    }

    db.filmler.push({
      id: yeniId(),
      ad,
      tur,
      sure,
      ozet,
      afis,
      vizyon,
      gosterimler: [],
      ekleyen: interaction.user.id,
      eklenme: Date.now(),
    });
    saveDb(db);

    return interaction.reply({ content: `✅ **${ad}** ({${tur}}, ${sure} dk) listedeki eklendi.`, flags: 64 });
  },
};