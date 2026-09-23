const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { loadDb, saveDb, siparisDbPath, aboneDbPath } = require('./siparis.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('siparis-panel')
    .setDescription('Bekleyen siparisleri yonet (onayla / reddet)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Bu komutu sadece **Yonetici** olanlar kullanabilir!', flags: 64 });
    }

    const db = loadDb(siparisDbPath);
    const bekleyenler = Object.entries(db).filter(([, s]) => s.durum === 'beklemede');

    if (bekleyenler.length === 0) {
      const embed = new EmbedBuilder()
        .setColor(0xFFFF00)
        .setTitle('📋 Sipariş Paneli')
        .setDescription('Bekleyen sipariş yok. Yeni sipariş geldiğinde burada görünecek.')
        .setTimestamp();
      return interaction.reply({ embeds: [embed], flags: 64 });
    }

    const goster = bekleyenler.slice(0, 8);
    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle(`📋 Bekleyen Siparişler (${bekleyenler.length})`)
      .setDescription(
        goster.map(([kod, s], i) =>
          `**${i + 1}.** \`${kod}\` — <@${s.kullanici}> — ${s.paket} (**${s.fiyat}₡**)\n` +
          `   🕐 <t:${Math.floor(s.zaman / 1000)}:R>`
        ).join('\n') + (bekleyenler.length > 8 ? `\n\n... ve ${bekleyenler.length - 8} sipariş daha (öncekileri yönetmek için 1-8 arasını seç)` : '')
      )
      .setFooter({ text: 'Altındaki menüden sipariş seç, onayla veya reddet.' });

    global.siparisPanelVeri = global.siparisPanelVeri || {};
    global.siparisPanelVeri[interaction.user.id] = goster.map(([kod]) => kod);

    const row = new ActionRowBuilder().addComponents(
      goster.map(([, s], i) =>
        new ButtonBuilder()
          .setCustomId(`siparis-panel-sec_${i}`)
          .setLabel(`${i + 1}`)
          .setStyle(ButtonStyle.Secondary)
      )
    );
    const onayRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('siparis-panel-onayla').setLabel('✅ Onayla').setStyle(ButtonStyle.Success).setDisabled(true),
      new ButtonBuilder().setCustomId('siparis-panel-reddet').setLabel('❌ Reddet').setStyle(ButtonStyle.Danger).setDisabled(true),
      new ButtonBuilder().setCustomId('siparis-panel-yeni').setLabel('🔄 Yenile').setStyle(ButtonStyle.Primary),
    );

    await interaction.reply({ embeds: [embed], components: [row, onayRow], flags: 64 });
  },
};

module.exports.handleSec = async (interaction) => {
  const idx = parseInt(interaction.customId.split('_')[1], 10);
  global.siparisPanelVeri = global.siparisPanelVeri || {};
  const kodlar = global.siparisPanelVeri[interaction.user.id] || [];
  const kod = kodlar[idx];

  const db = loadDb(siparisDbPath);
  const s = db[kod];
  if (!s) return interaction.reply({ content: '⚠️ Bu sipariş bulunamadı veya çoktan işlenmiş.', ephemeral: true });

  global.siparisPanelSecim = global.siparisPanelSecim || {};
  global.siparisPanelSecim[interaction.user.id] = kod;

  const embed = new EmbedBuilder()
    .setColor(0xF47FFF)
    .setTitle(`📦 Sipariş: \`${kod}\``)
    .setDescription(
      `**Müşteri:** <@${s.kullanici}> (${s.ad})\n` +
      `**Paket:** ${s.paket} — **${s.fiyat}₡**\n` +
      `**Zaman:** <t:${Math.floor(s.zaman / 1000)}:R>\n\n` +
      `Onaylarsan ${s.ad} kişisine **Abone** rolü verilir.`
    )
    .setTimestamp();

  const onayRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('siparis-panel-onayla').setLabel('✅ Onayla').setStyle(ButtonStyle.Success).setDisabled(false),
    new ButtonBuilder().setCustomId('siparis-panel-reddet').setLabel('❌ Reddet').setStyle(ButtonStyle.Danger).setDisabled(false),
    new ButtonBuilder().setCustomId('siparis-panel-yeni').setLabel('🔄 Yenile').setStyle(ButtonStyle.Primary),
  );

  await interaction.update({ embeds: [embed], components: [onayRow] });
};

module.exports.handleOnayla = async (interaction) => {
  global.siparisPanelSecim = global.siparisPanelSecim || {};
  const kod = global.siparisPanelSecim[interaction.user.id];
  if (!kod) return interaction.reply({ content: '⚠️ Önce yukarıdan bir sipariş seç!', ephemeral: true });

  const db = loadDb(siparisDbPath);
  const s = db[kod];
  if (!s || s.durum !== 'beklemede') {
    return interaction.reply({ content: `⚠️ Bu sipariş artık \`${s?.durum || 'yok'}\` durumda.`, ephemeral: true });
  }

  s.durum = 'onaylandi';
  s.islemYapan = interaction.user.id;
  s.islemZaman = Date.now();
  saveDb(siparisDbPath, db);

  const aboneDb = loadDb(aboneDbPath);
  const aboneRolId = aboneDb[interaction.guild.id]?.rol;
  let rolVerildi = false;
  if (aboneRolId) {
    const uye = await interaction.guild.members.fetch(s.kullanici).catch(() => null);
    if (uye) {
      await uye.roles.add(aboneRolId).catch(() => {});
      rolVerildi = true;
    }
  }

  const embed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setTitle(`✅ \`${kod}\` Onaylandı`)
    .setDescription(
      `**Müşteri:** <@${s.kullanici}>\n**Paket:** ${s.paket} — **${s.fiyat}₡**\n` +
      `**Abone rolü:** ${rolVerildi ? '<a:yes:0> verildi' : 'verilemedi (üye sunucuda yok veya rol yok)'}`
    )
    .setTimestamp();

  await interaction.update({ embeds: [embed], components: [] });
};

module.exports.handleReddet = async (interaction) => {
  global.siparisPanelSecim = global.siparisPanelSecim || {};
  const kod = global.siparisPanelSecim[interaction.user.id];
  if (!kod) return interaction.reply({ content: '⚠️ Önce yukarıdan bir sipariş seç!', ephemeral: true });

  const db = loadDb(siparisDbPath);
  const s = db[kod];
  if (!s || s.durum !== 'beklemede') {
    return interaction.reply({ content: `⚠️ Bu sipariş artık \`${s?.durum || 'yok'}\` durumda.`, ephemeral: true });
  }

  s.durum = 'reddedildi';
  s.islemYapan = interaction.user.id;
  s.islemZaman = Date.now();
  saveDb(siparisDbPath, db);

  const embed = new EmbedBuilder()
    .setColor(0xFF0000)
    .setTitle(`❌ \`${kod}\` Reddedildi`)
    .setDescription(`**Müşteri:** <@${s.kullanici}>\n**Paket:** ${s.paket} — **${s.fiyat}₡**`)
    .setTimestamp();

  await interaction.update({ embeds: [embed], components: [] });
};