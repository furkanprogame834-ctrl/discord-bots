const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');

const OVERSIGHT_IZINLER = [
  'ViewChannel', 'ManageChannels', 'ManageRoles', 'CreateInstantInvite',
  'ChangeNickname', 'ManageNicknames', 'KickMembers', 'BanMembers',
  'SendMessages', 'SendMessagesInThreads', 'CreatePublicThreads', 'CreatePrivateThreads',
  'EmbedLinks', 'AttachFiles', 'AddReactions', 'UseExternalEmojis', 'UseExternalStickers',
  'MentionEveryone', 'ManageMessages', 'ReadMessageHistory', 'SendTTSMessages',
  'UseApplicationCommands', 'Connect', 'Speak', 'Stream', 'UseVAD',
  'PrioritySpeaker', 'MuteMembers', 'DeafenMembers', 'MoveMembers', 'ManageWebhooks',
  'ManageGuildExpressions', 'SendPolls',
].filter(p => PermissionFlagsBits[p] !== undefined);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sunucu-kopyala')
    .setDescription('Baska bir sunucunun rollerini, kategorilerini, kanallarini ve emojilerini bu sunucuya kopyalar')
    .addStringOption(opt => opt.setName('sunucu-id').setDescription('Kopyalanacak sunucunun ID si').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Bu komutu sadece **Yonetici** olanlar kullanabilir!', flags: 64 });
    }

    const hedef = interaction.guild;
    const kaynakId = interaction.options.getString('sunucu-id').replace(/\D/g, '');
    const kaynak = interaction.client.guilds.cache.get(kaynakId);

    if (!kaynak) {
      const davetLink = `https://discord.com/api/oauth2/authorize?client_id=${interaction.client.user.id}&permissions=8&scope=bot`;
      return interaction.reply({
        content: `❌ **${kaynakId}** ID li sunucuya erişilemedi!\n\n` +
          `**Sadece ID ile kurulum — adım adım:**\n` +
          `1️⃣ **Beyefendi** botunu kaynak sunucuya **geçici** davet et:\n` +
          `   ${davetLink}\n` +
          `2️⃣ Bu komutu **tekrar** çalıştır (aynı sunucu ID si)\n` +
          `3️⃣ Kurulum bitince botu sunucudan çıkar\n\n` +
          `> Discord kuralı: bir bot, üyesi olmadığı sunucunun yapısını göremez. Bu yüzden geçici davet zorunlu.`,
        flags: 64,
      });
    }

    await interaction.deferReply({ flags: 64 });

    const sonuc = { rol: 0, kanal: 0, kategori: 0, emoji: 0, atlandi: 0, hata: 0 };
    const rolMap = new Map();

    try {
      await kaynak.roles.fetch();
      await kaynak.channels.fetch();
      await hedef.roles.fetch();

      for (const rol of [...kaynak.roles.cache.values()].sort((a, b) => a.position - b.position)) {
        if (rol.id === kaynak.id) continue;
        const ad = rol.name;
        if (hedef.roles.cache.some(r => r.name === ad)) {
          const mevcut = hedef.roles.cache.find(r => r.name === ad);
          rolMap.set(rol.id, mevcut.id);
          sonuc.atlandi++;
          continue;
        }
        try {
          const izinler = BigInt(rol.permissions.bitfield & ~PermissionFlagsBits.Administrator);
          const yeni = await hedef.roles.create({
            name: ad,
            color: rol.color,
            hoist: rol.hoist,
            mentionable: rol.mentionable,
            permissions: izinler,
          });
          rolMap.set(rol.id, yeni.id);
          sonuc.rol++;
        } catch (e) {
          if (e?.code === 30013) { sonuc.rol++; continue; }
          sonuc.hata++;
        }
      }

      const kanalState = [...kaynak.channels.cache.values()]
        .filter(k => k.type !== ChannelType.GuildCategory)
        .sort((a, b) => a.rawPosition - b.rawPosition);

      const katMap = new Map();
      for (const k of [...kaynak.channels.cache.values()].sort((a, b) => a.rawPosition - b.rawPosition)) {
        if (k.type !== ChannelType.GuildCategory) continue;
        try {
          let kategori = hedef.channels.cache.find(x => x.type === ChannelType.GuildCategory && x.name === k.name);
          if (!kategori) {
            kategori = await hedef.channels.create({ name: k.name, type: ChannelType.GuildCategory });
            sonuc.kategori++;
          } else {
            sonuc.atlandi++;
          }
          katMap.set(k.id, kategori.id);
          await ozelIzinlerKopyala(k, kategori, rolMap, sonuc);
        } catch (e) {
          sonuc.hata++;
        }
      }

      for (const k of kanalState) {
        const desteklenen = [ChannelType.GuildText, ChannelType.GuildVoice, ChannelType.GuildAnnouncement, ChannelType.GuildForum];
        if (!desteklenen.includes(k.type)) { sonuc.atlandi++; continue; }
        try {
          let kanal = hedef.channels.cache.find(x => x.name === k.name && x.type === k.type);
          const parentId = k.parentId ? katMap.get(k.parentId) : null;
          if (!kanal) {
            const olustur = {
              name: k.name,
              type: k.type,
              topic: k.topic || undefined,
              nsfw: k.nsfw,
              parent: parentId || undefined,
            };
            if (k.type === ChannelType.GuildVoice) {
              olustur.userLimit = k.userLimit || 0;
              olustur.bitrate = Math.min(k.bitrate || 64000, 128000);
            }
            kanal = await hedef.channels.create(olustur);
            sonuc.kanal++;
          } else {
            sonuc.atlandi++;
          }
          await ozelIzinlerKopyala(k, kanal, rolMap, sonuc);
        } catch (e) {
          sonuc.hata++;
        }
      }

      for (const emoji of kaynak.emojis.cache.values()) {
        try {
          if (hedef.emojis.cache.some(e => e.name === emoji.name)) { sonuc.atlandi++; continue; }
          const uzanti = emoji.animated ? 'gif' : 'png';
          const blob = await fetch(`https://cdn.discordapp.com/emojis/${emoji.id}.${uzanti}?size=128`).then(r => r.arrayBuffer());
          const attachment = { name: `emoji.${uzanti}`, data: Buffer.from(blob) };
          await hedef.emojis.create({ attachment, name: emoji.name });
          sonuc.emoji++;
        } catch (e) {
          sonuc.hata++;
        }
      }

      const embed = new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle('📋 Sunucu Kopyalama Tamamlandı')
        .setDescription(`**Kaynak:** ${kaynak.name} (\`${kaynak.id}\`)\n**Hedef:** ${hedef.name}`)
        .addFields(
          { name: '📊 Rapor', value: `🧩 Rol: **${sonuc.rol}**\n📂 Kategori: **${sonuc.kategori}**\n💬 Kanal: **${sonuc.kanal}**\n😀 Emoji: **${sonuc.emoji}**\n⏭️ Zaten vardı: **${sonuc.atlandi}**\n⚠️ Hata: **${sonuc.hata}**` },
          { name: 'ℹ️ Not', value: 'Rol ve kanal izinleri kopyalandı. @everyone, botların üstündeki roller ve özel üye izinleri kopyalanamaz.' }
        )
        .setTimestamp();
      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Sunucu kopyalama hatasi:', error.message, error.code);
      return interaction.editReply({ content: '❌ Sunucu kopyalama başarısız!\n\n**Olası nedenler:**\n- Bot yetkisi yetersiz\n- API hatası' });
    }
  },
};

async function ozelIzinlerKopyala(kaynakKanal, hedefKanal, rolMap, sonuc) {
  if (!kaynakKanal.permissionOverwrites) return;
  for (const [id, izin] of kaynakKanal.permissionOverwrites.cache) {
    try {
      let hedefId = id;
      if (id === kaynakKanal.guild.id) hedefId = hedefKanal.guild.id;
      else {
        const mapped = rolMap.get(id);
        if (mapped) hedefId = mapped;
        else continue;
      }
      const payload = {};
      for (const yetki of OVERSIGHT_IZINLER) {
        if (izin.allow.has(yetki)) payload[yetki] = true;
        if (izin.deny.has(yetki)) payload[yetki] = false;
      }
      if (Object.keys(payload).length > 0) {
        await hedefKanal.permissionOverwrites.edit(hedefId, payload);
      }
    } catch (e) {
      sonuc.hata++;
    }
  }
}