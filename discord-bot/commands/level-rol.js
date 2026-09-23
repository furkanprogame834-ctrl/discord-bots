const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'level-roles.json');

function loadJson(p) {
  try { if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) {}
  return {};
}
function saveJson(p, d) { fs.writeFileSync(p, JSON.stringify(d, null, 2)); }

module.exports = {
  data: new SlashCommandBuilder()
    .setName('level-rol')
    .setDescription('Belirli bir seviyeye ulasinca verilecek rol ayarla')
    .addSubcommand(sub => sub.setName('ekle').setDescription('Seviyeye rol bagla')
      .addIntegerOption(opt => opt.setName('seviye').setDescription('Hedef seviye').setRequired(true).setMinValue(1).setMaxValue(100))
      .addRoleOption(opt => opt.setName('rol').setDescription('Verilecek rol').setRequired(true)))
    .addSubcommand(sub => sub.setName('kaldir').setDescription('Seviyeden rol bagini kaldir')
      .addIntegerOption(opt => opt.setName('seviye').setDescription('Seviye').setRequired(true).setMinValue(1).setMaxValue(100)))
    .addSubcommand(sub => sub.setName('liste').setDescription('Tum seviye-rol eslesmelerini goster'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Bu komutu sadece **Yonetici** kullanabilir!', ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();
    const db = loadJson(dbPath);
    if (!db[interaction.guild.id]) db[interaction.guild.id] = {};

    if (sub === 'ekle') {
      const seviye = interaction.options.getInteger('seviye');
      const rol = interaction.options.getRole('rol');
      db[interaction.guild.id][seviye] = { rolId: rol.id, rolName: rol.name };
      saveJson(dbPath, db);
      await interaction.reply({ content: `:white_check_mark: **${seviye}. seviyeye** ulasinca **${rol.name}** rolu verilecek!` });
      return;
    }

    if (sub === 'kaldir') {
      const seviye = interaction.options.getInteger('seviye');
      if (db[interaction.guild.id][seviye]) {
        delete db[interaction.guild.id][seviye];
        saveJson(dbPath, db);
        await interaction.reply({ content: `:white_check_mark: **${seviye}. seviye** rol baglantiisi kaldirildi.` });
      } else {
        await interaction.reply({ content: `:x: **${seviye}. seviye** icin rol baglantiisi yok.`, ephemeral: true });
      }
      return;
    }

    if (sub === 'liste') {
      const eslesmeler = Object.entries(db[interaction.guild.id]).sort((a, b) => a[0] - b[0]);
      if (eslesmeler.length === 0) {
        return interaction.reply({ content: ':x: Henuz hic seviye-rol eslesmesi yok. `/level-rol ekle` ile ekle.', ephemeral: true });
      }
      const satirlar = eslesmeler.map(([s, r]) => `**${s}.** seviye -> <@&${r.rolId}>`);
      const embed = new EmbedBuilder()
        .setTitle(':label: Seviye-Rol Eslesmeleri')
        .setDescription(satirlar.join('\n'))
        .setColor(0x00BFFF)
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }
  },
};
