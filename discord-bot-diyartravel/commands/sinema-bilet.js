const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { loadDb } = require('../lib/film-db.js');

const dbDir = __dirname.replace('commands', '');
const ayarPath = path.join(dbDir, 'bilet-ayar-db.json');
const biletPath = path.join(dbDir, 'biletler-db.json');

function loadAyar() {
  try {
    if (fs.existsSync(ayarPath)) return JSON.parse(fs.readFileSync(ayarPath, 'utf8'));
  } catch (e) {}
  return { satisAcik: true, fiyat: 50, kapasite: 50 };
}
function saveAyar(ayar) {
  fs.writeFileSync(ayarPath, JSON.stringify(ayar, null, 2));
}
function loadBiletler() {
  try {
    if (fs.existsSync(biletPath)) return JSON.parse(fs.readFileSync(biletPath, 'utf8'));
  } catch (e) {}
  return {};
}
function saveBiletler(data) {
  fs.writeFileSync(biletPath, JSON.stringify(data, null, 2));
}
function satilanSayi(biletler) {
  return Object.keys(biletler).reduce((t, f) => t + Object.keys(biletler[f] || {}).length, 0);
}
function yeniBarkod() {
  return Array.from({ length: 20 }, () => '0123456789'[Math.floor(Math.random() * 10)]).join('');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sinema-bilet')
    .setDescription('Sanal sinema bileti sistemi')
    .addSubcommand(sub => sub.setName('al').setDescription('Sinema bileti al')
      .addStringOption(opt => opt.setName('film').setDescription('Film adı').setRequired(true))
      .addStringOption(opt => opt.setName('koltuk').setDescription('Koltuk no (örn. B7)').setRequired(true).setMaxLength(6)))
    .addSubcommand(sub => sub.setName('durum').setDescription('Bilet satış durumunu gör'))
    .addSubcommand(sub => sub.setName('ayar')
      .setDescription('Admin: Bilet satışını yönet')
      .addBooleanOption(opt => opt.setName('acik').setDescription('Satış açık mı?'))
      .addIntegerOption(opt => opt.setName('fiyat').setDescription('Bilet fiyatı (TL)').setMinValue(1))
      .addIntegerOption(opt => opt.setName('kapasite').setDescription('Toplam koltuk sayısı').setMinValue(1).setMaxValue(5000))),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const ayar = loadAyar();
    const biletler = loadBiletler();

    if (sub === 'ayar') {
      if (interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) === false) {
        return interaction.reply({ content: '❌ Bu işlem için **Yönetici** yetkisi gerekli.', flags: 64 });
      }
      const acik = interaction.options.getBoolean('acik');
      const fiyat = interaction.options.getInteger('fiyat');
      const kapasite = interaction.options.getInteger('kapasite');
      if (acik !== null) ayar.satisAcik = acik;
      if (fiyat !== null) ayar.fiyat = fiyat;
      if (kapasite !== null) ayar.kapasite = kapasite;
      saveAyar(ayar);
      return interaction.reply({
        content: `✅ Bilet ayarları güncellendi!\n\n💰 Fiyat: **${ayar.fiyat.toLocaleString('tr-TR')} TL**\n🪑 Kapasite: **${ayar.kapasite}**\n${ayar.satisAcik ? '🟢 Satış **AÇIK**' : '🔴 Satış **KAPALI**'}`,
        flags: 64,
      });
    }

    if (sub === 'durum') {
      const dolu = satilanSayi(biletler);
      const embed = new EmbedBuilder()
        .setColor(ayar.satisAcik ? 0x00FF88 : 0xFF5555)
        .setTitle('🎟️ Sinema Bilet Durumu')
        .setDescription(
          `${ayar.satisAcik ? '🟢 Satışlar açık!' : '🔴 Satışlar kapalı.'}\n\n` +
          `💰 Bilet fiyatı: **${ayar.fiyat.toLocaleString('tr-TR')} TL**\n` +
          `🪑 Doluluk: **${dolu}/${ayar.kapasite}**\n\n` +
          `${ayar.satisAcik ? 'Bilet almak için: `/sinema-bilet al film:<film> koltuk:<koltuk>`' : 'Yeni bir öncesinde takipte kal!'}`
        )
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    // al
    if (!ayar.satisAcik) {
      return interaction.reply({ content: '🔴 Bilet satışı şu an **kapalı**. Satış açılınca tekrar dene!', flags: 64 });
    }

    const filmAd = interaction.options.getString('film').toLowerCase();
    const koltuk = interaction.options.getString('koltuk').toUpperCase();
    const db = loadDb();
    const film = db.filmler.find(f => f.ad.toLowerCase() === filmAd);
    if (!film) {
      return interaction.reply({ content: `❌ **${interaction.options.getString('film')}** listede bulunamadı. /vizyon ile kontrol et.`, flags: 64 });
    }
    if (!film.vizyon) {
      return interaction.reply({ content: `📀 **${film.ad}** artık vizyonda değil; bilet satılmıyor.`, flags: 64 });
    }

    if (!biletler[film.ad]) biletler[film.ad] = {};
    if (biletler[film.ad][koltuk]) {
      return interaction.reply({ content: `❌ **${koltuk}** koltuğu zaten dolu. Başka bir koltuk seç veya koltuğun dolu olup olmadığını **durum** ile kontrol et.`, flags: 64 });
    }
    if (satilanSayi(biletler) >= ayar.kapasite) {
      return interaction.reply({ content: `❌ Kapasite doldu! (**${ayar.kapasite}**) Yeni seanslar için bekleyin.`, flags: 64 });
    }

    biletler[film.ad][koltuk] = { alan: interaction.user.id, zaman: Date.now() };
    saveBiletler(biletler);

    const barkod = yeniBarkod();
    const kod = `${film.id.slice(0, 4).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date();

    const embed = new EmbedBuilder()
      .setColor(0xE50914)
      .setTitle(`🎟️ ${film.ad}`)
      .setDescription(
        `**Salon:** Grand Cineverse\n` +
        `**Koltuk:** ${koltuk}\n` +
        `**Fiyat:** ${ayar.fiyat.toLocaleString('tr-TR')} TL\n` +
        `**Tarih:** ${now.toLocaleDateString('tr-TR')}\n\n` +
        `━━━━━━━━━━━━━━━━\n` +
        `${barkod}\n` +
        `İyi seyirler! 🍿`
      )
      .setThumbnail(film.afis || interaction.guild?.iconURL({ dynamic: true }) || null)
      .setFooter({ text: `Bilet No: ${kod}` })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};