const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

const MIN_BALANS_PATH = 'C:\\Users\\user\\Documents\\Default Project\\discord-bot\\balans-db.json';
const MIN_MAGAZA_PATH = 'C:\\Users\\user\\Documents\\Default Project\\discord-bot\\teknoloji-db.json';
const dbPath = MIN_BALANS_PATH;
const magazaDbPath = MIN_MAGAZA_PATH;

function loadJson(p) {
  try { if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) {}
  return {};
}
function saveJson(p, d) {
  fs.writeFileSync(p, JSON.stringify(d, null, 2));
}

function bakiyeAl(userId) {
  const db = loadJson(dbPath);
  if (!db[userId]) db[userId] = { para: 0, sonBonus: 0 };
  return db[userId].para || 0;
}

function paraCikar(userId, miktar) {
  const db = loadJson(dbPath);
  if (!db[userId]) db[userId] = { para: 0, sonBonus: 0 };
  const mevcut = db[userId].para || 0;
  if (mevcut < miktar) return false;
  db[userId].para = mevcut - miktar;
  saveJson(dbPath, db);
  return true;
}

// Teknoloji mağazası ürünleri
const URUNLER = [
  { ad: 'Telefon', fiyat: 2500, emoji: '📱' },
  { ad: 'Laptop', fiyat: 6000, emoji: '💻' },
  { ad: 'Kulaklık', fiyat: 400, emoji: '🎧' },
  { ad: 'Klavye', fiyat: 350, emoji: '⌨️' },
  { ad: 'Mouse', fiyat: 200, emoji: '🖱️' },
  { ad: 'Monitör', fiyat: 1200, emoji: '🖥️' },
  { ad: 'Konsol', fiyat: 4500, emoji: '🎮' },
  { ad: 'Tablet', fiyat: 1800, emoji: '📟' },
];

// Satın al (hem komut hem buton kullanır)
function satinAl(userId, urunAdi) {
  const urun = URUNLER.find(u => u.ad === urunAdi);
  if (!urun) return { basarili: false, hata: 'Ürün bulunamadı.' };

  const bakiyem = bakiyeAl(userId);
  if (bakiyem < urun.fiyat) {
    return {
      basarili: false,
      urun,
      hata: `Yetersiz bakiye! Bakiyen: **${bakiyem.toLocaleString('tr-TR')} TL**, gereken: **${urun.fiyat.toLocaleString('tr-TR')} TL**`,
    };
  }

  paraCikar(userId, urun.fiyat);

  const db = loadJson(magazaDbPath);
  if (!db[userId]) db[userId] = { esyalar: {}, harcanan: 0 };
  db[userId].esyalar[urun.ad] = (db[userId].esyalar[urun.ad] || 0) + 1;
  db[userId].harcanan += urun.fiyat;
  saveJson(magazaDbPath, db);

  return {
    basarili: true,
    urun,
    kalan: bakiyeAl(userId),
    adet: db[userId].esyalar[urun.ad],
  };
}

// Mağaza embed + buton satırları (panel için)
function magazaSatirlari() {
  const embed = new EmbedBuilder()
    .setColor(0x00bcd4)
    .setTitle('🛒 Teknoloji Mağazası')
    .setDescription(URUNLER.map(u => `${u.emoji} **${u.ad}** — ${u.fiyat.toLocaleString('tr-TR')} TL`).join('\n') +
      '\n\nİstediğin ürünün butonuna bas, siparişin hazırlansın!')
    .setFooter({ text: 'Ürünler balansından düşülür, envanterine eklenir.' })
    .setTimestamp();

  const satirlar = [];
  for (let i = 0; i < URUNLER.length; i += 4) {
    satirlar.push(new ActionRowBuilder().addComponents(
      URUNLER.slice(i, i + 4).map(u => new ButtonBuilder()
        .setCustomId('teknoloji-panel_' + u.ad)
        .setLabel(u.ad)
        .setEmoji(u.emoji)
        .setStyle(ButtonStyle.Primary))
    ));
  }
  return { embed, satirlar };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('teknoloji')
    .setDescription('Teknoloji mağazası: ürün satın al, envanterini gör')
    .addSubcommand(sub => sub.setName('menu').setDescription('Mağaza ürünlerine bak'))
    .addSubcommand(sub => sub.setName('panel').setDescription('Herkese açık mağaza panelini kur (Admin)'))
    .addSubcommand(sub => sub
      .setName('al')
      .setDescription('Bir ürün satın al')
      .addStringOption(opt => opt
        .setName('urun')
        .setDescription('Alacağın ürün')
        .setRequired(true)
        .addChoices(...URUNLER.map(u => ({ name: `${u.emoji} ${u.ad} (${u.fiyat} TL)`, value: u.ad })))))
    .addSubcommand(sub => sub.setName('envanter').setDescription('Aldığın ürünleri gör')),
  URUNLER,
  satinAl,
  magazaSatirlari,
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'panel') {
      if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: '❌ Bu komut **Admin** yetkisi ister.', flags: 64 });
      }
      const { embed, satirlar } = magazaSatirlari();
      return interaction.reply({ embeds: [embed], components: satirlar });
    }

    if (sub === 'menu') {
      const { embed } = magazaSatirlari();
      const bakiyem = bakiyeAl(interaction.user.id);
      embed.setDescription(
        `Cüzdanın: **${bakiyem.toLocaleString('tr-TR')} TL**\n\n` +
        embed.data.description
      );
      return interaction.reply({ embeds: [embed], flags: 64 });
    }

    if (sub === 'al') {
      const urunAdi = interaction.options.getString('urun');
      const sonuc = satinAl(interaction.user.id, urunAdi);

      if (!sonuc.basarili) {
        return interaction.reply({ content: `❌ ${sonuc.hata}`, flags: 64 });
      }

      const embed = new EmbedBuilder()
        .setColor(0x00ff88)
        .setTitle(`${sonuc.urun.emoji} Satın Alma Başarılı!`)
        .setDescription(
          `**${sonuc.urun.ad}** aldın!\n\n` +
          `💸 Ödenen: **${sonuc.urun.fiyat.toLocaleString('tr-TR')} TL**\n` +
          `💰 Kalan bakiye: **${sonuc.kalan.toLocaleString('tr-TR')} TL**\n` +
          `🎒 Envanterindeki adet: **${sonuc.adet}**`
        );
      return interaction.reply({ embeds: [embed], flags: 64 });
    }

    // envanter
    const db = loadJson(magazaDbPath);
    const kayit = db[interaction.user.id];
    const esyaKayitlari = kayit ? Object.entries(kayit.esyalar) : [];

    if (esyaKayitlari.length === 0) {
      return interaction.reply({ content: '🎒 Envanterin şu an boş! `/teknoloji menu` ile bak.', flags: 64 });
    }

    const embed = new EmbedBuilder()
      .setColor(0x00bcd4)
      .setTitle('🎒 Envanterin')
      .setDescription(
        esyaKayitlari.map(([ad, adet]) => {
          const u = URUNLER.find(x => x.ad === ad);
          return `${u ? u.emoji : '•'} **${ad}** × ${adet}`;
        }).join('\n') +
        `\n\nToplam harcama: **${(kayit.harcanan || 0).toLocaleString('tr-TR')} TL**`
      );
    return interaction.reply({ embeds: [embed], flags: 64 });
  },
};