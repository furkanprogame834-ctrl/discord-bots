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
    .setName('oto-tag')
    .setDescription('Sunucuya katilanlarin adina otomatik tag ekler')
    .addSubcommand(sub => sub.setName('kur').setDescription('Oto-tag kur')
      .addStringOption(opt => opt.setName('tag').setDescription('Eklenecek tag (ornek: [YS] veya | TR)').setRequired(true))
      .addStringOption(opt => opt.setName('konum').setDescription('Tag nereye eklensin')
        .addChoices(
          { name: 'Basina', value: 'bas' },
          { name: 'Sonuna', value: 'son' },
        )))
    .addSubcommand(sub => sub.setName('kapat').setDescription('Oto-tag kapat'))
    .addSubcommand(sub => sub.setName('gor').setDescription('Oto-tag ayarini goster'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Bu komutu sadece **Yonetici** kullanabilir!', ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();
    const config = loadJson(dbPath);
    const g = config[interaction.guild.id] || {};

    if (sub === 'kur') {
      let tag = interaction.options.getString('tag').trim();
      const konum = interaction.options.getString('konum') || 'bas';

      const yeniIsim = konum === 'bas' ? `${tag}{isim}` : `{isim}${tag}`;
      g.otoTag = { tag, konum, sablon: yeniIsim };
      config[interaction.guild.id] = g;
      saveJson(dbPath, config);

      await interaction.reply({
        embed: new EmbedBuilder()
          .setTitle(':label: Oto-Tag Kuruldu')
          .setDescription(`Tag: **${tag}**\nKonum: ${konum === 'bas' ? 'Adin basina' : 'Adin sonuna'}\nOrnek: ${yeniIsim.replace('{isim}', 'Beko')}`)
          .setColor(0x00FF00)
          .setTimestamp(),
      });
      return;
    }

    if (sub === 'kapat') {
      delete g.otoTag;
      config[interaction.guild.id] = g;
      saveJson(dbPath, config);
      await interaction.reply({ content: ':x: Oto-tag kapatildi.' });
      return;
    }

    if (sub === 'gor') {
      const ayar = g.otoTag;
      if (!ayar) return interaction.reply({ content: ':x: Oto-tag kurulu degil. `/oto-tag kur` ile ayarla.', ephemeral: true });
      const embed = new EmbedBuilder()
        .setTitle(':label: Oto-Tag Ayari')
        .setDescription(`Tag: **${ayar.tag}**\nKonum: ${ayar.konum === 'bas' ? 'Basina' : 'Sonuna'}\nSablon: ${ayar.sablon}`)
        .setColor(0x00BFFF)
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }
  },
};
