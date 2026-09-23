const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'oto-rol-db.json');

function load() {
  try { return JSON.parse(fs.readFileSync(dbPath, 'utf8')); } catch { return {}; }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('oto-rol')
    .setDescription('Sunucuya giren uyelere otomatik rol verir')
    .addSubcommand(sub => sub.setName('ayarla').setDescription('Giren uyelere verilecek rolu ayarla')
      .addRoleOption(opt => opt.setName('rol').setDescription('Verilecek rol').setRequired(true))
      .addBooleanOption(opt => opt.setName('botlar').setDescription('Botlara da verilsin mi? (default: hayir)'))
      .addStringOption(opt => opt.setName('mesaj').setDescription('Kisiye ozel karsilama mesaji (opsiyonel)')))
    .addSubcommand(sub => sub.setName('kapat').setDescription('Otomatik rol vermeyi kapat'))
    .addSubcommand(sub => sub.setName('durum').setDescription('Otomatik rol ayarini goster'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Bu komutu kullanmak icin **Yonetici** yetkisi gerekir.', ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();
    const db = load();

    if (sub === 'ayarla') {
      const rol = interaction.options.getRole('rol');
      const botlar = interaction.options.getBoolean('botlar') || false;
      const mesaj = interaction.options.getString('mesaj');

      const ayar = { rolId: rol.id, botlar, mesaj: mesaj || null };
      db[interaction.guild.id] = ayar;
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

      const embed = new EmbedBuilder()
        .setTitle(':label: Otomatik Rol Ayarlandi!')
        .setDescription(`Sunucuya giren uyelere **${rol.name}** rolü otomatik verilecek.${mesaj ? `\n\n:wave: Karsilama mesaji: *${mesaj}*` : ''}`)
        .setColor(0x57F287)
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'kapat') {
      if (db[interaction.guild.id]) {
        delete db[interaction.guild.id];
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        return interaction.reply({ content: ':x: Otomatik rol verme kapatildi.', ephemeral: true });
      }
      return interaction.reply({ content: ':grey_exclamation: Bu sunucuda otomatik rol ayari yok.', ephemeral: true });
    }

    if (sub === 'durum') {
      const ayar = db[interaction.guild.id];
      if (!ayar) return interaction.reply({ content: ':grey_exclamation: Otomatik rol **KAPALI**. `/oto-rol ayarla` ile acabilirsin.' });
      const rol = interaction.guild.roles.cache.get(ayar.rolId);
      return interaction.reply({ content: `:label: Otomatik rol **ACIK** — Verilen rol: **${rol ? rol.name : ayar.rolId}**${ayar.mesaj ? `\nKarsilama: *${ayar.mesaj}*` : ''}` });
    }
  },
};
