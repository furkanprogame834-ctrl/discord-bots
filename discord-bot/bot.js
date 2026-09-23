require('dotenv').config();
const { Client, Collection, GatewayIntentBits, Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
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

const xpHandler = require('./xp-handler');

const welcomeDbPath = path.join(__dirname, 'welcome-db.json');
const guildConfigPath = path.join(__dirname, 'guild-config.json');
const otoCevapPath = path.join(__dirname, 'oto-cevap.json');
const inviteDbPath = path.join(__dirname, 'invite-db.json');

function loadJson(filePath) {
  try {
    if (fs.existsSync(filePath)) return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {}
  return {};
}

function saveJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function embedBaslik(embedData) {
  return (embedData && embedData.title) || '';
}

function embedAciklama(embedData) {
  return (embedData && embedData.description) || '';
}

function embedDescriptionEkle(embedData, builder) {
  const mevcut = embedAciklama(embedData);
  const durumSatiri = builder.data.description || '';
  builder.setDescription(durumSatiri ? `${durumSatiri}\n${mevcut}` : mevcut);
}

// Gelen/giden uye log kanali: tamamen kapatildi (KAPATILDI)
function uyeLogKanal(guild) {
  try {
    const cfg = loadJson(guildConfigPath);
    const kanalId = cfg[guild.id]?.logKanal;
    if (!kanalId) return null;
    const kanal = guild.channels.cache.get(kanalId);
    return kanal && kanal.isTextBased() ? kanal : null;
  } catch {
    return null;
  }
}

async function awaitDM(kullanici, icerik) {
  try {
    await kullanici.send(icerik);
  } catch (e) {
    console.error('DM gonderme hatasi:', e.message);
  }
}

function formBasvuruIdFrom(interaction) {
  const parca = interaction.customId.split('_')[1];
  if (parca && /^\d{17,20}$/.test(parca)) return parca;
  const uyeField = interaction.message?.embeds?.[0]?.fields?.find(f => f.name === '👤 Üye' || f.name.includes('Üye'));
  const match = uyeField?.value?.match(/\d{17,20}/);
  return match ? match[0] : null;
}

// Uye sayisi ses kanali guncelleme
async function uyeSayisiGuncelle(guild) {
  try {
    const kanal = guild.channels.cache.find(ch =>
      ch.type === 2 && (ch.name.includes('uye') || ch.name.includes('Uye') || ch.name.includes('member') || ch.name.includes('sayi'))
    );
    if (kanal) {
      await kanal.setName(`👤 Üye Sayısı: ${guild.memberCount}`);
    }
  } catch (e) {}
}

const spamTrace = new Map();

async function ihlalIsle(ayar, db, message, sebep, kategori = 'kufur') {
  try {
    const { EmbedBuilder } = require('discord.js');
    const member = message.member;
    if (!member) return;
    if (member.permissions.has('Administrator') || member.permissions.has('ManageMessages')) return;
    if (ayar.muafRol && member.roles.cache.has(ayar.muafRol)) return;

    message.delete().catch(() => {});

    if (!ayar.ihlaller) ayar.ihlaller = {};
    if (!ayar.ihlaller[message.author.id]) ayar.ihlaller[message.author.id] = 0;
    ayar.ihlaller[message.author.id] += 1;
    const sayi = ayar.ihlaller[message.author.id];

    const emoji = kategori === 'spam' ? ':arrows_counterclockwise:' :
                  kategori === 'y18' ? ':underage:' :
                  kategori === 'everyone' ? ':loudspeaker:' :
                  kategori === 'link' ? ':link:' : ':shield:';

    const baslik = kategori === 'spam' ? 'Spam/Flood Engellendi' :
                   kategori === 'y18' ? '+18 Icerik Engellendi' :
                   kategori === 'everyone' ? '@everyone/@here Engellendi' :
                   kategori === 'link' ? 'Link Engellendi' : 'Kufurlu Mesaj Tespit Edildi';

    const esik = ayar.kufurEsik || ayar.suturmaEsik || 2;

    const embed = new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle(`:shield: ${baslik}`)
      .setDescription(`<@${message.author.id}>, mesajin kaldirildi. (Sebep: \`${sebep}\`)\n\nBu senin **${sayi}. ihlalin**.`);
    if (sayi >= esik) {
      embed.addFields({ name: ':mute: Otomatik Susturma', value: `**${ayar.muteDakika}** dakika kisitlandin.` });
    } else {
      embed.addFields({ name: ':warning: Uyari', value: `${esik - sayi} ihlal daha yaparsan mutedilerek kisitlanacaksin.` });
    }

    db[message.guild.id] = ayar;
    try { fs.writeFileSync(path.join(__dirname, 'agir-mod-db.json'), JSON.stringify(db, null, 2)); } catch {}

    if (message.channel.permissionsFor(message.guild.members.me).has('SendMessages')) {
      const uyari = await message.channel.send({ embeds: [embed] }).catch(() => {});
      if (uyari) setTimeout(() => uyari.delete().catch(() => {}), 8000);
    }

    if (sayi >= esik) {
      const sureMs = ayar.muteDakika * 60 * 1000;
      try {
        await member.timeout(sureMs, `Agir kurallar: ${sebep} (${sayi}. ihlal)`);
      } catch {}
    }
  } catch (e) {}
}

function agirKorumaKontrol(message, ayar, db) {
  const replyThenResolve = (sebep, kategori) => {
    spamTrace.delete(message.author.id);
    ihlalIsle(ayar, db, message, sebep, kategori).catch(() => {});
    return true;
  };

  const member = message.member;
  if (!member) return false;
  if (member.permissions.has('Administrator') || member.permissions.has('ManageMessages')) return false;
  if (ayar.muafRol && member.roles.cache.has(ayar.muafRol)) return false;

  const icerik = message.content.toLowerCase();

  // @everyone / @here engelleme
  if (ayar.everyoneAktif && (icerik.includes('@everyone') || icerik.includes('@here'))) {
    return replyThenResolve('@everyone/@here etiketi', 'everyone');
  }

  // Kufur engelleme
  if (ayar.kufurAktif && (ayar.kelimeler || []).some(k => icerik.includes(k))) {
    return replyThenResolve(ayar.kelimeler.find(k => icerik.includes(k)), 'kufur');
  }

  // +18 engelleme
  if (ayar.y18Aktif) {
    const y18Siteler = ayar.y18Siteler || [];
    const y18Kelimeler = ayar.y18Kelimeler || [];
    if (y18Siteler.some(s => icerik.includes(s)) || y18Kelimeler.some(k => icerik.includes(k))) {
      const site = y18Siteler.find(s => icerik.includes(s));
      const kel = y18Kelimeler.find(k => icerik.includes(k));
      return replyThenResolve(site || kel, 'y18');
    }
  }

  // Spam / flood engelleme
  if (ayar.spamAktif) {
    const now = Date.now();
    if (!spamTrace.has(message.author.id)) spamTrace.set(message.author.id, [now]);
    else {
      const arr = spamTrace.get(message.author.id);
      arr.push(now);
      const esikZaman = now - ayar.spamSureSaniye * 1000;
      const son = arr.filter(t => t >= esikZaman);
      spamTrace.set(message.author.id, son);
      if (son.length >= (ayar.spamEsik || 5)) {
        return replyThenResolve(`Spam (${son.length} mesaj/${ayar.spamSureSaniye}sn)`, 'spam');
      }
    }
  }

  return false;
}

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Bot aktif: ${readyClient.user.tag}`);
  readyClient.user.setActivity('/komutlar | Beni izle!', { type: 3 });

  for (const guild of readyClient.guilds.cache.values()) {
    try {
      const invites = await guild.invites.fetch();
      const inviteDb = loadJson(inviteDbPath);
      inviteDb[guild.id] = {};
      invites.forEach(inv => {
        if (inv.inviter) {
          inviteDb[guild.id][inv.code] = { uses: inv.uses, inviterId: inv.inviter.id };
        }
      });
      saveJson(inviteDbPath, inviteDb);
    } catch (e) {}

    // Baslangicta uye sayisini guncelle
    uyeSayisiGuncelle(guild);
  }
});

client.on(Events.GuildMemberAdd, async (member) => {
  if (member.user.bot) return;

  const config = loadJson(guildConfigPath);
  const guildConfig = config[member.guild.id];

  if (guildConfig?.autoRole) {
    try {
      const role = member.guild.roles.cache.get(guildConfig.autoRole);
      if (role) await member.roles.add(role);
    } catch (e) {}
  }

  // Oto-tag: katilanin adina tag ekle
  if (guildConfig?.otoTag) {
    try {
      const { tag, konum, sablon } = guildConfig.otoTag;
      if (tag && member.manageable) {
        const yeniIsim = sablon.replace('{isim}', member.displayName || member.user.username);
        if (yeniIsim !== member.displayName && yeniIsim.length <= 32) {
          await member.setNickname(yeniIsim);
        }
      }
    } catch (e) {}
  }

  // Ozell hosgeldin mesaji (DM)
  if (guildConfig?.hosgeldinOzel) {
    try {
      const doldur = guildConfig.hosgeldinOzel
        .replace('{isim}', member.user.username)
        .replace('{sunucu}', member.guild.name);
      await member.send({ content: doldur });
    } catch (e) {}
  }

  // Log kanali
  const logKanal = uyeLogKanal(member.guild);
  if (logKanal) {
    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle(':arrow_right: Yeni Uye')
      .setDescription(`${member} sunucuya katildi! (Uye sayisi: ${member.guild.memberCount})`)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setTimestamp();
    logKanal.send({ embeds: [embed] });
  }

  // Hosgeldin kanali (herkesin gordugu)
  const hosgeldinKanal = member.guild.channels.cache.find(ch => ch.name === 'hosgeldiniz' || ch.name === 'hosgeldin' || ch.name === 'genel' || ch.name === 'sohbet' || ch.name === 'welcome');
  if (hosgeldinKanal) {
    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle(':tada: HOS GELDIN!')
      .setDescription(`**${member.user.username}** sunucumuza katildi!\n\nSeni burada gordugumuze cok sevindik :heart:\nSunucuda **${member.guild.memberCount}** kisiyiz!\n\nKurallari okumayi unutma ve iyi eglenceler!`)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: `${member.guild.name} - Hos Geldin!` })
      .setTimestamp();
    hosgeldinKanal.send({ content: `${member}`, embeds: [embed] });
  }

  // Davet takibi
  const inviteDb = loadJson(inviteDbPath);
  const guildInvites = inviteDb[member.guild.id] || {};

  // ================= KAYIT SİSTEMİ =================
  try {
    const kayitDbPath = path.join(__dirname, 'kayit-sistemi-db.json');
    const kayitDb = loadJson(kayitDbPath);
    const kayitAyar = kayitDb[member.guild.id];
    if (kayitAyar?.kanal && kayitAyar?.yetkiliRol) {
      const kanal = member.guild.channels.cache.get(kayitAyar.kanal);
      if (kanal) {
        const embed = new EmbedBuilder()
          .setColor(0x57F287)
          .setTitle(':arrow_right: Yeni Üye Kayıt Bekliyor!')
          .setDescription(
            `**${member.user.username}** sunucuya katıldı!\n\n` +
            `Kayıt etmek için paneli kullanın.`
          )
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .setFooter({ text: `${member.guild.name}` })
          .setTimestamp();
        kanal.send({ content: `<@&${kayitAyar.yetkiliRol}>`, embeds: [embed] });
      }
    }
  } catch (e) {}

  try {
    const newInvites = await member.guild.invites.fetch();
    for (const [code, invite] of newInvites) {
      const oldData = guildInvites[code];
      if (oldData && invite.uses > oldData.uses) {
        const davetLog = member.guild.channels.cache.find(ch => ch.name === 'log' || ch.name === 'bot-log' || ch.name === 'hosgeldiniz' || ch.name === 'hosgeldin' || ch.name === 'genel');
        if (davetLog) {
          davetLog.send(`:link: ${member} **${invite.inviter?.username}** tarafindan davet edildi! (Kod: ${code})`);
        }
        guildInvites[code].uses = invite.uses;
        break;
      }
    }
    saveJson(inviteDbPath, { ...inviteDb, [member.guild.id]: guildInvites });
  } catch (e) {}

  uyeSayisiGuncelle(member.guild);
});

client.on(Events.GuildMemberRemove, (member) => {
  if (member.user.bot) return;

  // Log kanali
  const logKanal = uyeLogKanal(member.guild);
  if (logKanal) {
    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle(':arrow_left: Uye Ayrildi')
      .setDescription(`${member.user.username} sunucudan ayristi! (Uye sayisi: ${member.guild.memberCount})`)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setTimestamp();
    logKanal.send({ embeds: [embed] });
  }

  // Gorusuruz kanali (herkesin gordugu)
  const gorusuruzKanal = member.guild.channels.cache.find(ch => ch.name === 'gorusuruz' || ch.name === 'hosgeldiniz' || ch.name === 'hosgeldin' || ch.name === 'genel' || ch.name === 'sohbet' || ch.name === 'welcome');
  if (gorusuruzKanal) {
    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle(':outbox_tray: Gule Gule!')
      .setDescription(`**${member.user.username}** sunucumuzdan ayristi.\n\nTekrar bekleriz! Kalbinizde yerimiz kalsin :broken_heart:\nSunucuda **${member.guild.memberCount}** kisi kaldik.`)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: `${member.guild.name} - Gorusuruz!` })
      .setTimestamp();
    gorusuruzKanal.send({ embeds: [embed] });
  }

  uyeSayisiGuncelle(member.guild);
});

client.on(Events.MessageDelete, (message) => {
  if (message.author?.bot) return;

  const logKanal = message.guild?.channels.cache.find(ch => ch.name === 'log' || ch.name === 'bot-log');
  if (logKanal) {
    const embed = new EmbedBuilder()
      .setColor(0xFFFF00)
      .setTitle(':wastebasket: Mesaj Silindi')
      .setDescription(`**Kanal:** ${message.channel}\n**Kullanici:** ${message.author}\n**Mesaj:** ${message.content || 'Icerik yok'}`)
      .setTimestamp();
    logKanal.send({ embeds: [embed] });
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'form-basvuru-gonder') {
      const formAyar = loadJson(path.join(__dirname, 'form-ayar.json'))[interaction.guild.id];
      if (!formAyar) {
        return interaction.reply({ content: '⚠️ Form sistemi kurulmamış.', flags: 64 });
      }

      const ad = interaction.fields.getTextInputValue('form_ad');
      const yas = interaction.fields.getTextInputValue('form_yas');
      const neden = interaction.fields.getTextInputValue('form_neden');
      const ek = interaction.fields.getTextInputValue('form_ek') || '—';

      const id = interaction.user.id;
      const formDb = loadJson(path.join(__dirname, 'form-cevaplar.json'));
      if (formDb[`${interaction.guild.id}_${id}`]) {
        return interaction.reply({ content: '⚠️ Daha önce başvuru yapmışsın! Yeniden başvurmak için önceki başvurun işleme alınıp sonuçlanmalı.', flags: 64 });
      }

      formDb[`${interaction.guild.id}_${id}`] = {
        kullaniciId: id,
        ad,
        yas,
        neden,
        ek,
        zaman: Date.now(),
        durum: null,
      };
      fs.writeFileSync(path.join(__dirname, 'form-cevaplar.json'), JSON.stringify(formDb, null, 2));

      const butonlar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`form-onay_${id}`)
          .setLabel('✅ Onayla')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`form-red_${id}`)
          .setLabel('❌ Reddet')
          .setStyle(ButtonStyle.Danger),
      );

      const basvuruEmbed = new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle('📝 Yeni Başvuru')
        .addFields(
          { name: '👤 Üye', value: `<@${id}> (${ad})`, inline: true },
          { name: '🎂 Yaş', value: yas, inline: true },
          { name: '📅 Zaman', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
          { name: '💬 Neden', value: neden },
          { name: '📎 Ek', value: ek.slice(0, 100) },
        );

      const hedefKanal = interaction.guild.channels.cache.get(formAyar.panelKanal) ||
        interaction.guild.channels.cache.find(ch => ch.name.includes('form') || ch.name.includes('log'));
      if (hedefKanal) {
        await hedefKanal.send({ embeds: [basvuruEmbed], components: [butonlar] }).catch(() => {});
      }

      return interaction.reply({
        content: `✅ **Başvurun alındı!** Yetkililer inceleyip sonucu sana bildirecek.`,
        flags: 64,
      });
    }
    return;
  }

  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'kayit-uye-sec') {
      const kayitDb = loadJson(path.join(__dirname, 'kayit-sistemi-db.json'));
      const ayar = kayitDb[interaction.guild.id];
      if (!ayar?.yetkiliRol || !ayar?.uyeRol) {
        return interaction.reply({ content: '⚠️ Kayıt sistemi ayarlanmamış. `/kayit-ayarla` kullan.', flags: 64 });
      }
      const yetkiliMi = interaction.member.permissions.has('Administrator') ||
        (ayar.yetkiliRol && interaction.member.roles.cache.has(ayar.yetkiliRol));
      if (!yetkiliMi) {
        return interaction.reply({ content: '❌ Bu işlem için kayıt yetkilisi olman gerekli!', flags: 64 });
      }
      if (!global.kayitSecimler) global.kayitSecimler = {};
      global.kayitSecimler[interaction.user.id] = interaction.values[0];
      const secilen = interaction.guild.members.cache.get(interaction.values[0]);
      return interaction.reply({
        content: `🎯 Seçildi: ${secilen ? secilen : interaction.values[0]}\nŞimdi aşağıdaki **Kayıt Et** butonuna bas.`,
        flags: 64,
      });
    }
    return;
  }

  if (interaction.isChatInputCommand()) {
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
      console.error(`${interaction.commandName} komutu bulunamadi.`);
      return;
    }
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'Komut calistirilirken hata olustu!', flags: 64 });
      } else {
        await interaction.reply({ content: 'Komut calistirilirken hata olustu!', flags: 64 });
      }
    }
    return;
  }

  if (interaction.isButton()) {
    try {
      console.log(`[BUTTON] ${interaction.customId} | ${interaction.user.username} | ${interaction.guild?.name || '?'}`);
      // ================= KAYIT SİSTEMİ BUTONLARI =================
      if (interaction.customId === 'form-basvuru-ac') {
        const { ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
        const formAyar = loadJson(path.join(__dirname, 'form-ayar.json'))[interaction.guild.id];
        if (!formAyar) {
          return interaction.reply({ content: '⚠️ Bu sunucuda form paneli kurulmamış. Admin `/form-panel` kullanmalı.', flags: 64 });
        }

        const modal = new ModalBuilder()
          .setCustomId('form-basvuru-gonder')
          .setTitle(formAyar.baslik || 'Başvuru Formu');

        const adInput = new TextInputBuilder()
          .setCustomId('form_ad')
          .setLabel('Discord adın')
          .setStyle(TextInputStyle.Short)
          .setValue(interaction.user.username)
          .setRequired(true);

        const yasInput = new TextInputBuilder()
          .setCustomId('form_yas')
          .setLabel('Yaşın')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('18')
          .setRequired(true);

        const nedenInput = new TextInputBuilder()
          .setCustomId('form_neden')
          .setLabel('Neden katılmak istiyorsun?')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Kendini kısaca anlat...')
          .setRequired(true);

        const ekInput = new TextInputBuilder()
          .setCustomId('form_ek')
          .setLabel(formAyar.soru || 'Ek bilgi / iletişim')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(formAyar.soru ? true : false);

        modal.addComponents(
          new ActionRowBuilder().addComponents(adInput),
          new ActionRowBuilder().addComponents(yasInput),
          new ActionRowBuilder().addComponents(nedenInput),
          new ActionRowBuilder().addComponents(ekInput),
        );

        return interaction.showModal(modal).catch(() => {});
      }

      if (interaction.customId.startsWith('form-onay')) {
        const { PermissionFlagsBits: PF } = require('discord.js');
        const formAyar = loadJson(path.join(__dirname, 'form-ayar.json'))[interaction.guild.id];
        const yetki = interaction.member.permissions.has(PF.Administrator) || interaction.member.permissions.has(PF.ManageRoles);
        if (!yetki) {
          return interaction.reply({ content: '❌ Bu işlem için yetkin yok!', flags: 64 });
        }
        const formDb = loadJson(path.join(__dirname, 'form-cevaplar.json'));
        const hedefId = formBasvuruIdFrom(interaction);
        const kayit = formDb[`${interaction.guild.id}_${hedefId}`];
        if (!kayit) {
          return interaction.reply({ content: '⚠️ Bu başvuru bulunamadı — kayıt verisi eksik.', flags: 64 });
        }
        if (kayit.durum) {
          return interaction.reply({ content: `ℹ️ Bu başvuru zaten **${kayit.durum}** edilmiş.`, flags: 64 });
        }
        const hedef = await interaction.guild.members.fetch(kayit.kullaniciId).catch(() => null);
        const rol = interaction.guild.roles.cache.get(formAyar?.rol);
        if (hedef && rol) {
          await hedef.roles.add(rol).catch(() => {});
        }
        kayit.durum = 'onay';
        kayit.onaylayan = interaction.user.id;
        kayit.islemZaman = Date.now();
        formDb[`${interaction.guild.id}_${kayit.kullaniciId}`] = kayit;
        fs.writeFileSync(path.join(__dirname, 'form-cevaplar.json'), JSON.stringify(formDb, null, 2));

        const embed = EmbedBuilder.from(interaction.message.embeds[0])
          .setColor(0x00FF00)
          .setTitle('✅ ' + embedBaslik(interaction.message.embeds[0]))
          .addFields({ name: '📌 Sonuç', value: '✅ **Onaylandı** — üye rolü verildi.' });
        await interaction.update({ embeds: [embed], components: [] });

        if (hedef) {
          await hedef.send('🎉 **Başvurun onaylandı!** Sunucumuza hoş geldin.').catch(() => {});
        }
        return interaction.followUp({ content: `✅ Başvuru onaylandı${rol ? `, <@${kayit.kullaniciId}> kişisine <@&${rol.id}> rolü verildi` : ''}.`, flags: 64 });
      }

      if (interaction.customId.startsWith('form-red')) {
        const { PermissionFlagsBits: PF } = require('discord.js');
        const yetki = interaction.member.permissions.has(PF.Administrator) || interaction.member.permissions.has(PF.ManageRoles);
        if (!yetki) {
          return interaction.reply({ content: '❌ Bu işlem için yetkin yok!', flags: 64 });
        }
        const formDb = loadJson(path.join(__dirname, 'form-cevaplar.json'));
        const hedefId = formBasvuruIdFrom(interaction);
        const kayit = formDb[`${interaction.guild.id}_${hedefId}`];
        if (!kayit) {
          return interaction.reply({ content: '⚠️ Bu başvuru bulunamadı — kayıt verisi eksik.', flags: 64 });
        }
        if (kayit.durum) {
          return interaction.reply({ content: `ℹ️ Bu başvuru zaten **${kayit.durum}** edilmiş.`, flags: 64 });
        }
        kayit.durum = 'red';
        kayit.onaylayan = interaction.user.id;
        kayit.islemZaman = Date.now();
        formDb[`${interaction.guild.id}_${kayit.kullaniciId}`] = kayit;
        fs.writeFileSync(path.join(__dirname, 'form-cevaplar.json'), JSON.stringify(formDb, null, 2));

        const embed = EmbedBuilder.from(interaction.message.embeds[0])
          .setColor(0xFF0000)
          .setTitle('❌ ' + embedBaslik(interaction.message.embeds[0]))
          .addFields({ name: '📌 Sonuç', value: '❌ **Reddedildi**' });
        await interaction.update({ embeds: [embed], components: [] });

        const hedef = await interaction.guild.members.fetch(kayit.kullaniciId).catch(() => null);
        if (hedef) {
          await hedef.send('❌ Maalesef **başvurun reddedildi.** Başka bir sorunuz varsa bize ulaşabilirsin.').catch(() => {});
        }
        return interaction.followUp({ content: '❌ Başvuru reddedildi.', flags: 64 });
      }

      if (interaction.customId === 'kayit-onayla') {
        const { PermissionFlagsBits: PF } = require('discord.js');
        const kayitDb = loadJson(path.join(__dirname, 'kayit-sistemi-db.json'));
        const ayar = kayitDb[interaction.guild.id];
        if (!ayar?.yetkiliRol || !ayar?.uyeRol) {
          return interaction.reply({ content: '⚠️ Kayıt sistemi ayarlanmamış. `/kayit-ayarla` kullan.', flags: 64 });
        }
        const yetkiliMi = interaction.member.permissions.has(PF.Administrator) ||
          (ayar.yetkiliRol && interaction.member.roles.cache.has(ayar.yetkiliRol));
        if (!yetkiliMi) {
          return interaction.reply({ content: '❌ Bu işlem için kayıt yetkilisi olman gerekli!', flags: 64 });
        }
        // select menüden seçilen üye
        const aktifSecim = global.kayitSecimler;
        if (!aktifSecim?.[interaction.user.id]) {
          return interaction.reply({ content: 'Önce yukarıdan kayıt edilecek üyeyi seçmelisin!', flags: 64 });
        }
        const secilen = aktifSecim[interaction.user.id];
        const uye = interaction.guild.members.cache.get(secilen);
        if (!uye) {
          delete aktifSecim[interaction.user.id];
          return interaction.reply({ content: '❌ Oyuncu seçilemedi (sunucuda değil).', flags: 64 });
        }
        const rol = interaction.guild.roles.cache.get(ayar.uyeRol);
        if (!rol) return interaction.reply({ content: '❌ Kayıt rolü bulunamadı.', flags: 64 });

        if (uye.roles.cache.has(ayar.uyeRol)) {
          delete aktifSecim[interaction.user.id];
          return interaction.reply({ content: `ℹ️ ${uye} zaten kayıtlı.`, flags: 64 });
        }

        await uye.roles.add(rol).catch(() => {});
        delete aktifSecim[interaction.user.id];

        const embed = new EmbedBuilder()
          .setColor(0x00ff88)
          .setTitle('✅ Kayıt Başarılı!')
          .setDescription(`${uye} başarıyla kayıt edildi!\n\nRol: ${rol}`)
          .setTimestamp();
        return interaction.reply({ embeds: [embed], flags: 64 });
      }

      if (interaction.customId === 'kayit-iptal') {
        if (global.kayitSecimler) delete global.kayitSecimler[interaction.user.id];
        return interaction.reply({ content: 'İptal edildi.', flags: 64 });
      }

      if (interaction.customId === 'ticket-ac') {
        await interaction.deferReply({ flags: 64 });
        const ticketAc = require('./commands/ticket-ac');
        await ticketAc.createTicket(interaction.member, interaction.guild, interaction.channel, interaction);
      }

      if (interaction.customId === 'ticket-kapat') {
        const ticketKapat = require('./commands/ticket-kapat');
        await ticketKapat.execute(interaction);
      }

      if (interaction.customId === 'ticket-sahiplen') {
        const { PermissionFlagsBits: PF, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
        const kanal = interaction.channel;
        if (!kanal || !kanal.name.startsWith('ticket-')) {
          return interaction.reply({ content: 'Bu bir ticket kanali degil!', ephemeral: true });
        }
        const destekRolId = (loadJson(path.join(__dirname, 'guild-config.json'))[interaction.guild.id] || {}).ticketRole;
        const destekRol = interaction.guild.roles.cache.get(destekRolId);
        const yetkili = interaction.member.permissions.has(PF.ManageChannels) ||
          (destekRol && interaction.member.roles.cache.has(destekRol.id));

        if (!yetkili) {
          return interaction.reply({ content: 'Bu ticketi sahiplenmek icin yetkin yok!', ephemeral: true });
        }

        const sahipEmbed = new EmbedBuilder()
          .setColor(0x57F287)
          .setTitle(':ticket: Ticket Sahiplenildi')
          .setDescription(`:wrench: Bu ticket **${interaction.user}** tarafindan sahiplenildi.\n\nTalebi onun yonetecek. Yardim icin lutfen ona yazin.`)
          .setTimestamp();

        if (kanal.name.startsWith('ticket-')) {
          await kanal.setName(`calisiliyor-${interaction.user.username}`).catch(() => {});
        }

        await interaction.reply({ embeds: [sahipEmbed] });

        const kapatBtn = new ButtonBuilder()
          .setCustomId('ticket-kapat')
          .setLabel('Ticketi Kapat')
          .setEmoji('🔒')
          .setStyle(ButtonStyle.Danger);
        await interaction.followUp({ components: [new ActionRowBuilder().addComponents(kapatBtn)] }).catch(() => {});
      }

      if (interaction.customId.startsWith('uyelik-panel_')) {
        const tip = interaction.customId.replace('uyelik-panel_', '');
        const ayarDb = loadJson(path.join(__dirname, 'commands', 'uyelik-ayarlari.json'));
        const ayar = ayarDb[interaction.guild.id]?.[tip];

        if (!ayar) {
          return interaction.reply({ content: '❌ Bu üyelik henüz ayarlanmadı. Admin `/uyelik ayarla` ile kurmalı.', flags: 64 });
        }

        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xffd700)
              .setTitle(`🎖️ ${tip} Üyeliği`)
              .setDescription(
                `**Fiyat:** ${ayar.fiyat.toLocaleString('tr-TR')} TL\n` +
                `**Süre:** 30 gün\n` +
                `**Rol:** ${ayar.rol ? `<@&${ayar.rol}>` : 'yok'}\n\n` +
                `Satın almak istiyor musun?`
              )
          ],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId('uyelik-onay_' + tip)
                .setLabel(`✅ ${tip} — ${ayar.fiyat.toLocaleString('tr-TR')} TL`)
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId('uyelik-iptal')
                .setLabel('❌ Vazgeç')
                .setStyle(ButtonStyle.Danger)
            )
          ],
          flags: 64
        });
      }

      if (interaction.customId.startsWith('uyelik-onay_')) {
        const tip = interaction.customId.replace('uyelik-onay_', '');
        const kumar = require('./commands/kumar-yardimci.js');
        const ayarDb = loadJson(path.join(__dirname, 'commands', 'uyelik-ayarlari.json'));
        const uyelikDbPath = path.join(__dirname, 'commands', 'uyelikler.json');
        const uyelikDb = loadJson(uyelikDbPath);
        const ayar = ayarDb[interaction.guild.id]?.[tip];

        if (!ayar) {
          return interaction.reply({ content: '❌ Bu üyelik ayarlanmamış.', flags: 64 });
        }
        const fiyat = ayar.fiyat;
        const para = kumar.bakiyeAl(interaction.user.id);
        if (para < fiyat) {
          return interaction.reply({ content: `❌ Yetersiz bakiye (${para.toLocaleString('tr-TR')} TL).`, flags: 64 });
        }

        kumar.paraCikar(interaction.user.id, fiyat);
        const baslangic = Date.now();
        uyelikDb[interaction.user.id] = { tip, baslangic, bitis: baslangic + 30 * 24 * 60 * 60 * 1000 };
        fs.writeFileSync(uyelikDbPath, JSON.stringify(uyelikDb, null, 2));

        // Rolü ver (varsa)
        const rolId = ayar.rol;
        if (rolId) {
          const rol = interaction.guild.roles.cache.get(rolId);
          if (rol) {
            await interaction.member.roles.add(rol).catch(() => {});
          }
        }

        const embed = new EmbedBuilder()
          .setColor(0x00ff88)
          .setTitle('🎉 Üyelik Aktif!')
          .setDescription(
            `**Tip:** ${tip}\n` +
            `**Ödenen:** ${fiyat.toLocaleString('tr-TR')} TL\n` +
            `**Bitiş:** <t:${Math.floor((baslangic + 30 * 24 * 60 * 60 * 1000) / 1000)}:R>\n\n` +
            `Üyeliğin ${30} gün sonunda biter.`
          );
        return interaction.reply({ embeds: [embed], flags: 64 });
      }

      if (interaction.customId === 'uyelik-iptal') {
        return interaction.reply({ content: 'İptal edildi 👍', flags: 64 });
      }

      // ================= RESTORAN PANEL =================
      if (interaction.customId.startsWith('restoran-panel_')) {
        const yemekAdi = interaction.customId.replace('restoran-panel_', '');
        const restoran = require('./commands/restoran.js');
        const sonuc = restoran.siparisVer(interaction.user.id, yemekAdi);

        if (!sonuc.basarili) {
          return interaction.reply({ content: `❌ ${sonuc.hata}`, flags: 64 });
        }

        const embed = new EmbedBuilder()
          .setColor(0x00ff88)
          .setTitle(`${sonuc.yemek.emoji} Siparişin Hazır, ${interaction.user.username}!`)
          .setDescription(
            `**${sonuc.yemek.ad}** aldın!\n\n` +
            `💸 Ödenen: **${sonuc.yemek.fiyat.toLocaleString('tr-TR')} TL**\n` +
            `💰 Kalan bakiye: **${sonuc.kalan.toLocaleString('tr-TR')} TL**\n` +
            `🎒 Envanterindeki adet: **${sonuc.adet}**\n` +
            `✨ Kazanılan XP: **+${sonuc.xp}**`
          );
        return interaction.reply({ embeds: [embed], flags: 64 });
      }

      // ================= TEKNOLOJİ MAĞAZASI =================
      if (interaction.customId.startsWith('teknoloji-panel_')) {
        const urunAdi = interaction.customId.replace('teknoloji-panel_', '');
        const teknoloji = require('./commands/teknoloji.js');
        const sonuc = teknoloji.satinAl(interaction.user.id, urunAdi);

        if (!sonuc.basarili) {
          return interaction.reply({ content: `❌ ${sonuc.hata}`, flags: 64 });
        }

        const embed = new EmbedBuilder()
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
    } catch (error) {
      console.error(error);
      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({ content: '⚠️ Bir şeyler ters gitti. Tekrar dene!', flags: 64 }).catch(() => {});
        } else {
          await interaction.reply({ content: '⚠️ Bir şeyler ters gitti. Tekrar dene!', flags: 64 }).catch(() => {});
        }
      } catch (e) {}
    }
  }
});

client.on(Events.MessageCreate, (message) => {
  if (message.author.bot) return;

  if (message.content === '!dm-yaz') {
    message.reply({ content: 'Kullanım: **!dm-yaz <mesaj>** — bu mesajı özelinden (DM) gönderir.' });
    return;
  }

  if (message.content.startsWith('!dm-yaz ')) {
    const icerik = message.content.slice(8).trim();
    if (icerik) {
      awaitDM(message.author, icerik);
    }
    return;
  }

  if (message.content.startsWith('!söyle ')) {
    const icerik = message.content.slice(7).trim();
    if (!icerik) {
      message.reply('Kullanım: **!söyle <mesaj>** — burada yazdığın mesajı kanala yazar.');
      return;
    }
    try {
      message.delete().catch(() => {});
      message.channel.send(icerik);
    } catch (e) {
      message.reply('Mesaj yazdırılamadı.');
    }
    return;
  }

  // AGIR KURALLAR (kufur + spam + +18 + @everyone + link)
  const agirModDbPath = path.join(__dirname, 'agir-mod-db.json');
  const agirModDb = loadJson(agirModDbPath);
  const agirAyar = agirModDb[message.guild?.id];
  if (agirAyar && agirAyar.acik && message.content) {
    if (agirKorumaKontrol(message, agirAyar, agirModDb)) {
      return;
    }
  }

  xpHandler.execute(message);

  const welcomeDb = loadJson(welcomeDbPath);
  if (message.author.username === 'furkn0621_22200') {
    const userId = message.author.id;
    if (!welcomeDb[userId]) {
      welcomeDb[userId] = true;
      saveJson(welcomeDbPath, welcomeDb);
      message.reply('Hoş geldin sevdiğim adam!');
    }
  }

  const otoCevap = loadJson(otoCevapPath);
  const guildCevaplar = otoCevap[message.guild?.id];
  if (guildCevaplar) {
    const icerik = message.content.toLowerCase();
    for (const [tetikleme, cevap] of Object.entries(guildCevaplar)) {
      if (icerik.includes(tetikleme)) {
        message.reply(cevap);
        break;
      }
    }
  }
});

// REACTION ROLE SISTEMI
const reactionRoleDbPath = path.join(__dirname, 'reaction-roles.json');

client.on(Events.MessageReactionAdd, async (reaction, user) => {
  if (user.bot) return;

  const message = reaction.message;
  const guildId = message.guild?.id;
  if (!guildId) return;

  const db = loadJson(reactionRoleDbPath);
  const guildData = db[guildId];
  if (!guildData) return;

  const msgData = guildData[message.id];
  if (!msgData) return;

  const emojiName = reaction.emoji.name;
  const rolId = msgData[emojiName] || msgData[reaction.emoji.identifier];
  if (!rolId) return;

  try {
    const member = await message.guild.members.fetch(user.id);
    const rol = message.guild.roles.cache.get(rolId);
    if (rol) {
      await member.roles.add(rolId);
      console.log(`${user.username} -> ${rol.name} rolu verildi`);
    }
  } catch (e) {
    console.error('Reaction role verme hatasi:', e.message);
  }
});

client.on(Events.MessageReactionRemove, async (reaction, user) => {
  if (user.bot) return;

  const message = reaction.message;
  const guildId = message.guild?.id;
  if (!guildId) return;

  const db = loadJson(reactionRoleDbPath);
  const guildData = db[guildId];
  if (!guildData) return;

  const msgData = guildData[message.id];
  if (!msgData) return;

  const emojiName = reaction.emoji.name;
  const rolId = msgData[emojiName] || msgData[reaction.emoji.identifier];
  if (!rolId) return;

  try {
    const member = await message.guild.members.fetch(user.id);
    await member.roles.remove(rolId);
    console.log(`${user.username} -> rolu kaldirildi`);
  } catch (e) {
    console.error('Reaction role kaldirma hatasi:', e.message);
  }
});

// ================= ÜYELİK SÜRE TAKİBİ (saatte bir) =================
setInterval(async () => {
  const uyelikDbPath = path.join(__dirname, 'commands', 'uyelikler.json');
  const ayarDbPath = path.join(__dirname, 'commands', 'uyelik-ayarlari.json');
  const uyelikDb = loadJson(uyelikDbPath);
  const ayarDb = loadJson(ayarDbPath);
  const simdi = Date.now();
  let degisti = false;

  for (const [userId, kayit] of Object.entries(uyelikDb)) {
    if (kayit.bitis && kayit.bitis < simdi) {
      delete uyelikDb[userId];
      degisti = true;

      for (const guild of client.guilds.cache.values()) {
        const ayar = ayarDb[guild.id]?.[kayit.tip];
        if (ayar?.rol) {
          try {
            const member = await guild.members.fetch(userId).catch(() => null);
            if (member) {
              const rol = guild.roles.cache.get(ayar.rol);
              if (rol) await member.roles.remove(rol).catch(() => {});
              console.log(`Üyelik süresi bitti: ${kayit.tip} -> ${userId}`);
            }
          } catch {}
        }
      }
    }
  }
  if (degisti) fs.writeFileSync(uyelikDbPath, JSON.stringify(uyelikDb, null, 2));
}, 60 * 60 * 1000);

process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED REJECTION]', reason?.stack || reason);
});
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err?.stack || err);
});

client.login(process.env.TOKEN);
