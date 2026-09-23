const { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const siparisDbPath = path.join(__dirname, '..', 'siparisler.json');
const aboneDbPath = path.join(__dirname, '..', 'abone-db.json');
const urunlerDbPath = path.join(__dirname, '..', 'urunler.json');

function loadDb(p) {
  try { if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) {}
  return {};
}

function saveDb(p, db) {
  fs.writeFileSync(p, JSON.stringify(db, null, 2));
}

function kodUret() {
  const harfler = 'ABCDEFGHJKLMNPRSTUVYZ23456789';
  let cikti;
  do {
    cikti = 'SİP-' + Array.from(crypto.randomBytes(6)).map(b => harfler[b % harfler.length]).join('');
  } while (loadDb(siparisDbPath)[cikti]);
  return cikti;
}

function urunleriGetir(guildId) {
  const db = loadDb(urunlerDbPath);
  const liste = db[guildId] || [];
  return liste.map((u, i) => ({ ...u, value: String(i) }));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('siparis')
    .setDescription('Urunlerden sec, benzersiz siparis kodu al'),
  async execute(interaction) {
    const urunler = urunleriGetir(interaction.guild.id);
    if (urunler.length === 0) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xFF0000).setTitle('⚠️ Ürün Yok').setDescription('Henüz ürün eklenmemiş. Yöneticiye `/urun-ekle` komutunu kullanmasını söyle.')],
        ephemeral: true,
      });
    }

    const menu = new StringSelectMenuBuilder()
      .setCustomId('siparis-sec')
      .setPlaceholder('🛒 Ürün seç...')
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions(urunler.map(u => ({
        label: `${u.ad}${u.emoji ? ' ' + u.emoji : ''} — ${u.fiyat}₡`,
        value: u.value,
      })));

    const iptalRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('siparis-iptal').setLabel('❌ Vazgeç').setStyle(ButtonStyle.Danger),
    );

    const embed = new EmbedBuilder()
      .setColor(0xF47FFF)
      .setTitle('🛒 Sipariş Sistemi')
      .setDescription('Aşağıdan **istediğin ürünü** seç.\n\nSiparişini onaylayınca sana **benzersiz sipariş kodu** verilir.')
      .addFields({ name: '📦 Ürünler', value: urunler.map(u => `${u.emoji ? u.emoji + ' ' : ''}${u.ad} — **${u.fiyat}₡**`).join('\n') })
      .setTimestamp();

    global.siparisSecim = global.siparisSecim || {};
    global.siparisSecim[interaction.user.id] = null;

    await interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(menu), iptalRow], ephemeral: true });
  },
};

module.exports.handleSec = async (interaction) => {
  global.siparisSecim = global.siparisSecim || {};
  const urunler = urunleriGetir(interaction.guild.id);
  const paket = urunler.find(p => p.value === interaction.values[0]);
  if (!paket) return interaction.reply({ content: '⚠️ Bu ürün bulunamadı (silinmiş olabilir).', ephemeral: true });

  global.siparisSecim[interaction.user.id] = paket.value;

  const tamamRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('siparis-tamam').setLabel('✅ Siparişi Onayla').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('siparis-iptal').setLabel('❌ Vazgeç').setStyle(ButtonStyle.Danger),
  );

  const embed = new EmbedBuilder()
    .setColor(0xF47FFF)
    .setTitle(`🛒 Seçtiğin Ürün`)
    .setDescription(`${paket.emoji ? paket.emoji + ' ' : ''}**${paket.ad}** — **${paket.fiyat}₡**\n\nSiparişi onaylarsan sana sipariş kodu verilir.`)
    .setTimestamp();

  await interaction.update({ embeds: [embed], components: [tamamRow] });
};

module.exports.handleTamam = async (interaction) => {
  global.siparisSecim = global.siparisSecim || {};
  const urunler = urunleriGetir(interaction.guild.id);
  const paketValue = global.siparisSecim[interaction.user.id];
  if (paketValue === null || paketValue === undefined) {
    return interaction.reply({ content: '⚠️ Önce bir ürün seçmelisin!', ephemeral: true });
  }

  const paket = urunler.find(p => p.value === paketValue);
  if (!paket) {
    return interaction.reply({ content: '⚠️ Bu ürün artık satışta değil. Yeni bir ürün seç.', ephemeral: true });
  }

  const kod = kodUret();

  const db = loadDb(siparisDbPath);
  db[kod] = {
    kullanici: interaction.user.id,
    ad: interaction.user.username,
    paket: `${paket.emoji ? paket.emoji + ' ' : ''}${paket.ad}`,
    fiyat: paket.fiyat,
    durum: 'beklemede',
    zaman: Date.now(),
  };
  saveDb(siparisDbPath, db);

  const embed = new EmbedBuilder()
    .setColor(0x57F287)
    .setTitle('✅ Siparişin Alındı!')
    .setDescription(
      `**Sipariş Kodun:** \`${kod}\`\n` +
      `**Ürün:** ${paket.emoji ? paket.emoji + ' ' : ''}${paket.ad} — **${paket.fiyat}₡**\n` +
      `**Tarih:** <t:${Math.floor(Date.now() / 1000)}:R>\n\n` +
      `Ödemeyi yaptıktan sonra **#odeme** kanalına \`${kod}\` kodunu yaz ve yetkilileri bekle. Onaylanınca **Abone** rolünü alırsın.`
    )
    .setTimestamp();

  await interaction.update({ embeds: [embed], components: [], ephemeral: true });
};

module.exports.handleIptal = async (interaction) => {
  if (global.siparisSecim) delete global.siparisSecim[interaction.user.id];
  const embed = new EmbedBuilder().setColor(0xFF0000).setTitle('❌ Sipariş İptal Edildi');
  await interaction.update({ embeds: [embed], components: [], ephemeral: true });
};

module.exports.urunleriGetir = urunleriGetir;
module.exports.urunlerDbPath = urunlerDbPath;
module.exports.siparisDbPath = siparisDbPath;
module.exports.aboneDbPath = aboneDbPath;
module.exports.loadDb = loadDb;
module.exports.saveDb = saveDb;