const { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');
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
function otomatikKoltuk(biletler, filmAd, kapasite) {
  const alinan = Object.keys(biletler[filmAd] || {});
  for (let i = 1; i <= kapasite; i++) {
    const k = `A${i}`;
    if (!alinan.includes(k)) return k;
  }
  return null;
}
function yeniBarkod() {
  return Array.from({ length: 20 }, () => '0123456789'[Math.floor(Math.random() * 10)]).join('');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bilet-panel')
    .setDescription('Admin: Vizyondaki filmler için tıklanarak bilet alınabilen panel açar')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(opt => opt.setName('kanal').setDescription('Panel kanalı (boşsa bu kanala atar)')),
  async execute(interaction) {
    try {
      await this._run(interaction);
    } catch (hata) {
      console.error('bilet-panel hatasi:', hata);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '⚠️ Panel açılırken bir sorun oldu. Tekrar dene!', flags: 64 }).catch(() => {});
      }
    }
  },

  async _run(interaction) {
    const db = loadDb();
    const vizyon = db.filmler.filter(f => f.vizyon);

    const kanal = interaction.options.getChannel('kanal') || interaction.channel;

    const baslik = new EmbedBuilder()
      .setColor(0xE50914)
      .setTitle('🎟️ Grand Cineverse — Bilet Al')
      .setDescription('Aşağıdan bir film seç, sana **otomatik boş koltuk** atansın!\n\n🎬 Sinema keyfi herkese! 🍿');

    if (!vizyon.length) {
      baslik.setDescription('📭 Şu an vizyonda film yok. Yönetici ekleyince buradan bilet alabilirsin.');
      await kanal.send({ embeds: [baslik] });
      return interaction.reply({ content: 'Panel açıldı (vizyonda film yok).', flags: 64 });
    }

    const menu = new StringSelectMenuBuilder()
      .setCustomId('bilet-film-sec')
      .setPlaceholder('🎬 Film seç (vizyondakiler)')
      .addOptions(vizyon.slice(0, 25).map(f => ({
        label: f.ad.length > 95 ? f.ad.slice(0, 92) + '...' : f.ad,
        value: f.id,
        description: `${f.tur} • ${f.sure} dk${f.gosterimler.length ? ' • ' + f.gosterimler[0] : ''}`,
      })));

    const row = new ActionRowBuilder().addComponents(menu);
    const panelMesaj = await kanal.send({ embeds: [baslik], components: [row] });
    await interaction.reply({ content: `✅ Bilet paneli <#${kanal.id}> kanalında açıldı.`, flags: 64 });

    const ayar = loadAyar();
    const biletler = loadBiletler();

    const kollektor = panelMesaj.createMessageComponentCollector({ time: 60 * 60 * 1000 });

    kollektor.on('collect', async (i) => {
      await i.deferUpdate().catch(() => {});
      if (!ayar.satisAcik) {
        return i.followUp({ content: '🔴 Bilet satışı şu an **kapalı**.', flags: 64 }).catch(() => {});
      }
      const film = db.filmler.find(f => f.id === i.values[0]);
      if (!film) return;

      if (satilanSayi(biletler) >= ayar.kapasite) {
        return i.followUp({ content: `❌ Kapasite doldu! (**${ayar.kapasite}**)`, flags: 64 }).catch(() => {});
      }

      const koltuk = otomatikKoltuk(biletler, film.ad, ayar.kapasite);
      if (!koltuk) {
        return i.followUp({ content: `❌ **${film.ad}** için boş koltuk kalmadı.`, flags: 64 }).catch(() => {});
      }

      biletler[film.ad] = biletler[film.ad] || {};
      biletler[film.ad][koltuk] = { alan: i.user.id, zaman: Date.now() };
      saveBiletler(biletler);

      const barkod = yeniBarkod();
      const now = new Date();
      const biletEmbed = new EmbedBuilder()
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
        .setThumbnail(film.afis || i.guild?.iconURL({ dynamic: true }) || null)
        .setFooter({ text: 'Grand Cineverse' })
        .setTimestamp();

      return i.followUp({ embeds: [biletEmbed], flags: 64 }).catch(() => {});
    });
  },
};