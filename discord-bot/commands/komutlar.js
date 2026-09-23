const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

const kategoriler = {
  genel: {
    emoji: '💬',
    ad: 'Genel / Bilgi',
    komutlar: [
      'ping - Bot gecikme suresi',
      'merhaba - Botla selamlas',
      'saat - Guncel saat',
      'avatar - Kullanici avatar',
      'profil - Kullanici profili',
      'sunucu - Sunucu bilgisi',
      'sunucu-bilgi - Detayli sunucu bilgisi',
      'uye-sayi - Uye sayisi ses kanali',
      'suv - Sunucu davet linki',
      'not - Kendine not birak',
      'hatirlat - Belirli sure sonra hatirlat',
      'seviye - Seviye bilgisi',
      'istatistik - Kullanici istatistikleri',
      'durum-log - Sunucu aktivite logu',
    ],
  },
  moderasyon: {
    emoji: '🛡️',
    ad: 'Moderasyon',
    komutlar: [
      'ban - Uye yasakla',
      'kick - Uye at',
      'mute - Uyeyi sustur',
      'unmute - Susturmasi kaldir',
      'agir-mod - Agir gelismis moderasyon sistemi',
      'temizle - Mesaj sil',
      'temizle-bot - Bot mesajlarini sil',
      'kilitle - Kanal kilitle/ac',
      'toplu-ban - Toplu yasakla',
      'toplu-kick - Toplu at',
      'toplu-unmute - Toplu susturma kaldir',
      'toplu-unban - Toplu yasak kaldir',
      'rol-ver - Role toplu ekle',
      'rol-al - Rolu toplu kaldir',
      'herkes-rol - HERKESE rol ver/al',
      'rol-kick - Rolu olan herkesi at',
      'mesaj-ozet - Mesaj sayilari',
      'sunucu-temizlik - Kanallari/mesajlari temizle',
      'sustur-listesi - Tum mute\'lar',
    ],
  },
  kumarhane: {
    emoji: '🎰',
    ad: 'Ekonomi / Kumarhane',
    komutlar: [
      'balans - Sanal para sistemi (bak/bonus/transfer/tablo)',
      'odul - Gunluk kumarhane odulu',
      'is - Kumarhanede calis',
      'kumar - Kirmizi/Siyah/Zar oyunu',
      'slots - Slot makinesi',
      'roulette - Rulet',
      'blackjack - 21 oyunu',
      'poker - Basit poker',
      'kart-cek - Kart cek',
      'zar-at - 2 zar at',
      'zar-savas - Zar savasi',
      'yazi-tura - Bahisli yazi tura',
      'sayi-tut - Sayi tahmin',
      'yildiz - Kapali kutular',
      'kazandiran - Sans talisi',
      'kumarhane-islet - Kumarhane gelir',
      'kasa - Kumarhane kasasi',
      'kumarhane-kurulum - Kurulum rehberi',
      'kumar-roldu - 50 kumar rolu ayarla',
    ],
  },
  eglence: {
    emoji: '😄',
    ad: 'Eglence',
    komutlar: [
      'asik - Ask olcer',
      'reels - Rastgele YouTube Short izle (butonla geç)',
      'shrek - Shrek konusur',
      'kufur - Bot kufur eder',
      'meme - Rastgele meme',
      'meme-emoji - Sunucuya meme emoji',
      'ship-patlat - Ship olcer',
      'kim - Rastgele uye sec',
      'rastgele - Secim yapar',
      'hair - Harf hesapla',
      'anket - Anket olustur',
      'giveaway - Cekilis',
      'soyle - Botu konustur',
      'tahmin - Sayi tahmin oyunu',
      'tahmin-oyunla - Tahmin oyunu baslat',
      'tahmin-iptal - Tahmin oyunu iptal',
    ],
  },
  ticket: {
    emoji: '🎫',
    ad: 'Ticket',
    komutlar: [
      'ticket-panel - Ticket paneli olustur',
      'ticket-ac - Ticket ac',
      'ticket-kapat - Ticket kapat ve log',
    ],
  },
  magaza: {
    emoji: '🛒',
    ad: 'Dukkan / Restoran',
    komutlar: [
      'restoran - Yemek siparisi ve envanter (menu/panel/siparis)',
      'teknoloji - Teknoloji magazasi (menu/panel/al)',
      'uyelik - Star/Star Plus uyelik sistemi (durum/al/panel/ayarla)',
    ],
  },
  ayarlar: {
    emoji: '⚙️',
    ad: 'Ayarlar / Yapilandirma',
    komutlar: [
      'otomatik-rol - Yeni uyelere rol',
      'level-rol - Seviyeye ulasinca rol ayarla',
      'level-ver - Kullaniciya level ver (admin)',
      'oto-tag - Katilanlara tag ekle',
      'oto-cevap-ekle - Oto-cevap ekle',
      'oto-cevap-kur - Sablonlu oto-cevap',
      'oto-cevap-sil - Oto-cevap sil',
      'hosgeldin-ozel - Ozel hos geldin DM',
      'duyuru - Embedli duyuru',
      'tekrar-et - Tekrarlayan mesaj',
      'tekrar-durdur - Tekrari durdur',
      'rol-ayarla - Reaksiyon rol mesaji',
      'log-kanal - Gelen/giden log kanali',
      'yas-siniri - Yas dogrulama sistemi',
      'kumar-izin - Kumar kanali ayarla',
      'kumar-yasak - Kullaniciyi yasakla',
      'kumar-ac - Kumarhaneyi ac/kapat',
      'para-ver - Para ver (admin)',
      'para-al - Para al (admin)',
      'sunucu-olustur - Sunucu olustur',
      'sunucu-patlat - Sunucuyu patlat (admin)',
    ],
  },
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('komutlar')
    .setDescription('Tum komutlari kategoriye gore gosterir'),
  async execute(interaction) {
    const secenekler = Object.entries(kategoriler).map(([key, kat]) => ({
      label: kat.ad,
      value: key,
      description: `${kat.komutlar.length} komut`,
      emoji: kat.emoji,
    }));

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('komut_kategori')
        .setPlaceholder('Kategori sec')
        .addOptions(secenekler),
    );

    const genelOzet = Object.entries(kategoriler).map(([key, kat]) => `${kat.emoji} **${kat.ad}** — ${kat.komutlar.length} komut`).join('\n');
    const toplamKomut = Object.values(kategoriler).reduce((s, k) => s + k.komutlar.length, 0);

    const baslangic = new EmbedBuilder()
      .setTitle(':bookmark_tabs: Komut Kategorileri')
      .setDescription(`Toplam **${toplamKomut}+** komut\n\n${genelOzet}\n\nKategori secmek icin asagidaki menuyu kullan!`)
      .setColor(0x00BFFF)
      .setFooter({ text: interaction.guild.name })
      .setTimestamp();

    const msg = await interaction.reply({ embeds: [baslangic], components: [row], fetchReply: true });

    const collector = msg.createMessageComponentCollector({ time: 60000 });

    collector.on('collect', async (i) => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: 'Bu menuyu sadece komutu kullanan kisi kullanabilir!', ephemeral: true });
      }
      if (i.isStringSelectMenu()) {
        const kat = kategoriler[i.values[0]];
        const embed = new EmbedBuilder()
          .setTitle(`${kat.emoji} ${kat.ad} Komutlari (${kat.komutlar.length})`)
          .setDescription(kat.komutlar.map(k => `\`/${k}\``).join('\n'))
          .setColor(0x00BFFF)
          .setFooter({ text: 'Baslangica donmek icin baska kategori sec' })
          .setTimestamp();
        await i.update({ embeds: [embed], components: [row] });
      }
    });
  },
};
