const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const guildConfigPath = path.join(__dirname, '..', 'guild-config.json');

function loadJson(p) {
  try { if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) {}
  return {};
}

function saveJson(p, d) {
  fs.writeFileSync(p, JSON.stringify(d, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('log-kanal')
    .setDescription('Gelen/giden uye loglarinin yazilacagi kanali ayarla')
    .addSubcommand(sub =>
      sub.setName('ayarla')
        .setDescription('Log kanalini ayarla')
        .addChannelOption(opt => opt.setName('kanal').setDescription('Gelen/giden log kanali').addChannelTypes(0).setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('kapat')
        .setDescription('Log kaydini tamamen kapat'))
    .addSubcommand(sub =>
      sub.setName('gor')
        .setDescription('Mevcut ayarlanan log kanalini goster'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Bu komutu sadece **Yonetici** kullanabilir!', ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();
    const config = loadJson(guildConfigPath);
    if (!config[interaction.guild.id]) config[interaction.guild.id] = {};

    if (sub === 'ayarla') {
      await interaction.reply({ content: ':warning: Gelen/giden uye logu su anda **tamamen kapali**. Bot bu mesajlari artik hicbir kanala yazmiyor.', ephemeral: true });
      return;
    }

    if (sub === 'kapat') {
      delete config[interaction.guild.id].logKanal;
      saveJson(guildConfigPath, config);
      await interaction.reply({ content: ':no_entry: Gelen/giden uye logu **tamamen kapali**. Bot artik hicbir kanala yazmiyor.' });
      return;
    }

    if (sub === 'gor') {
      const kanalId = config[interaction.guild.id]?.logKanal;
      const kanal = kanalId ? interaction.guild.channels.cache.get(kanalId) : null;
      const embed = new EmbedBuilder()
        .setTitle(':scroll: Log Kanal Ayarı')
        .setDescription(kanal ? `Eski ayar: **${kanal}** (ama su an **gelen/giden loglari tamamen kapali**)` : 'Gelen/giden uye loglari **tamamen kapali**. Bot bu mesajlari hicbir kanala yazmiyor.')
        .setColor(0x00BFFF)
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }
  },
};
