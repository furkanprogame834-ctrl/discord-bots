const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');

const ROLLER = [
  { ad: '👑 Kurucu', renk: 0xE67E22, izin: [PermissionFlagsBits.Administrator] },
  { ad: '🛡️ Yönetim', renk: 0xE74C3C, izin: [PermissionFlagsBits.ManageGuild, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageRoles, PermissionFlagsBits.ManageMessages, PermissionFlagsBits.KickMembers, PermissionFlagsBits.BanMembers, PermissionFlagsBits.MentionEveryone] },
  { ad: '⭐ Yetkili', renk: 0x9B59B6, izin: [PermissionFlagsBits.ManageMessages, PermissionFlagsBits.KickMembers, PermissionFlagsBits.MentionEveryone] },
  { ad: '💬 Moderatör', renk: 0x3498DB, izin: [PermissionFlagsBits.ManageMessages, PermissionFlagsBits.MuteMembers, PermissionFlagsBits.MoveMembers, PermissionFlagsBits.MentionEveryone] },
  { ad: '🟢 Üye', renk: 0x2ECC71, izin: [] },
  { ad: '🚀 Booster', renk: 0xF1C40F, izin: [] },
  { ad: '⛔ Yasaklı', renk: 0x7F8C8D, izin: [] },
];

const KATEGORILER = [
  {
    ad: '📢 BİLGİLENDİRME',
    kanallar: [
      { ad: '📢-duyurular', tip: ChannelType.GuildText },
      { ad: '📜-kurallar', tip: ChannelType.GuildText },
      { ad: '🚪-gelen-giden', tip: ChannelType.GuildText },
    ],
  },
  {
    ad: '💬 SOHBET',
    kanallar: [
      { ad: '💬-genel-chat', tip: ChannelType.GuildText },
      { ad: '😄-sohbet', tip: ChannelType.GuildText },
      { ad: '🎮-oyun', tip: ChannelType.GuildText },
      { ad: '🎧-müzik', tip: ChannelType.GuildText },
      { ad: '🤖-bot-komutlari', tip: ChannelType.GuildText },
    ],
  },
  {
    ad: '🎮 OYUN & EĞLENCE',
    kanallar: [
      { ad: '🎮-sohbet-oyun', tip: ChannelType.GuildText },
      { ad: '🧩-bulmaca', tip: ChannelType.GuildText },
      { ad: '📊-anketler', tip: ChannelType.GuildText },
    ],
  },
  {
    ad: '🔊 SES KANALLARI',
    kanallar: [
      { ad: '🔊-sesli-sohbet', tip: ChannelType.GuildVoice },
      { ad: '🎮-oyun-ses', tip: ChannelType.GuildVoice },
      { ad: '🎧-müzik-ses', tip: ChannelType.GuildVoice },
    ],
  },
  {
    ad: '📁 YÖNETİM',
    kanallar: [
      { ad: '🛡️-moderatör-sohbet', tip: ChannelType.GuildText },
      { ad: '📋-yetki-log', tip: ChannelType.GuildText },
    ],
  },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sunucu-kur')
    .setDescription('🏠 Hazir sunucu paketi: roller + kategoriler + kanallar kurar')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Bu komutu sadece **Yonetici** olanlar kullanabilir!', flags: 64 });
    }
    await interaction.deferReply({ flags: 64 });

    const sonuc = { olusturulanKanal: 0, olusturulanRol: 0, mevcutRol: 0 };

    try {
      const mevcutRoller = new Set(interaction.guild.roles.cache.map(r => r.name));
      const yasakliIdler = [];

      for (const rolTanim of ROLLER) {
        if (mevcutRoller.has(rolTanim.ad)) {
          sonuc.mevcutRol++;
          const r = interaction.guild.roles.cache.find(x => x.name === rolTanim.ad);
          if (rolTanim.ad === '⛔ Yasaklı') yasakliIdler.push(r.id);
          continue;
        }
        const rol = await interaction.guild.roles.create({
          name: rolTanim.ad,
          color: rolTanim.renk,
          permissions: rolTanim.izin,
          hoist: true,
        });
        sonuc.olusturulanRol++;
        if (rolTanim.ad === '⛔ Yasaklı') yasakliIdler.push(rol.id);
      }

      const textlerDahil = [ChannelType.GuildText, ChannelType.GuildAnnouncement];

      const kur = async (kategoriTanim) => {
        const mevcutKat = interaction.guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === kategoriTanim.ad);
        const kategori = mevcutKat || await interaction.guild.channels.create({ name: kategoriTanim.ad, type: ChannelType.GuildCategory });

        await Promise.all(kategoriTanim.kanallar.map(async (knlDef) => {
          const mevcut = interaction.guild.channels.cache.find(c => c.name === knlDef.ad);
          if (mevcut) return;
          await interaction.guild.channels.create({ name: knlDef.ad, type: knlDef.tip, parent: kategori.id });
          sonuc.olusturulanKanal++;
        }));

        for (const yasakliId of yasakliIdler) {
          if (kategoriTanim.ad === '📁 YÖNETİM') continue;
          const yasakliIz = { ViewChannel: false };
          await kategori.permissionOverwrites.edit(yasakliId, yasakliIz);
          const sesKategorisi = kategoriTanim.ad === '🔊 SES KANALLARI';
          await Promise.all(kategori.children.cache.map(async (k) => {
            if (sesKategorisi) await k.permissionOverwrites.edit(yasakliId, { Connect: false });
            else await k.permissionOverwrites.edit(yasakliId, { ViewChannel: false, SendMessages: false });
          }));
        }
      };

      await Promise.all(KATEGORILER.map(kur));

      const embed = new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle('✨ Sunucu Tamamen Hazır!')
        .setDescription(
          '🎨 **Modern tasarım**\n' +
          '👑 **Hazır ve düzenli roller**\n' +
          '😀 **Özel emoji paketi**\n' +
          '📂 **Hazır kategori & kanallar**\n' +
          '🛡️ **Yetki ve güvenlik ayarları**\n' +
          '🤖 **Bot altyapısı**\n' +
          '🎮 **Sohbet, oyun ve eğlence kanalları**\n' +
          '🔊 **Ses kanalları**\n' +
          '📢 **Duyuru ve bilgilendirme sistemleri**\n\n' +
          '⏱️ **Zaman kaybetmeden teslim alıp kullanmaya başlayabilirsin.**'
        )
        .addFields(
          { name: '📦 Paket İçeriği — Roller', value: '👑 Kurucu\n🛡️ Yönetim\n⭐ Yetkili\n💬 Moderatör\n🟢 Üye\n🚀 Booster\n⛔ Yasaklı' },
          { name: '📊 Oluşturma Raporu', value: `**${sonuc.olusturulanRol}** yeni rol, **${sonuc.olusturulanKanal}** yeni kanal oluşturuldu${sonuc.mevcutRol > 0 ? `, **${sonuc.mevcutRol}** rol zaten vardı` : ''}.` },
          { name: '😀 Emoji Paketi', value: '👑 ❤️ 🇹🇷 🎮 🔥 🌙 💜 💎 ✅ 😂 👍 🐺 ☠️' }
        )
        .setTimestamp();
      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Sunucu kurma hatasi:', error.message, error.code);
      return interaction.editReply({ content: '❌ Sunucu kurulumu başarısız!\n\n**Olası nedenler:**\n- Bot yetkisi yetersiz (ManageRoles / ManageChannels)\n- API hatası' });
    }
  },
};