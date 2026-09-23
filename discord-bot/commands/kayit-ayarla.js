const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { loadDb, saveDb } = require('../lib/kayit-sistemi-db.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kayit-ayarla')
    .setDescription('Admin: Kayıt sistemi ayarları')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addRoleOption(opt => opt.setName('yetkili-rol').setDescription('Kayıt yetkilisi rolü (üye girince taglanır)'))
    .addRoleOption(opt => opt.setName('uye-rol').setDescription('Kayıt olunca üyeye verilecek rol')),
  async execute(interaction) {
    const db = loadDb();
    if (!db[interaction.guild.id]) db[interaction.guild.id] = {};
    const ayar = db[interaction.guild.id];

    const yetkili = interaction.options.getRole('yetkili-rol');
    const uyeRol = interaction.options.getRole('uye-rol');

    if (yetkili) ayar.yetkiliRol = yetkili.id;
    if (uyeRol) ayar.uyeRol = uyeRol.id;
    saveDb(db);

    const embed = new EmbedBuilder()
      .setColor(0x00ff88)
      .setTitle('📋 Kayıt Sistemi Ayarları')
      .setDescription(
        `👥 Kayıt Yetkilisi Rolü: ${ayar.yetkiliRol ? `<@&${ayar.yetkiliRol}>` : 'ayarlı değil'}\n` +
        `✅ Kayıt Verilen Rol: ${ayar.uyeRol ? `<@&${ayar.uyeRol}>` : 'ayarlı değil'}\n\n` +
        `Kanal ayarı için: \`/kayit-kanal-ayarla\`\n` +
        `Panel için: \`/kayit-yetkilisi-panel\``
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed], flags: 64 });
  },
};