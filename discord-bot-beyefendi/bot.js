require('dotenv').config();
const { Client, Collection, GatewayIntentBits, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');

const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ok');
});
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`HTTP sunucu ${PORT} portunda dinliyor (Render saglik kontrolu)`));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  }
}

function yeniAcik() {
  const zamanliDbPath = path.join(__dirname, 'zamanli-duyuru-db.json');
  try {
    const data = JSON.parse(fs.readFileSync(zamanliDbPath, 'utf8'));
    return Object.values(data).flat().filter(job => !job.calisiyor);
  } catch { return []; }
}

let acik = yeniAcik();

function zamaniGeldi() {
  const zamanliDbPath = path.join(__dirname, 'zamanli-duyuru-db.json');
  const now = Date.now();
  const newJobs = [];
  if (!fs.existsSync(zamanliDbPath)) return;
  let degisti = false;
  try {
    const data = JSON.parse(fs.readFileSync(zamanliDbPath, 'utf8'));
    for (const guildId of Object.keys(data)) {
      const grup = data[guildId];
      for (let i = 0; i < grup.length; i++) {
        const job = grup[i];
        if (!job.calisiyor && job.zaman <= now) {
          job.calisiyor = true;
          const sunucu = client.guilds.cache.get(guildId);
          if (sunucu) {
            const kanal = sunucu.channels.cache.get(job.kanalId);
            if (kanal) {
              const embed = new (require('discord.js').EmbedBuilder)()
                .setTitle(job.baslik)
                .setDescription(job.metin)
                .setColor(0x7289DA)
                .setTimestamp();
              if (job.rolId && job.rolId !== sunucu.id) {
                kanal.send({ content: `<@&${job.rolId}>`, embeds: [embed] }).catch(() => kanal.send({ embeds: [embed] }));
              } else {
                kanal.send({ embeds: [embed] });
              }
            }
          }
          degisti = true;
          newJobs.push(job);
        }
      }
    }
    if (degisti) fs.writeFileSync(zamanliDbPath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Zamanli duyuru hatasi:', e.message);
  }
  acik = newJobs;
}

async function haberGonder() {
  const haberDbPath = path.join(__dirname, 'haber-kayit-db.json');
  try {
    const db = JSON.parse(fs.readFileSync(haberDbPath, 'utf8'));
    const { EmbedBuilder } = require('discord.js');
    for (const guildId of Object.keys(db)) {
      const ayar = db[guildId];
      const sunucu = client.guilds.cache.get(guildId);
      if (!sunucu) continue;
      const kanal = sunucu.channels.cache.get(ayar.kanalId);
      if (!kanal) continue;
      try {
        const { sonHaberler } = require('./commands/haber-yardimci.js');
        const haberler = await sonHaberler(5);
        const embed = new EmbedBuilder()
          .setTitle(':newspaper: Guncel Haberler')
          .setColor(0xED4245)
          .setTimestamp();
        for (const h of haberler) {
          embed.addFields({ name: h.title, value: `[Haber linki](${h.link})`, inline: false });
        }
        await kanal.send({ embeds: [embed] });
      } catch (e) {
        console.error('Haber gonderim hatasi:', e.message);
      }
    }
  } catch (e) {}
}

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Bot aktif: ${readyClient.user.tag}`);
  console.log(`Sunucular: ${readyClient.guilds.cache.size}`);
  readyClient.user.setActivity('Duyuru & Haber & Sayim | /komutlar', { type: 3 });
  setInterval(zamaniGeldi, 30000);
  setInterval(haberGonder, 6 * 60 * 60 * 1000);

  setInterval(async () => {
    try {
      const { oyunlar, yeniTurBaslat } = require('./commands/kelime-oyunu.js');
      const kelimeDbPath = path.join(__dirname, 'kelime-oyunu-db.json');
      if (!fs.existsSync(kelimeDbPath)) return;
      const db = JSON.parse(fs.readFileSync(kelimeDbPath, 'utf8'));
      for (const [guildId, kanallar] of Object.entries(db)) {
        for (const kanalId of Object.keys(kanallar)) {
          if (!oyunlar.has(kanalId) || !oyunlar.get(kanalId).aktif) {
            oyunlar.set(kanalId, { aktif: true, tur: 0, baslama: Date.now(), skorlar: {} });
            await yeniTurBaslat(kanalId, client, guildId);
          }
        }
      }
    } catch (e) {}
  }, 30 * 60 * 1000);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isButton()) {
    if (interaction.customId.startsWith('kayit_')) {
      const rolId = interaction.customId.replace('kayit_', '');
      const member = interaction.member;
      const rol = interaction.guild.roles.cache.get(rolId);
      if (!rol) {
        return interaction.reply({ content: ':x: Bu rol silinmis veya bulunamadi.', ephemeral: true });
      }
      if (member.roles.cache.has(rolId)) {
        return interaction.reply({ content: ':warning: Bu role zaten sahipsin!', ephemeral: true });
      }
      try {
        await member.roles.add(rolId);
        await interaction.reply({ content: `:white_check_mark: Kayit oldun! **${rol.name}** rolü verildi.`, ephemeral: true });
      } catch (e) {
        await interaction.reply({ content: ':x: Rol eklenemedi. (Yetki veya rol sirasi sorunu olabilir)', ephemeral: true });
      }
    }
    if (interaction.customId.startsWith('teknoloji-panel_')) {
      const urunAdi = interaction.customId.replace('teknoloji-panel_', '');
      const teknoloji = require('./commands/teknoloji.js');
      const sonuc = teknoloji.satinAl(interaction.user.id, urunAdi);

      if (!sonuc.basarili) {
        return interaction.reply({ content: `❌ ${sonuc.hata}`, flags: 64 });
      }

      const embed = new (require('discord.js').EmbedBuilder)()
        .setColor(0x00ff88)
        .setTitle(`${sonuc.urun.emoji} Satın Alma Başarılı, ${interaction.user.username}!`)
        .setDescription(
          `**${sonuc.urun.ad}** aldın!\n\n` +
          `💸 Ödenen: **${sonuc.urun.fiyat.toLocaleString('tr-TR')} TL**\n` +
          `💰 Kalan bakiye: **${sonuc.kalan.toLocaleString('tr-TR')} TL**\n` +
          `🎒 Envanterindeki adet: **${sonuc.adet}**`
        );
      return interaction.reply({ embeds: [embed], flags: 64 });
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    return interaction.reply({ content: ':grey_question: Bu komut bulunamadi.', ephemeral: true });
  }

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(`Komut hatasi [${interaction.commandName}]:`, error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: ':x: Bir hata olustu.', ephemeral: true }).catch(() => {});
    } else {
      await interaction.reply({ content: ':x: Bir hata olustu.', ephemeral: true }).catch(() => {});
    }
  }
});

client.on(Events.GuildMemberAdd, async (member) => {
  try {
    const dbPath = path.join(__dirname, 'giris-cikis-db.json');
    let db = {};
    try { db = JSON.parse(fs.readFileSync(dbPath, 'utf8')); } catch {}
    if (!db[member.guild.id]) db[member.guild.id] = { katilan: [], ayrilan: [] };
    db[member.guild.id].katilan.push({
      id: member.id,
      isim: member.user.username,
      zaman: Date.now(),
    });
    if (db[member.guild.id].katilan.length > 100) db[member.guild.id].katilan.shift();
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  } catch (e) {}

  try {
    const otoRolPath = path.join(__dirname, 'oto-rol-db.json');
    let otoDb = {};
    try { otoDb = JSON.parse(fs.readFileSync(otoRolPath, 'utf8')); } catch {}
    const ayar = otoDb[member.guild.id];
    if (!ayar) return;
    if (member.user.bot && !ayar.botlar) return;
    const rol = member.guild.roles.cache.get(ayar.rolId);
    if (rol && !member.roles.cache.has(ayar.rolId)) {
      await member.roles.add(ayar.rolId).catch(() => {});
      if (ayar.mesaj) {
        await member.send(`${ayar.mesaj}\n\n<@${member.id}>, **${member.guild.name}** sunucusuna hos geldin!`).catch(() => {});
      }
    }
  } catch (e) {}
});

client.on(Events.GuildMemberRemove, async (member) => {
  try {
    const dbPath = path.join(__dirname, 'giris-cikis-db.json');
    let db = {};
    try { db = JSON.parse(fs.readFileSync(dbPath, 'utf8')); } catch {}
    if (!db[member.guild.id]) db[member.guild.id] = { katilan: [], ayrilan: [] };
    db[member.guild.id].ayrilan.push({
      id: member.id,
      isim: member.user.username,
      zaman: Date.now(),
    });
    if (db[member.guild.id].ayrilan.length > 100) db[member.guild.id].ayrilan.shift();
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error('Cikis kaydi hatasi:', e.message);
  }
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  try {
    const { oyunlar, kelimeDogrula } = require('./commands/kelime-oyunu.js');
    const oyun = oyunlar.get(message.channel.id);
    if (oyun && oyun.aktif && oyun.aktifTur && !oyun.aktifTur.cozuldu) {
      const tahmin = message.content.toLowerCase().trim();
      if (tahmin.length < 2 || tahmin.length > 50) return;

      const sonuc = kelimeDogrula(tahmin, oyun.aktifTur.kelime);
      oyun.aktifTur.tahminler.push({ kullanici: message.author.id, tahmin, dogru: sonuc.dogru });

      if (sonuc.dogru) {
        oyun.aktifTur.cozuldu = true;
        const sures = Math.floor((Date.now() - oyun.aktifTur.baslama) / 1000);

        if (!oyun.skorlar) oyun.skorlar = {};
        if (!oyun.skorlar[message.author.id]) oyun.skorlar[message.author.id] = 0;
        oyun.skorlar[message.author.id] += 100;

        const embed = new EmbedBuilder()
          .setTitle(':tada: Dogru Tahmin!')
          .setDescription(`<@${message.author.id}> kelimeyi buldu!\n\n:envelope: **Kelime:** ||${oyun.aktifTur.kelime}||\n:clock1: **Sure:** ${sures} saniye\n:trophy: **Puan:** +100 (Toplam: ${oyun.skorlar[message.author.id]})`)
          .setColor(0x57F287)
          .setTimestamp();

        await message.channel.send({ embeds: [embed] });

        setTimeout(async () => {
          try {
            const { yeniTurBaslat } = require('./commands/kelime-oyunu.js');
            await yeniTurBaslat(message.channel.id, client, message.guild.id);
          } catch (e) {}
        }, 10000);

        return;
      }

      if (sonuc.ipucu) {
        await message.react('❌').catch(() => {});
        const ipucuEmbed = new EmbedBuilder()
          .setDescription(`${sonuc.ipucu} (${tahmin.length} harf denedin)`)
          .setColor(0xFFA500);
        await message.channel.send({ embeds: [ipucuEmbed] }).then(msg => {
          setTimeout(() => msg.delete().catch(() => {}), 5000);
        }).catch(() => {});
      }
    }
  } catch (e) {}

  try {
    const dbPath = path.join(__dirname, 'mesaj-sayim-db.json');
    let db = {};
    try { db = JSON.parse(fs.readFileSync(dbPath, 'utf8')); } catch {}
    const gid = message.guild.id;
    const kId = message.author.id;
    const cnl = message.channel.id;
    if (!db[gid]) db[gid] = { uyeler: {}, kanallar: {} };
    if (!db[gid].uyeler[kId]) db[gid].uyeler[kId] = 0;
    db[gid].uyeler[kId]++;
    if (!db[gid].kanallar[cnl]) db[gid].kanallar[cnl] = 0;
    db[gid].kanallar[cnl]++;
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  } catch (e) {}
});

client.login(process.env.BOT_TOKEN);
