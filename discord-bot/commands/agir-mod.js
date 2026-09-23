const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'agir-mod-db.json');

const VARSIYLAN_KELIMELER = [
  'amk', 'amq', 'aq', 'mk', 'sik', 'sikerim', 'siktir', 'orospu', 'piç', 'pic', 'mankafa',
  'gerizekalı', 'gerizekali', 'salak', 'aptal', 'mal', 'ibne', 'gavat', 'pezevenk',
  'kahpe', 'kahbe', 'yavşak', 'yavsak', 'g.t', 'mq', 'mala', 'zorba', 'sırf',
];

const YS18_SITELER = [
  'pornhub', 'xvideos', 'xhamster', 'xnxx', 'youporn', 'redtube', 'porn', 'sex', 'nude',
  'onlyfans', 'fap', 'hentai', 'bokep', 'porntrex', 'spankbang', 'erothots', 'nudevista',
  'pornhub', 'xvideos', 'beeg', 'eporner', 'vixen', 'blacked',
];

const YS18_KELIMELER = [
  'porno', 'sex sohbet', 'seks', 'pornografi', 'çıplak', 'nudes', 'nude', '31 çekme',
  'bdsm', 'sikis', 'sikiş', 'pornhub', 'xvideos', 'azgın', 'erotik',
];

function loadDb() {
  try { return JSON.parse(fs.readFileSync(dbPath, 'utf8')); } catch { return {}; }
}

function saveDb(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

function varsayilan() {
  return {
    acik: false,
    spamAktif: true,
    y18Aktif: true,
    kufurAktif: true,
    everyoneAktif: true,
    linkAktif: true,
    spamEsik: 5,
    spamSureSaniye: 8,
    muteDakika: 30,
    kufurEsik: 2,
    kelimeler: [...VARSIYLAN_KELIMELER],
    y18Siteler: [...YS18_SITELER],
    y18Kelimeler: [...YS18_KELIMELER],
    ihlaller: {},
    muafRol: null,
  };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('agir-mod')
    .setDescription('Ağır kurallar: küfür, spam/flood, +18, @everyone engelleme paketi')
    .addSubcommand(sub => sub.setName('kurallar').setDescription('Tüm ağır kuralları aç veya kapat')
      .addStringOption(opt => opt.setName('islem')
        .setDescription('Ne yapılsın?')
        .setRequired(true)
        .addChoices(
          { name: 'Hepsini aç (Tüm korumalar)', value: 'ac' },
          { name: 'Hepsini kapat', value: 'kapat' },
        ))
      .addRoleOption(opt => opt.setName('muaf-rol').setDescription('Kurallardan muaf tutulacak rol'))
      .addIntegerOption(opt => opt.setName('mute').setDescription('Susturma süresi (dakika, default 30)')))
    .addSubcommand(sub => sub.setName('spam').setDescription('Spam/flood engelleme')
      .addBooleanOption(opt => opt.setName('durum').setDescription('Aç/kapat'))
      .addIntegerOption(opt => opt.setName('esik').setDescription('Kaç mesaj spam sayılsın (1-15)'))
      .addIntegerOption(opt => opt.setName('sure').setDescription('Kaç saniyede (2-30)')))
    .addSubcommand(sub => sub.setName('y18').setDescription('+18 içerik engelleme')
      .addBooleanOption(opt => opt.setName('durum').setDescription('Aç/kapat')))
    .addSubcommand(sub => sub.setName('kufur').setDescription('Küfür engelleme')
      .addBooleanOption(opt => opt.setName('durum').setDescription('Aç/kapat'))
      .addIntegerOption(opt => opt.setName('esik').setDescription('Kaç ihlalde mute (1-10)')))
    .addSubcommand(sub => sub.setName('everyone').setDescription('@everyone / @here engelleme')
      .addBooleanOption(opt => opt.setName('durum').setDescription('Aç/kapat')))
    .addSubcommand(sub => sub.setName('ekle').setDescription('Yasaklı kelime ekle')
      .addStringOption(opt => opt.setName('kelime').setDescription('Küfür veya +18 kelime').setRequired(true)))
    .addSubcommand(sub => sub.setName('sil').setDescription('Yasaklı kelime sil')
      .addStringOption(opt => opt.setName('kelime').setDescription('Silinecek kelime').setRequired(true)))
    .addSubcommand(sub => sub.setName('list').setDescription('Yasaklı kelimeleri listele'))
    .addSubcommand(sub => sub.setName('durum').setDescription('Tüm ağır kuralların durumu'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Bu komutu sadece **Yonetici** kullanabilir.', ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const db = loadDb();
    let ayar = db[guildId] ? { ...varsayilan(), ...db[guildId] } : varsayilan();

    const yardimciDurum = (ayar) => {
      const mark = b => b ? ':green_circle:' : ':red_circle:';
      const embed = new EmbedBuilder()
        .setTitle(':shield: Ağır Kurallar Durumu')
        .setDescription(ayar.acik ? '<a:loading:> Tüm kurallar **ACIK**' : ':red_circle: Tüm kurallar **KAPALI**')
        .addFields(
          { name: `${mark(ayar.kufurAktif)} Küfür`, value: ayar.kufurAktif ? `eşik: ${ayar.kufurEsik} ihlal` : 'Kapalı', inline: true },
          { name: `${mark(ayar.spamAktif)} Spam/Flood`, value: ayar.spamAktif ? `${ayar.spamEsik} mesaj / ${ayar.spamSureSaniye}sn` : 'Kapalı', inline: true },
          { name: `${mark(ayar.y18Aktif)} +18`, value: ayar.y18Aktif ? 'Açık' : 'Kapalı', inline: true },
          { name: `${mark(ayar.everyoneAktif)} @everyone`, value: ayar.everyoneAktif ? 'Açık' : 'Kapalı', inline: true },
          { name: `${mark(ayar.linkAktif)} Link`, value: ayar.linkAktif ? 'Açık' : 'Kapalı', inline: true },
          { name: ':mute: Mute süresi', value: `${ayar.muteDakika} dk`, inline: true },
        )
        .setColor(ayar.acik ? 0xED4245 : 0x5865F2)
        .setTimestamp();
      return embed;
    };

    if (sub === 'kurallar') {
      const islem = interaction.options.getString('islem');
      const muaf = interaction.options.getRole('muaf-rol');
      const mute = interaction.options.getInteger('mute');

      ayar = varsayilan();
      ayar.acik = islem === 'ac';
      if (mute) ayar.muteDakika = mute;
      if (muaf) ayar.muafRol = muaf.id;

      db[guildId] = ayar;
      saveDb(db);

      if (islem === 'ac') {
        const embed = new EmbedBuilder()
          .setTitle(':shield: AĞIR KURALLAR AÇILDI!')
          .setDescription(
            'Tüm korumalar aktif!\n\n' +
            ':speech_balloon: **Küfür filtresi** — küfürlü mesaj silinir, eşikte susturma\n' +
            ':arrows_counterclockwise: **Spam/Flood** — hızlı tekrar mesajlar engellenir\n' +
            ':underage: **+18 engelleme** — +18 site/kelime engellenir\n' +
            ':loudspeaker: **@everyone/@here** — etiketlerde bulunuyorsa mesaj silinir\n' +
            ':link: **Link engelleme** — spam linkler engellenir'
          )
          .addFields(
            { name: ':mute: Mute süresi', value: `**${ayar.muteDakika}** dk`, inline: true },
            { name: ':timer: Spam', value: `**${ayar.spamEsik}** mesaj/${ayar.spamSureSaniye}sn`, inline: true },
            { name: ':shield: Muaf rol', value: muaf ? `<@&${muaf.id}>` : 'Yok', inline: true },
          )
          .setColor(0xED4245)
          .setTimestamp();
        return interaction.reply({ embeds: [embed] });
      } else {
        return interaction.reply({ content: ':x: Tüm ağır kurallar kapatildi.' });
      }
    }

    if (sub === 'spam') {
      const durum = interaction.options.getBoolean('durum');
      const esik = interaction.options.getInteger('esik');
      const sure = interaction.options.getInteger('sure');
      if (durum !== null) ayar.spamAktif = durum;
      if (esik) ayar.spamEsik = esik;
      if (sure) ayar.spamSureSaniye = sure;
      db[guildId] = ayar;
      saveDb(db);
      return interaction.reply({ embeds: [yardimciDurum(ayar)], ephemeral: true });
    }

    if (sub === 'y18') {
      const durum = interaction.options.getBoolean('durum');
      if (durum !== null) ayar.y18Aktif = durum;
      db[guildId] = ayar;
      saveDb(db);
      return interaction.reply({ embeds: [yardimciDurum(ayar)], ephemeral: true });
    }

    if (sub === 'kufur') {
      const durum = interaction.options.getBoolean('durum');
      const esik = interaction.options.getInteger('esik');
      if (durum !== null) ayar.kufurAktif = durum;
      if (esik) ayar.kufurEsik = esik;
      db[guildId] = ayar;
      saveDb(db);
      return interaction.reply({ embeds: [yardimciDurum(ayar)], ephemeral: true });
    }

    if (sub === 'everyone') {
      const durum = interaction.options.getBoolean('durum');
      if (durum !== null) ayar.everyoneAktif = durum;
      db[guildId] = ayar;
      saveDb(db);
      return interaction.reply({ embeds: [yardimciDurum(ayar)], ephemeral: true });
    }

    if (sub === 'ekle') {
      const kelime = interaction.options.getString('kelime').toLowerCase().trim();
      let eklenen = null;
      if (!ayar.kelimeler.includes(kelime)) { ayar.kelimeler.push(kelime); eklenen = 'küfür listesi'; }
      if (!ayar.y18Kelimeler.includes(kelime)) { ayar.y18Kelimeler.push(kelime); eklenen = eklenen === null ? '+18 listesi' : eklenen + ' ve +18 listesi'; }
      db[guildId] = ayar;
      saveDb(db);
      return interaction.reply({ content: `:white_check_mark: **${kelime}** eklendi (${eklenen || 'zaten vardı'}).`, ephemeral: true });
    }

    if (sub === 'sil') {
      const kelime = interaction.options.getString('kelime').toLowerCase().trim();
      ayar.kelimeler = ayar.kelimeler.filter(k => k !== kelime);
      ayar.y18Kelimeler = ayar.y18Kelimeler.filter(k => k !== kelime);
      db[guildId] = ayar;
      saveDb(db);
      return interaction.reply({ content: `:white_check_mark: **${kelime}** yasaklılardan silindi.`, ephemeral: true });
    }

    if (sub === 'list') {
      const list = ayar.kelimeler.concat(ayar.y18Kelimeler).filter((v, i, a) => a.indexOf(v) === i).map(k => `\`${k}\``).slice(0, 40).join(', ') || 'Liste boş';
      const embed = new EmbedBuilder()
        .setTitle(':scroll: Yasaklı Kelimeler')
        .setDescription(list)
        .setColor(0x5865F2)
        .setFooter({ text: `Toplam ${ayar.kelimeler.length + ayar.y18Kelimeler.length}` });
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'durum') {
      if (!ayar.acik) {
        const embed = new EmbedBuilder()
          .setTitle(':shield: Ağır Kurallar')
          .setDescription(':red_circle: **KAPALI**\n\n`/agir-mod kurallar islem:ac` ile tüm korumaları tek seferde açabilirsin.')
          .setColor(0x5865F2);
        return interaction.reply({ embeds: [embed] });
      }
      return interaction.reply({ embeds: [yardimciDurum(ayar)] });
    }
  },
};

module.exports.VARSIYLAN_KELIMELER = VARSIYLAN_KELIMELER;
module.exports.YS18_SITELER = YS18_SITELER;
module.exports.YS18_KELIMELER = YS18_KELIMELER;
