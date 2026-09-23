const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { loadDb, saveDb } = require('../lib/kayit-sistemi-db.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kayit-yetkilisi-panel')
    .setDescription('Kayıt yetkilisi paneli açar (üye seçip kayıt et)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const db = loadDb();
    const ayar = db[interaction.guild.id];
    if (!ayar?.yetkiliRol || !ayar?.uyeRol) {
      return interaction.reply({
        content: '⚠️ Önce `/kayit-ayarla` ile **yetkili rol** ve **kayıt rolü** belirlemelisin!',
        flags: 64,
      });
    }

    const kayitsiz = interaction.guild.members.cache.filter(m => !m.user.bot && !m.roles.cache.has(ayar.uyeRol));
    if (kayitsiz.size === 0) {
      return interaction.reply({ content: '🎉 Herkes zaten kayıtlı! Yeni üye gelmediği için seçilecek kişi yok.', flags: 64 });
    }

    const menu = new StringSelectMenuBuilder()
      .setCustomId('kayit-uye-sec')
      .setPlaceholder('🎯 Kayıt edilecek üyeyi seç...')
      .addOptions(
        kayitsiz.first(25).map(m => ({
          label: (m.user.username || 'Kullanıcı').slice(0, 90),
          value: m.id,
          description: (m.displayName || '').slice(0, 90) || undefined,
        }))
      );

    const row = new ActionRowBuilder().addComponents(menu);
    const onayRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('kayit-onayla')
        .setLabel('✅ Kayıt Et')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('kayit-iptal')
        .setLabel('❌ Vazgeç')
        .setStyle(ButtonStyle.Danger)
    );

    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle('📋 Kayıt Yetkilisi Paneli')
      .setDescription(
        `Aşağıdan **kayıt edilecek üyeyi** seç, ardından **Kayıt Et** butonuna bas.\n\n` +
        `✅ Kayıt edilince üye şu rolü alır: <@&${ayar.uyeRol}>\n` +
        `👥 Bu paneli kullanabilen: <@&${ayar.yetkiliRol}> + Yöneticiler`
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed], components: [row, onayRow], flags: 64 });
  },
};