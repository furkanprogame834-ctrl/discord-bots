const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { bakiyeAl, paraCikar } = require('./kumar-yardimci.js');

const envanterDbPath = path.join(__dirname, '..', 'restoran-db.json');
const xpDbPath = path.join(__dirname, '..', 'xp-db.json');

// Her yemek başlangıcında verilen XP (mesaj başı XP'den daha az: 3-10)
const XP_KAZANC = 2;

function loadDb() {
  try { if (fs.existsSync(envanterDbPath)) return JSON.parse(fs.readFileSync(envanterDbPath, 'utf8')); } catch (e) {}
  return {};
}
function saveDb(db) {
  fs.writeFileSync(envanterDbPath, JSON.stringify(db, null, 2));
}

// Restoran menüsü
const MENU = [
  { ad: 'Pizza', fiyat: 100, emoji: '🍕' },
  { ad: 'Burger', fiyat: 85, emoji: '🍔' },
  { ad: 'Döner', fiyat: 75, emoji: '🌯' },
  { ad: 'Lahmacun', fiyat: 90, emoji: '🥙' },
  { ad: 'Pide', fiyat: 110, emoji: '🥟' },
  { ad: 'Tavuk Kanat', fiyat: 95, emoji: '🍗' },
  { ad: 'Kebap', fiyat: 150, emoji: '🍢' },
  { ad: 'Sushi', fiyat: 200, emoji: '🍣' },
];

// Sipariş ver (hem komut hem buton kullanır)
function siparisVer(userId, yemekAdi) {
  const yemek = MENU.find(m => m.ad === yemekAdi);
  if (!yemek) return { basarili: false, hata: 'Yemek bulunamadı.' };

  const bakiyem = bakiyeAl(userId);
  if (bakiyem < yemek.fiyat) {
    return {
      basarili: false,
      yemek,
      hata: `Yetersiz bakiye! Bakiyen: **${bakiyem.toLocaleString('tr-TR')} TL**, gereken: **${yemek.fiyat.toLocaleString('tr-TR')} TL**`,
    };
  }

  paraCikar(userId, yemek.fiyat);

  const db = loadDb();
  if (!db[userId]) db[userId] = { esyalar: {}, harcanan: 0 };
  db[userId].esyalar[yemek.ad] = (db[userId].esyalar[yemek.ad] || 0) + 1;
  db[userId].harcanan += yemek.fiyat;
  saveDb(db);

  // Yemeyince az XP kazan (mesaj başı XP'den az: +2)
  const xpDb = (() => { try { if (fs.existsSync(xpDbPath)) return JSON.parse(fs.readFileSync(xpDbPath, 'utf8')); } catch (e) {} return {}; })();
  if (!xpDb[userId]) xpDb[userId] = { xp: 0, level: 0, mesaj: 0 };
  xpDb[userId].xp = (xpDb[userId].xp || 0) + XP_KAZANC;
  fs.writeFileSync(xpDbPath, JSON.stringify(xpDb, null, 2));

  return {
    basarili: true,
    yemek,
    kalan: bakiyeAl(userId),
    adet: db[userId].esyalar[yemek.ad],
    xp: XP_KAZANC,
  };
}

// Menü embed + buton satırları (panel için)
function menuSatirlari() {
  const embed = new EmbedBuilder()
    .setColor(0xff8c42)
    .setTitle('🍽️ Restoran Menüsü')
    .setDescription(MENU.map(m => `${m.emoji} **${m.ad}** — ${m.fiyat.toLocaleString('tr-TR')} TL`).join('\n') +
      '\n\nBeğendiğin yemeğin butonuna bas, siparişin hazırlansın!')
    .setFooter({ text: 'Siparişler balansından düşülür, envanterine eklenir.' })
    .setTimestamp();

  const satirlar = [];
  for (let i = 0; i < MENU.length; i += 4) {
    satirlar.push(new ActionRowBuilder().addComponents(
      MENU.slice(i, i + 4).map(m => new ButtonBuilder()
        .setCustomId('restoran-panel_' + m.ad)
        .setLabel(m.ad)
        .setEmoji(m.emoji)
        .setStyle(ButtonStyle.Primary))
    ));
  }
  return { embed, satirlar };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('restoran')
    .setDescription('Restoran: yemek siparişi ver, envanterini gör')
    .addSubcommand(sub => sub.setName('menu').setDescription('Restoran menüsüne bak'))
    .addSubcommand(sub => sub.setName('panel').setDescription('Herkese açık sipariş panelini kur (Admin)'))
    .addSubcommand(sub => sub
      .setName('siparis')
      .setDescription('Bir yemek sipariş et')
      .addStringOption(opt => opt
        .setName('yemek')
        .setDescription('Seçeceğin yemek')
        .setRequired(true)
        .addChoices(...MENU.map(m => ({ name: `${m.emoji} ${m.ad} (${m.fiyat} TL)`, value: m.ad })))))
    .addSubcommand(sub => sub.setName('envanter').setDescription('Aldığın yemekleri gör')),
  MENU,
  siparisVer,
  menuSatirlari,
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'panel') {
      if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: '❌ Bu komut **Admin** yetkisi ister.', flags: 64 });
      }
      const { embed, satirlar } = menuSatirlari();
      return interaction.reply({ embeds: [embed], components: satirlar });
    }

    if (sub === 'menu') {
      const { embed } = menuSatirlari();
      const bakiyem = bakiyeAl(interaction.user.id);
      embed.setDescription(
        `Cüzdanın: **${bakiyem.toLocaleString('tr-TR')} TL**\n\n` +
        embed.data.description
      );
      return interaction.reply({ embeds: [embed], flags: 64 });
    }

    if (sub === 'siparis') {
      const yemekAdi = interaction.options.getString('yemek');
      const sonuc = siparisVer(interaction.user.id, yemekAdi);

      if (!sonuc.basarili) {
        return interaction.reply({ content: `❌ ${sonuc.hata}`, flags: 64 });
      }

      const embed = new EmbedBuilder()
        .setColor(0x00ff88)
        .setTitle(`${sonuc.yemek.emoji} Siparişin Hazır!`)
        .setDescription(
          `**${sonuc.yemek.ad}** aldın!\n\n` +
          `💸 Ödenen: **${sonuc.yemek.fiyat.toLocaleString('tr-TR')} TL**\n` +
          `💰 Kalan bakiye: **${sonuc.kalan.toLocaleString('tr-TR')} TL**\n` +
          `🎒 Envanterindeki adet: **${sonuc.adet}**\n` +
          `✨ Kazanılan XP: **+${sonuc.xp}**`
        );
      return interaction.reply({ embeds: [embed], flags: 64 });
    }

    // envanter
    const db = loadDb();
    const kayit = db[interaction.user.id];
    const esyaKayitlari = kayit ? Object.entries(kayit.esyalar) : [];

    if (esyaKayitlari.length === 0) {
      return interaction.reply({ content: '🎒 Envanterin şu an boş! `/restoran menu` ile bak. 😋', flags: 64 });
    }

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle('🎒 Envanterin')
      .setDescription(
        esyaKayitlari.map(([ad, adet]) => {
          const y = MENU.find(m => m.ad === ad);
          return `${y ? y.emoji : '•'} **${ad}** × ${adet}`;
        }).join('\n') +
        `\n\nToplam harcama: **${(kayit.harcanan || 0).toLocaleString('tr-TR')} TL**`
      );
    return interaction.reply({ embeds: [embed], flags: 64 });
  },
};