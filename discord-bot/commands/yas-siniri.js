const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'guild-config.json');

function loadJson(p) {
  try { if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) {}
  return {};
}
function saveJson(p, d) { fs.writeFileSync(p, JSON.stringify(d, null, 2)); }

module.exports = {
  data: new SlashCommandBuilder()
    .setName('yas-siniri')
    .setDescription('Sunucu icin yas dogrulama sistemi kurar')
    .addSubcommand(sub => sub.setName('kur').setDescription('Yas siniri sistemi kur')
      .addIntegerOption(opt => opt.setName('yas').setDescription('Minimum yas (default 16)').setMinValue(13).setMaxValue(21))
      .addRoleOption(opt => opt.setName('rol').setDescription('Dogrulaninca verilecek rol (opsiyonel)'))
      .addChannelOption(opt => opt.setName('kanal').setDescription('Dogrulama kanali (opsiyonel)').addChannelTypes(0)))
    .addSubcommand(sub => sub.setName('kapat').setDescription('Yas dogrulama sistemini kapat'))
    .addSubcommand(sub => sub.setName('gor').setDescription('Mevcut ayarlari goster'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Bu komutu sadece **Yonetici** kullanabilir!', ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();
    const config = loadJson(dbPath);
    const g = config[interaction.guild.id] || {};

    if (sub === 'kur') {
      const yas = interaction.options.getInteger('yas') || 16;
      const rol = interaction.options.getRole('rol');
      const kanal = interaction.options.getChannel('kanal');

      g.yasSiniri = { yas, rolId: rol?.id || null, kanalId: kanal?.id || null };
      config[interaction.guild.id] = g;
      saveJson(dbPath, config);

      const embed = new EmbedBuilder()
        .setTitle(':id: Yas Dogrulama Sistemi')
        .setDescription(`Minimum yas: **${yas}**\nDogrulaninca rol: ${rol ? rol : 'Yok'}\nDogrulama kanali: ${kanal ? kanal : 'Sunucu geneli'}`)
        .setColor(0x00BFFF)
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
      return;
    }

    if (sub === 'kapat') {
      delete g.yasSiniri;
      config[interaction.guild.id] = g;
      saveJson(dbPath, config);
      await interaction.reply({ content: ':x: Yas dogrulama sistemi kapandi.' });
      return;
    }

    if (sub === 'gor') {
      const ayar = g.yasSiniri;
      if (!ayar) return interaction.reply({ content: ':x: Yas dogrulama sistemi kurulu degil. `/yas-siniri kur` ile kur.', ephemeral: true });
      const rol = ayar.rolId ? interaction.guild.roles.cache.get(ayar.rolId) : null;
      const kanal = ayar.kanalId ? interaction.guild.channels.cache.get(ayar.kanalId) : null;
      const embed = new EmbedBuilder()
        .setTitle(':id: Yas Dogrulama Sistemi')
        .setDescription(`Minimum yas: **${ayar.yas}**\nDogrulaninca rol: ${rol ? rol : 'Yok'}\nDogrulama kanali: ${kanal ? kanal : 'Sunucu geneli'}`)
        .setColor(0x00BFFF)
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }
  },
};
