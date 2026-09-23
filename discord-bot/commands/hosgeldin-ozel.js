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
    .setName('hosgeldin-ozel')
    .setDescription('Sunucuya katilanlara ozel mesaj (DM) gonderir')
    .addSubcommand(sub => sub.setName('kur').setDescription('Ozell hosgeldin mesaji kur')
      .addStringOption(opt => opt.setName('mesaj').setDescription('Gonderilecek mesaj ({isim} ve {sunucu} kullanilabilir)').setRequired(true)))
    .addSubcommand(sub => sub.setName('kapat').setDescription('Ozell hosgeldin mesajini kapat'))
    .addSubcommand(sub => sub.setName('test').setDescription('Mesaji sana gondererek test et'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Bu komutu sadece **Yonetici** kullanabilir!', ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();
    const config = loadJson(dbPath);
    const g = config[interaction.guild.id] || {};

    if (sub === 'kur') {
      const mesaj = interaction.options.getString('mesaj');
      g.hosgeldinOzel = mesaj;
      config[interaction.guild.id] = g;
      saveJson(dbPath, config);
      await interaction.reply({ content: `:white_check_mark: Ozell hosgeldin mesaji kuruldu!\nOrnek: ${mesaj.replace('{isim}', 'Beko').replace('{sunucu}', interaction.guild.name)}` });
      return;
    }

    if (sub === 'kapat') {
      delete g.hosgeldinOzel;
      config[interaction.guild.id] = g;
      saveJson(dbPath, config);
      await interaction.reply({ content: ':x: Ozell hosgeldin mesaji kapatildi.' });
      return;
    }

    if (sub === 'test') {
      const mesaj = g.hosgeldinOzel;
      if (!mesaj) return interaction.reply({ content: ':x: Ozell hosgeldin mesaji kurulu degil. `/hosgeldin-ozel kur` ile ayarla.', ephemeral: true });
      try {
        const doldur = mesaj.replace('{isim}', interaction.user.username).replace('{sunucu}', interaction.guild.name);
        await interaction.user.send({ content: doldur });
        await interaction.reply({ content: ':white_check_mark: Test mesaji DM olarak gonderildi!', ephemeral: true });
      } catch (e) {
        await interaction.reply({ content: ':x: DM gonderilemedi! Kullanici DM kapali olabilir.', ephemeral: true });
      }
    }
  },
};
