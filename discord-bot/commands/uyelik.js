const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const kumar = require('./kumar-yardimci.js');

const ayarPath = path.join(__dirname, 'uyelik-ayarlari.json');
const uyelikPath = path.join(__dirname, 'uyelikler.json');

const SURE_GUN = 30; // üyelik süresi (gün)

function loadJson(fp) { try { if (fs.existsSync(fp)) return JSON.parse(fs.readFileSync(fp, 'utf8')); } catch {} return {}; }
function saveJson(fp, d) { fs.writeFileSync(fp, JSON.stringify(d, null, 2)); }

function ayarlar(guildId) {
  const db = loadJson(ayarPath);
  if (!db[guildId]) {
    db[guildId] = {
      Star: { rol: null, fiyat: 100000 },
      'Star Plus': { rol: null, fiyat: 250000 }
    };
    saveJson(ayarPath, db);
  }
  return db[guildId];
}

function bitisHesapla() {
  return Date.now() + SURE_GUN * 24 * 60 * 60 * 1000;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('uyelik')
    .setDescription('Yarımkaldık üyelik sistemi')
    .addSubcommand(s => s
      .setName('durum')
      .setDescription('Üyelik durumunu gösterir'))
    .addSubcommand(s => s
      .setName('al')
      .setDescription('Üyelik satın al')
      .addStringOption(o => o
        .setName('tip')
        .setDescription('Üyelik tipi')
        .setRequired(true)
        .addChoices(
          { name: 'Star', value: 'Star' },
          { name: 'Star Plus', value: 'Star Plus' }
        )))
    .addSubcommand(s => s
      .setName('panel')
      .setDescription('Üyelik satın alma panelini oluştur (Admin)'))
    .addSubcommand(s => s
      .setName('ayarla')
      .setDescription('Üyelik fiyat ve rolünü ayarla (Admin)')
      .addStringOption(o => o
        .setName('tip')
        .setDescription('Üyelik tipi')
        .setRequired(true)
        .addChoices(
          { name: 'Star', value: 'Star' },
          { name: 'Star Plus', value: 'Star Plus' }
        ))
      .addRoleOption(o => o.setName('rol').setDescription('Verilecek rol').setRequired(true))
      .addIntegerOption(o => o.setName('fiyat').setDescription('Fiyat (TL)').setRequired(true))),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const sub = interaction.options.getSubcommand();
    const tip = interaction.options.getString('tip');
    const ayar = ayarlar(guildId);

    if (sub === 'panel') {
      if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: '❌ Bu komut **Admin** yetkisi ister.', flags: 64 });
      }

      const star = ayar['Star'];
      const plus = ayar['Star Plus'];

      const embed = new EmbedBuilder()
        .setColor(0x7c5cff)
        .setTitle('🎖️ Yarımkaldık Üyelik')
        .setDescription(
          'Aşağıdan bir üyelik seç, sana uygun paneli açılsın.\n' +
          'Üyelik süresi **30 gündür** ve rolün otomatik verilir.'
        )
        .addFields(
          {
            name: '⭐ Star',
            value: star.rol
              ? `**Fiyat:** ${star.fiyat.toLocaleString('tr-TR')} TL\n**Rol:** <@&${star.rol}>`
              : '*Ayarlanmadı*',
            inline: true
          },
          {
            name: '💎 Star Plus',
            value: plus.rol
              ? `**Fiyat:** ${plus.fiyat.toLocaleString('tr-TR')} TL\n**Rol:** <@&${plus.rol}>`
              : '*Ayarlanmadı*',
            inline: true
          }
        );

      const satirlar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('uyelik-panel_Star')
          .setLabel('⭐ Star')
          .setEmoji('⭐')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('uyelik-panel_Star Plus')
          .setLabel('💎 Star Plus')
          .setEmoji('💎')
          .setStyle(ButtonStyle.Success)
      );

      return interaction.reply({ embeds: [embed], components: [satirlar] });
    }

    if (sub === 'durum') {
      const db = loadJson(uyelikPath);
      const kayit = db[interaction.user.id];
      const embed = new EmbedBuilder()
        .setColor(0x7c5cff)
        .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
        .setTitle('📋 Üyelik Durumu');

      if (!kayit || kayit.bitis < Date.now()) {
        embed.setDescription('🎫 Şu an **aktif üyeliğin yok**.\n`/uyelik al` ile Star veya Star Plus sahibi olabilirsin!');
      } else {
        embed.setDescription(
          `**Tip:** ${kayit.tip}\n` +
          `**Başlangıç:** <t:${Math.floor(kayit.baslangic / 1000)}:R>\n` +
          `**Bitiş:** <t:${Math.floor(kayit.bitis / 1000)}:R>`
        );
      }
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'ayarla') {
      if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: '❌ Bu komut **Admin** yetkisi ister.', flags: 64 });
      }
      const rol = interaction.options.getRole('rol');
      const fiyat = interaction.options.getInteger('fiyat');
      ayar[tip] = { rol: rol.id, fiyat: fiyat };
      const db = loadJson(ayarPath);
      db[guildId] = ayar;
      saveJson(ayarPath, db);

      const embed = new EmbedBuilder()
        .setColor(0x00ff88)
        .setTitle('✅ Üyelik Ayarları Güncellendi')
        .setDescription(
          `**Tip:** ${tip}\n` +
          `**Rol:** ${rol}\n` +
          `**Fiyat:** ${fiyat.toLocaleString('tr-TR')} TL`
        );
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'al') {
      if (!ayar[tip]) return interaction.reply({ content: '❌ Bu üyelik ayarlanmamış. Admin `/uyelik ayarla` ile kurmalı.', flags: 64 });
      const fiyat = ayar[tip].fiyat;

      // Devam eden üyelik kontrolü
      const db = loadJson(uyelikPath);
      const mevcut = db[interaction.user.id];
      if (mevcut && mevcut.bitis > Date.now()) {
        return interaction.reply({
          content: `⏳ Zaten **${mevcut.tip}** üyeliğin devam ediyor. Süre bitmeden yeniden alınamaz.`,
          flags: 64
        });
      }

      const para = kumar.bakiyeAl(interaction.user.id);
      if (para < fiyat) {
        return interaction.reply({
          content: `❌ Yetersiz bakiye. Gerekli: **${fiyat.toLocaleString('tr-TR')} TL** (bakiyen: ${para.toLocaleString('tr-TR')} TL)`,
          flags: 64
        });
      }

      const onay = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('uyelik-onay_' + tip)
          .setLabel(`✅ ${tip} — ${fiyat.toLocaleString('tr-TR')} TL`)
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('uyelik-iptal')
          .setLabel('❌ Vazgeç')
          .setStyle(ButtonStyle.Danger)
      );

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xffd700)
            .setTitle(`🎖️ ${tip} Üyeliği`)
            .setDescription(
              `**Fiyat:** ${fiyat.toLocaleString('tr-TR')} TL\n` +
              `**Süre:** ${SURE_GUN} gün\n` +
              `**Rol:** <@&${ayar[tip].rol || 'ayarlanmamış'}>\n\n` +
              `Satın almak için **onayla** butonuna bas.`
            )
        ],
        components: [onay],
        flags: 64
      });
    }
  }
};