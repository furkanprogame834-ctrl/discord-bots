const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { loadDb, saveDb } = require('../lib/film-db.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('film-gosterim')
    .setDescription('Film gösterim programı')
    .addSubcommand(sub => sub.setName('listele').setDescription('Tüm gösterim programını göster'))
    .addSubcommand(sub => sub.setName('ekle')
      .setDescription('Admin: Bir filme gösterim saati ekle')
      .addStringOption(opt => opt.setName('film').setDescription('Film adı').setRequired(true))
      .addStringOption(opt => opt.setName('saat').setDescription('Örn. 21:30').setRequired(true))
      .addBooleanOption(opt => opt.setName('duyur').setDescription('Gösterimi kanala duyur? (varsayılan ✓)'))
      .addChannelOption(opt => opt.setName('kanal').setDescription('Duyuru kanalı (boşsa bu kanala atar)')))
    .addSubcommand(sub => sub.setName('sil')
      .setDescription('Admin: Film gösterimini sil')
      .addStringOption(opt => opt.setName('film').setDescription('Film adı').setRequired(true))
      .addStringOption(opt => opt.setName('saat').setDescription('Silinecek saat').setRequired(true))),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const db = loadDb();

    if (sub === 'listele') {
      const vizyon = db.filmler.filter(f => f.vizyon && f.gosterimler.length);
      if (!vizyon.length) return interaction.reply({ content: '🎫 Henüz gösterim programında film yok.', flags: 64 });

      const list = vizyon.map(f => `**${f.ad}**\n⏰ ${f.gosterimler.join(' • ')}`).join('\n\n');
      const embed = new EmbedBuilder()
        .setColor(0xE50914)
        .setTitle('🎬 Gösterim Programı')
        .setDescription(list)
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    if (interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) === false) {
      return interaction.reply({ content: '❌ Bu işlem için **Yönetici** yetkisi gerekli.', flags: 64 });
    }

    const filmAd = interaction.options.getString('film').toLowerCase();
    const film = db.filmler.find(f => f.ad.toLowerCase() === filmAd);
    if (!film) return interaction.reply({ content: `❌ **${interaction.options.getString('film')}** listede bulunamadı.`, flags: 64 });

    if (sub === 'sil') {
      const saat = interaction.options.getString('saat');
      const onceki = film.gosterimler.length;
      film.gosterimler = film.gosterimler.filter(s => s !== saat);
      saveDb(db);
      const degisti = film.gosterimler.length !== onceki;
      return interaction.reply({ content: degisti ? `🗑️ **${film.ad}**'den **${saat}** gösterimi kaldırıldı.` : `ℹ️ **${saat}** gösterimi bulunamadı.`, flags: 64 });
    }

    const saat = interaction.options.getString('saat');
    if (film.gosterimler.includes(saat)) {
      return interaction.reply({ content: `⚠️ **${saat}** zaten **${film.ad}** programında.`, flags: 64 });
    }
    film.gosterimler.push(saat);
    saveDb(db);

    const duyur = interaction.options.getBoolean('duyur') ?? true;
    if (duyur) {
      const kanal = interaction.options.getChannel('kanal') || interaction.channel;
      const embed = new EmbedBuilder()
        .setColor(0xE50914)
        .setTitle('🎬 Gösterim Duyurusu!')
        .setDescription(`**${film.ad}** artık **${saat}** saatinde izlenebilir!\n\nDon't miss it! 🍿`)
        .setTimestamp();
      await kanal.send({ embeds: [embed] });
    }

    return interaction.reply({ content: `✅ **${film.ad}** için **${saat}** gösterimi eklendi${duyur ? ' ve duyuruldu' : ''}.`, flags: 64 });
  },
};