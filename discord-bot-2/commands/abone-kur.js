const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

const aboneDbPath = path.join(__dirname, '..', 'abone-db.json');

function loadAboneDb() {
  try { if (fs.existsSync(aboneDbPath)) return JSON.parse(fs.readFileSync(aboneDbPath, 'utf8')); } catch (e) {}
  return {};
}

function saveAboneDb(db) {
  fs.writeFileSync(aboneDbPath, JSON.stringify(db, null, 2));
}

const KANALLAR = [
  {
    ad: '🛒 SATIN AL',
    kanallar: [
      { ad: 'siparis', tip: ChannelType.GuildText },
      { ad: 'odeme', tip: ChannelType.GuildText },
    ],
  },
  {
    ad: '🎁 ÜYELERE ÖZEL',
    sadeceAbone: true,
    kanallar: [
      { ad: 'ozel-sohbet', tip: ChannelType.GuildText },
      { ad: 'cekilisler', tip: ChannelType.GuildText },
    ],
  },
  {
    ad: '📞 DESTEK',
    kanallar: [
      { ad: 'destek', tip: ChannelType.GuildText },
      { ad: 'duyurular', tip: ChannelType.GuildText },
    ],
  },
  {
    ad: '🔊 SES',
    sadeceAbone: true,
    kanallar: [
      { ad: 'VIP', tip: ChannelType.GuildVoice },
    ],
  },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('abone-kur')
    .setDescription('Abonelik sunucusu kur: kanallar + abone rolu')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Bu komutu sadece **Yonetici** olanlar kullanabilir!', flags: 64 });
    }
    await interaction.deferReply({ flags: 64 });

    const sonuc = { kanal: 0, kategori: 0 };

    try {
      let aboneRol = interaction.guild.roles.cache.find(r => r.name === 'Abone');
      if (!aboneRol) {
        aboneRol = await interaction.guild.roles.create({ name: 'Abone', color: 0xF47FFF });
      }
      const db = loadAboneDb();
      db[interaction.guild.id] = { rol: aboneRol.id, panelKanal: null };
      saveAboneDb(db);

      for (const katDef of KANALLAR) {
        let kategori = interaction.guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === katDef.ad);
        if (!kategori) {
          kategori = await interaction.guild.channels.create({ name: katDef.ad, type: ChannelType.GuildCategory });
          sonuc.kategori++;
        }

        for (const kanalDef of katDef.kanallar) {
          if (interaction.guild.channels.cache.some(c => c.name === kanalDef.ad)) continue;
          const kanal = await interaction.guild.channels.create({ name: kanalDef.ad, type: kanalDef.tip, parent: kategori.id });
          sonuc.kanal++;
          if (katDef.sadeceAbone) {
            await kanal.permissionOverwrites.edit(interaction.guild.id, { ViewChannel: false });
            await kanal.permissionOverwrites.edit(aboneRol.id, { ViewChannel: true });
          }
        }
      }

      const embed = new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle('✅ Abonelik Sunucusu Kuruldu')
        .setDescription(
          `**Roller:**\n🎁 Abone — \`${aboneRol.id}\`\n\n` +
          `**Kanallar:** ${sonuc.kanal} adet, **Kategoriler:** ${sonuc.kategori} adet oluşturuldu.\n\n` +
          `🎁 ÜYELERE ÖZEL ve 🔊 SES kanalları yalnızca **Abone** rolüne görünür.`
        )
        .setTimestamp();
      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Abone kurulum hatasi:', error.message, error.code);
      return interaction.editReply({ content: '❌ Kurulum başarısız!\n\n**Olası nedenler:**\n- Bot yetkisi yetersiz (ManageRoles / ManageChannels)\n- API hatası' });
    }
  },
};