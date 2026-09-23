const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'kelime-oyunu-db.json');

const kelimeler = [
  { kelime: 'istanbul', ipucu: "Turkiye'nin en buyuk sehridir" },
  { kelime: 'ankara', ipucu: 'Turkiye\'nin baskentidir' },
  { kelime: 'ataturk', ipucu: 'Turkiye Cumhuriyeti\'nin kurucusu' },
  { kelime: 'dolmus', ipucu: 'Sehirler arasi dolu bir arac' },
  { kelime: 'lahmacun', ipucu: 'Ince hamur uzerinde etli bir yemek' },
  { kelime: 'baklava', ipucu: 'Tatli, fistikli, yufkali bir lezzet' },
  { kelime: 'kebap', ipucu: 'Izgarada pisirilen et yemegi' },
  { kelime: 'cay', ipucu: 'Ince belli bardakta icilen sicak icecek' },
  { kelime: 'kahve', ipucu: 'Turk kulturunun vaz gecilmez icecegi' },
  { kelime: 'simit', ipucu: 'Susamli, halka seklinde bir ekmek cesidi' },
  { kelime: 'balik', ipucu: 'Denizde yasayan, yuzen bir canli' },
  { kelime: 'gunes', ipucu: 'Gokyuzunde parlak, sicak bir yildiz' },
  { kelime: 'yagmur', ipucu: 'Bulutlardan dusen su damlaciklari' },
  { kelime: 'deniz', ipucu: 'Buyuk, tuzlu su kütlesi' },
  { kelime: 'dag', ipucu: 'Cok yuksek, goreli bir arazi' },
  { kelime: 'orman', ipucu: 'Agac toplulugunun bulundugu yer' },
  { kelime: 'kedi', ipucu: 'Miyavlayan, ucu parcacik oyun seven hayvan' },
  { kelime: 'köpek', ipucu: 'Havlayan, sadik bir dost hayvani' },
  { kelime: 'kus', ipucu: 'Kanatlari olan, ucabilen hayvan' },
  { kelime: 'bal', ipucu: 'Arilarin yaptigi tatli, sicak surup' },
  { kelime: 'sut', ipuc: 'Inek, keci gibi hayvanlardan elde edilen icecek' },
  { kelime: 'ekmek', ipucu: 'Sofralarin vaz gecilmez besin kaynagi' },
  { kelime: 'pilav', ipucu: 'Pirinc ile yapilan bir yemek' },
  { kelime: 'corba', ipucu: 'Sulu, sicak bir yemek cesidi' },
  { kelime: 'tatli', ipucu: 'Sekerli, lezzetli son yemek' },
  { kelime: 'seker', ipucu: 'Tatlandirici, beyaz veya kahverengi' },
  { kelime: 'tuz', ipucu: 'Yemeklere lezzet katan beyaz kristal' },
  { kelime: 'zeytin', ipucu: 'Yesil veya siyah, yagli bir meyve' },
  { kelime: 'peynir', ipucu: 'Inek sutunden yapilan bir besin' },
  { kelime: 'yumurta', ipucu: 'Kuslarin kuluçka icin biraktigi yuvarlak besin' },
  { kelime: 'elma', ipucu: 'Kirmizi veya yesil, yuvarlak bir meyve' },
  { kelime: 'armut', ipucu: 'Alt section\'u genis, ust section\'u ince meyve' },
  { kelime: 'uzum', ipucu: 'Küçük, yuvarlak, tatli meyve toplulugu' },
  { kelime: 'portakal', ipucu: 'Turuncu, C vitamini dolu bir narenciye' },
  { kelime: 'kavun', ipucu: 'Buyuk, sicak, tatli bir meyve' },
  { kelime: 'karpuz', ipucu: 'Buyuk, icinde kirmizi etli, sicak bir meyve' },
  { kelime: 'cilek', ipucu: 'Kirmizi, kucuk, tatli bir meyve' },
  { kelime: 'kiraz', ipucu: 'Kirmizi, kucuk, tatli bir meyve' },
  { kelime: 'erik', ipucu: 'Mor veya yesil, ekşi-tatli bir meyve' },
  { kelime: 'visne', ipucu: 'Kirmizi, ekşili bir meyve' },
  { kelime: 'nane', ipucu: 'Yesil, kokulu bir bitki' },
  { kelime: 'domates', ipucu: 'Kirmizi, yuvarlak, sebze-meyve' },
  { kelime: 'biber', ipucu: 'Kirmizi, yesil, aci veya tatli sebze' },
  { kelime: 'sogan', ipucu: 'Dograndiginda goz yaslatan sebze' },
  { kelime: 'patates', ipucu: 'Toprak altinda buyuyen, kahverengi sebze' },
  { kelime: 'havuc', ipucu: 'Turuncu, uzun, tatli bir sebze' },
  { kelime: 'marul', ipucu: 'Yesil, yaprakli bir salata bitkisi' },
  { kelime: 'salatalik', ipucu: 'Yesil, uzun, suclu bir sebze' },
  { kelime: 'fasulye', ipucu: 'Yesil, uzun, ince bir sebze' },
  { kelime: 'mercimek', ipucu: 'Kucuk, yuvarlak, protein dolu baklagil' },
  { kelime: 'nohut', ipucu: 'Yuvarlak, kahverengi, proteinli baklagil' },
  { kelime: 'bulgur', ipucu: 'Pirincin alternatifi, saglikli tahil' },
  { kelime: 'bulut', ipucu: 'Gokyuzunde su damlaciklari toplulugu' },
  { kelime: 'yildiz', ipucu: 'Gokyuzunde isinilan küçük nesne' },
  { kelime: 'ay', ipucu: 'Gece gokyuzunde parlak, buyuk nesne' },
  { kelime: 'pirinc', ipucu: 'Beyaz, kucuk tanecikli bir tahil' },
  { kelime: 'agua', ipucu: 'Suyun diger adi' },
  { kelime: 'kalem', ipucu: 'Yazi yazmak icin kullanilan arac' },
  { kelime: 'kitap', ipucu: 'Kagittan yapilmis, bilgi dolu nesne' },
  { kelime: 'okul', ipucu: 'Ogrencilerin ders gordugu yer' },
  { kelime: 'ogretmen', ipucu: 'Okulda ders anlatan kisi' },
  { kelime: 'araba', ipucu: 'Yolda giden, 4 tekerlekli tasit' },
  { kelime: 'otobus', ipucu: 'Bircok kisiyi tasiyan buyuk tasit' },
  { kelime: 'tren', ipucu: 'Raylar uzerinde giden uzun tasit' },
  { kelime: 'ucak', ipucu: 'Gokyuzunde ucabilen tasit' },
  { kelime: 'gemi', ipucu: 'Denizde giden buyuk tasit' },
  { kelime: 'telefon', ipucu: 'Iletisim kurmak icin kullanilan cihaz' },
  { kelime: 'bilgisayar', ipucu: 'Internet, oyun, is icin kullanilan cihaz' },
  { kelime: 'televizyon', ipucu: 'Dizi, film, haber izlenen cihaz' },
  { kelime: 'radyo', ipucu: 'Muzik, haber dinlenen cihaz' },
  { kelime: 'bisiklet', ipucu: '2 tekerlekli, pedal ile calisan tasit' },
  { kelime: 'motor', ipucu: '2 tekerlekli hizli tasit' },
  { kelime: 'yol', ipucu: 'Gidilecek arazi, asfalt uzeri' },
  { kelime: 'cop', ipucu: 'Kirli seylerin atildigi kutu' },
  { kelime: 'cam', ipucu: 'Saydam, kirilgan bir malzeme' },
  { kelime: 'tahta', ipucu: 'Agactan yapilmis, sert malzeme' },
  { kelime: 'tas', ipucu: 'Sert, agir, dogal bir nesne' },
  { kelime: 'top', ipucu: 'Oyun icin kullanilan yuvarlak nesne' },
  { kelime: 'kale', ipucu: 'Buyuk, korunakli bir yapinin parcasi' },
  { kelime: 'kapı', ipucu: 'Giris-cikis icin kullanilan nesne' },
  { kelime: 'pencere', ipucu: 'Disarisi gormek icin camli nesne' },
  { kelime: 'sandalye', ipucu: 'Ustune oturulan, 4 ayakli esya' },
  { kelime: 'masa', ipucu: 'Ustune bir seyler koyulan, duz esya' },
  { kelime: 'yatak', ipucu: 'Ustunde uyku uyulan, yumusak esya' },
  { kelime: 'koltuk', ipucu: 'Yumusak, genis oturma esyasi' },
  { kelime: 'ayna', ipucu: 'Kendini gordugun, saydam cam' },
  { kelime: 'saat', ipucu: 'Zamani gosteren alet' },
  { kelime: 'takvim', ipucu: 'Gun, ay, yil gosteren kagit' },
  { kelime: 'harita', ipucu: 'Yerleri gosteren kagit' },
  { kelime: 'bayrak', ipucu: 'Ulkenin isaretini tasiyan kumas' },
  { kelime: 'para', ipucu: 'Alisveris yapilan, degerli nesne' },
  { kelime: 'celik', ipucu: 'Sert, dayanikli bir maden' },
  { kelime: 'altin', ipucu: 'Sari, degerli bir maden' },
  { kelime: 'gumus', ipucu: 'Gri, degerli bir maden' },
  { kelime: 'demir', ipucu: 'Sert, kahverengi bir maden' },
  { kelime: 'bakir', ipucu: 'Turuncu-kahverengi bir maden' },
  { kelime: 'kagit', ipucu: 'Uzerine yazilan, ince malzeme' },
  { kelime: 'kalem', ipucu: 'Uzerine yazan, ince alet' },
  { kelime: 'burun', ipucu: 'Yuzun ortasinda, koklamak icin organ' },
  { kelime: 'kulak', ipucu: 'Sesi duymak icin organ' },
  { kelime: 'goz', ipucu: 'Gormek icin organ' },
  { kelime: 'agiz', ipucu: 'Yemek yemek icin organ' },
  { kelime: 'el', ipucu: 'Tutmak icin organ' },
  { kelime: 'ayak', ipucu: 'Yurumek icin organ' },
  { kelime: 'parmak', ipucu: 'El ve ayaktaki ince uzuv' },
  { kelime: 'kalp', ipucu: 'Vucudun en onemli organi, atesli' },
  { kelime: 'beyin', ipucu: 'Dusunmek icin kafatasindaki organ' },
  { kelime: 'dil', ipucu: 'Konuşmak ve tatmak icin agiz ici organ' },
  { kelime: 'dis', ipucu: 'Isirmak icin agiz ici organ' },
  { kelime: 'yuz', ipucu: 'Kafanin on tarafi, goz-burun-agiz toplulugu' },
  { kelime: 'saç', ipucu: 'Bas ustu organ, siyah, sari veya kizil' },
  { kelime: 'elbise', ipucu: 'Kadınların giydiği tek parçalı kıyafet' },
  { kelime: 'pantolon', ipucu: 'Bacakları saran, uzun kıyafet' },
  { kelime: 'gömlek', ipucu: 'Düğmeli, üst vücut kıyafeti' },
  { kelime: 'ayakkabı', ipucu: 'Ayak giyilen, sert kıyafet' },
  { kelime: 'şapka', ipucu: 'Başa giyilen, yuvarlak aksesuar' },
  { kelime: 'eldiven', ipucu: 'Elin giyilen, parmaklı aksesuar' },
  { kelime: 'çorap', ipucu: 'Ayak giyilen, yumuşak kıyafet' },
  { kelime: 'takı', ipucu: 'Boyun, kulak gibi yerlere takılan aksesuar' },
  { kelime: 'yüzük', ipucu: 'Parmağa takılan, dairesel aksesuar' },
  { kelime: 'kolye', ipucu: 'Boyuna takılan, uzun aksesuar' },
  { kelime: 'kemer', ipucu: 'Belde bağlanan, deri aksesuar' },
  { kelime: 'palto', ipucu: 'Soğukta giyilen, uzun dış kıyafet' },
  { kelime: 'mont', ipucu: 'Soğukta giyilen, kısa dış kıyafet' },
  { kelime: 'atkı', ipucu: 'Boyna sarılan, uzun ve sıcak kıyafet' },
  { kelime: 'bere', ipucu: 'Başa giyilen, sıcak bere aksesuarı' },
  { kelime: 'bisiklet', ipucu: '2 tekerlekli, pedal ile çalışan araç' },
  { kelime: 'nar', ipucu: 'İçinde kırmızı taneler olan meyve' },
  { kelime: 'incir', ipucu: 'Mor veya yeşil, tatlı bir meyve' },
  { kelime: 'kayısı', ipucu: 'Turuncu, tatlı ve yumuşak meyve' },
  { kelime: 'şeftali', ipucu: 'Turuncu-pembe, tüylü ve tatlı meyve' },
  { kelime: 'kavun', ipucu: 'Sarı, tatlı ve sulu bir meyve' },
  { kelime: 'muz', ipucu: 'Sarı, eğri, tropikal bir meyve' },
  { kelime: 'ananas', ipucu: 'Tropikal, dikenli ve tatlı bir meyve' },
  { kelime: 'kivi', ipucu: 'Dışı kahverengi, içi yeşil meyve' },
  { kelime: 'çikolata', ipucu: 'Kakao ile yapılan tatlı bir atıştırmalık' },
  { kelime: 'dondurma', ipucu: 'Soğuk, tatlı, yazın sevilen bir tatlı' },
  { kelime: 'bisküvi', ipucu: 'Kuru ve çıtır atıştırmalık' },
  { kelime: 'kurabiye', ipucu: 'Fırında yapılan tatlı atıştırmalık' },
  { kelime: 'pasta', ipucu: 'Doğum günü için yapılan tatlı' },
  { kelime: 'kek', ipucu: 'Fırında yapılan tatlı bir hamur işi' },
  { kelime: 'waffle', ipucu: 'Demode yapılmış, tatlı veya tuzlu atıştırmalık' },
  { kelime: 'pankek', ipucu: 'Tavada yapılmış, yuvarlak tatlı' },
  { kelime: 'kebap', ipucu: 'Izgarada pişirilmiş et yemeği' },
  { kelime: 'döner', ipucu: 'Dikey dönen etten yapılan yemek' },
  { kelime: ' Köfte', ipucu: 'Yuvarlak, ızgarada pişirilmiş et yemeği' },
  { kelime: 'börek', ipucu: 'Yufka ile yapılan, içli hamur işi' },
  { kelime: 'pide', ipucu: 'Uzun, içli hamur işi' },
  { kelime: 'lahmacun', ipucu: 'İnce hamur üzerinde etli yemek' },
  { kelime: 'mantı', ipucu: 'Küçük hamur parçaları ile yapılan yemek' },
  { kelime: 'baklava', ipucu: 'Kat kat yufka ile yapılan tatlı' },
  { kelime: 'künefe', ipucu: 'Peynirli, şerbetli tatlı' },
  { kelime: 'katmer', ipucu: 'İnce yufka ile yapılan hamur işi' },
  { kelime: 'pilav', ipucu: 'Pirinç ile yapılan yemek' },
  { kelime: 'şehriye', ipucu: 'Çorbalarda kullanılan küçük hamur' },
  { kelime: 'makarna', ipucu: 'Su ile pişirilen hamur yemeği' },
  { kelime: 'salata', ipucu: 'Sebze ile yapılan soğuk yemek' },
  { kelime: 'çorba', ipucu: 'Sıcak, sıvı yemek türü' },
  { kelime: 'yoğurt', ipucu: 'Sütten yapılan, probiyotik besin' },
  { kelime: 'ayran', ipucu: 'Yoğurt ile yapılan, tuzlu icecek' },
  { kelime: 'şalgam', ipucu: 'Mor sebze ile yapılan, ekşi icecek' },
  { kelime: 'limonata', ipucu: 'Limon ile yapılan, tatlı-ekşi icecek' },
  { kelime: 'kahvaltı', ipucu: 'Sabah yapılan yemek' },
  { kelime: 'öğle', ipucu: 'Günün ortası, saat 12 civarı' },
  { kelime: 'akşam', ipucu: 'Günün sonu, güneş batarken' },
  { kelime: 'gece', ipucu: 'Karanlık, uyku zamanı' },
  { kelime: 'sabah', ipucu: 'Günün başı, güneş doğumunda' },
  { kelime: 'öğleden sonra', ipucu: 'Öğle ile akşam arası zaman' },
  { kelime: 'gece yarısı', ipucu: 'Gecenin ortası, saat 12' },
  { kelime: 'tatil', ipucu: 'Dinlenme zamanı, okul yok' },
  { kelime: 'bayram', ipucu: 'Özel gün, kutlama zamanı' },
  { kelime: 'düğün', ipucu: 'İki kişinin evlenmesi töreni' },
  { kelime: 'doğum günü', ipucu: 'Kişinin doğduğu gün, pasta kesilir' },
  { kelime: 'noel', ipucu: 'Hristiyanların bayramı, hediye zamanı' },
  { kelime: 'paskalya', ipucu: 'Hristiyanların özel bayramı' },
  { kelime: 'ramazan', ipucu: 'Müslümanların oruç ayı' },
  { kelime: 'kurban', ipucu: 'Müslümanların özel bayramı' },
  { kelime: 'nevruz', ipucu: 'Bahar bayramı, 21 Mart' },
  { kelime: '23 nisan', ipucu: 'Ulusal Egemenlik ve Çocuk Bayramı' },
  { kelime: '29 ekim', ipucu: 'Cumhuriyet Bayramı' },
  { kelime: '30 agustos', ipucu: 'Zafer Bayramı' },
  { kelime: '19 mayıs', ipucu: 'Gençlik ve Spor Bayramı' },
];

const oyunlar = new Map();

function rastgeleKelime() {
  return kelimeler[Math.floor(Math.random() * kelimeler.length)];
}

function kaydetDb(db) {
  try { fs.writeFileSync(dbPath, JSON.stringify(db, null, 2)); } catch {}
}

function yukleDb() {
  try { return JSON.parse(fs.readFileSync(dbPath, 'utf8')); } catch { return {}; }
}

async function yeniTurBaslat(kanalId, client, guildId) {
  const oyun = oyunlar.get(kanalId);
  if (!oyun || !oyun.aktif) return;

  oyun.tur++;
  const secilen = rastgeleKelime();
  oyun.aktifTur = {
    kelime: secilen.kelime.toLowerCase(),
    ipucu: secilen.ipucu,
    tahminler: [],
    tur: oyun.tur,
    baslama: Date.now(),
    cozuldu: false,
  };

  const embed = new EmbedBuilder()
    .setTitle(`:pencil2: Kelime Oyunu - Tur ${oyun.tur}`)
    .setDescription(`Yeni tur basladi! Kelimeyi tahmin et.\n\n:bulb: **Ipucu:** ${secilen.ipucu}`)
    .setColor(0x5865F2)
    .addFields(
      { name: ':abc: Harf sayisi', value: `**${secilen.kelime.length}** harf`, inline: true },
      { name: ':clock1: Sure', value: '**30 dakika**', inline: true },
    )
    .setFooter({ text: 'Kelimeyi dogrudan yazarak tahmin et!' })
    .setTimestamp();

  try {
    const kanal = client.channels.cache.get(kanalId);
    if (kanal) await kanal.send({ embeds: [embed] });
  } catch (e) {}
}

function kelimeDogrula(tahmin, cevap) {
  const t = tahmin.toLowerCase().trim();
  const c = cevap.toLowerCase().trim();
  if (t === c) return { dogru: true, skor: 100 };

  const benzerlik = karsilastir(t, c);
  if (benzerlik > 0.7) return { dogru: false, ipucu: 'Cok yakin!', skor: 0 };
  if (benzerlik > 0.4) return { dogru: false, ipucu: 'Yakin ama uzak.', skor: 0 };
  return { dogru: false, ipucu: 'Uzak.', skor: 0 };
}

function karsilastir(a, b) {
  const aHarfler = a.split('');
  const bHarfler = b.split('');
  let eslesme = 0;
  for (const h of aHarfler) {
    if (bHarfler.includes(h)) eslesme++;
  }
  return eslesme / Math.max(aHarfler.length, bHarfler.length);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kelime-oyunu')
    .setDescription('Kelime oyunu baslat/durdur/guncelle')
    .addSubcommand(sub => sub.setName('baslat').setDescription('Bu kanalda kelime oyununu baslat'))
    .addSubcommand(sub => sub.setName('durdur').setDescription('Kelime oyununu durdur'))
    .addSubcommand(sub => sub.setName('durum').setDescription('Oyun durumunu goster')),
  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    const kanalId = interaction.channel.id;

    if (sub === 'durum') {
      const oyun = oyunlar.get(kanalId);
      if (!oyun || !oyun.aktif) {
        return interaction.reply({ content: ':grey_exclamation: Bu kanalda aktif kelime oyunu yok. `/kelime-oyunu baslat` ile baslat.', ephemeral: true });
      }
      const sure = Math.floor((Date.now() - oyun.baslama) / 60000);
      const embed = new EmbedBuilder()
        .setTitle(':game_die: Kelime Oyunu Durumu')
        .setDescription(`Aktif tur: **${oyun.tur}**\nSure: **${sure}** dakika\nToplam oynanan tur: **${oyun.tur}`)
        .setColor(0x57F287);
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'durdur') {
      const oyun = oyunlar.get(kanalId);
      if (!oyun || !oyun.aktif) {
        return interaction.reply({ content: ':grey_exclamation: Bu kanalda oyun zaten yok.', ephemeral: true });
      }
      oyun.aktif = false;
      oyunlar.delete(kanalId);
      const db = yukleDb();
      if (db[interaction.guild.id]) delete db[interaction.guild.id][kanalId];
      kaydetDb(db);
      return interaction.reply({ content: ':x: Kelime oyunu durduruldu.' });
    }

    if (sub === 'baslat') {
      if (oyunlar.has(kanalId) && oyunlar.get(kanalId).aktif) {
        return interaction.reply({ content: ':warning: Bu kanalda zaten aktif kelime oyunu var!', ephemeral: true });
      }

      oyunlar.set(kanalId, {
        aktif: true,
        tur: 0,
        baslama: Date.now(),
        skorlar: {},
      });

      const db = yukleDb();
      if (!db[interaction.guild.id]) db[interaction.guild.id] = {};
      db[interaction.guild.id][kanalId] = { baslatan: interaction.user.id, zaman: Date.now() };
      kaydetDb(db);

      await interaction.reply({ content: ':white_check_mark: Kelime oyunu baslatildi! Ilerde yeni turlar otomatik baslayacak.' });

      await yeniTurBaslat(kanalId, client, interaction.guild.id);
    }
  },
};

module.exports.yeniTurBaslat = yeniTurBaslat;
module.exports.oyunlar = oyunlar;
module.exports.kelimeDogrula = kelimeDogrula;
