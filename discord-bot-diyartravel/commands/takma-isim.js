const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'nick-ayar-db.json');

function loadAyar() {
  try {
    if (fs.existsSync(dbPath)) return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  } catch (e) {}
  return { acik: true };
}
function saveAyar(ayar) {
  fs.writeFileSync(dbPath, JSON.stringify(ayar, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('takma-isim')
    .setDescription('Sunucudaki takma adını değiştir')
    .addSubcommand(sub => sub.setName('degistir').setDescription('Bir üyenin takma adını değiştir')
      .addStringOption(opt => opt.setName('isim').setDescription('Yeni takma ad').setRequired(true).setMaxLength(32))
      .addUserOption(opt => opt.setName('kisi').setDescription('Takma adı değişecek üye (boşsa kendin)')))
    .addSubcommand(sub => sub.setName('sifirla').setDescription('Takma adı varsayılana döndür (kisi verilirse o üye)')
      .addUserOption(opt => opt.setName('kisi').setDescription('Sıfırlanacak üye (boşsa kendin)')))
    .addSubcommand(sub => sub.setName('ayar').setDescription('Admin: Takma isim sistemini aç/kapat')
      .addBooleanOption(opt => opt.setName('acik').setDescription('Sistem açık mı?').setRequired(true))),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const ayar = loadAyar();
    const member = interaction.member;

    if (sub === 'ayar') {
      if (interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) === false) {
        return interaction.reply({ content: '❌ Bu işlem için **Yönetici** yetkisi gerekli.', flags: 64 });
      }
      ayar.acik = interaction.options.getBoolean('acik');
      saveAyar(ayar);
      return interaction.reply({ content: ayar.acik ? '🟢 Takma isim sistemi **açıldı**.' : '🔴 Takma isim sistemi **kapatıldı**.', flags: 64 });
    }

    if (!ayar.acik) {
      return interaction.reply({ content: '🔴 Takma isim sistemi şu an **kapalı**.', flags: 64 });
    }

    // Bot takma adı değiştirebilme iznine sahip olmalı
    const botMember = interaction.guild.members.cache.get(interaction.client.user.id);
    if (!botMember?.permissions.has(PermissionFlagsBits.ManageNicknames)) {
      return interaction.reply({ content: '⚠️ Botun **Takma Adları Yönet** izni yok! Sunucu ayarlarından botun rolüne bu izni ver.', flags: 64 });
    }

    if (sub === 'sifirla') {
      const hedef = interaction.options.getMember('kisi') || member;
      try {
        await hedef.setNickname(null, 'Takma isim sıfırlama');
        const kim = hedef.id === member.id ? 'Takma adın' : `**${hedef.user.username}**'nin takma adı`;
        return interaction.reply({ content: `✅ ${kim} varsayılana döndürüldü.`, flags: 64 });
      } catch (e) {
        return interaction.reply({ content: '❌ Takma ad sıfırlanamadı (rol sırası veya izin sorunu olabilir).', flags: 64 });
      }
    }

    const isim = interaction.options.getString('isim');
    const hedef = interaction.options.getMember('kisi') || member;
    try {
      await hedef.setNickname(isim, 'Komut ile takma ad değiştirildi');
    } catch (e) {
      return interaction.reply({ content: '❌ Takma ad değiştirilemedi (rol sırası veya izin sorunu olabilir).', flags: 64 });
    }

    const kim = hedef.id === member.id ? 'Artık sunucuda' : `**${hedef.user.username}** artık sunucuda`;
    const embed = new EmbedBuilder()
      .setColor(0x00FF88)
      .setTitle('🪪 Takma Ad Değişti!')
      .setDescription(`${kim} **${isim}** olarak görünecek!`)
      .setTimestamp();

    return interaction.reply({ embeds: [embed], flags: 64 });
  },
};