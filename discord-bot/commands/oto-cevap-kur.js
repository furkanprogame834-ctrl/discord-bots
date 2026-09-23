const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'guild-config.json');

function loadJson(p) {
  try { if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) {}
  return {};
}
function saveJson(p, d) { fs.writeFileSync(p, JSON.stringify(d, null, 2)); }

const sablonlar = {
  hosgeldin: 'Seni burada gormek harika! Kurallari okumayı unutma.',
  yeni: 'Aramiza hos geldin! Yardim istersen etiketle.',
  kurallar: 'Kurallari mutlaka oku, iyi eglenceler!',
  tanitim: 'Sunucumuz hakkinda bilgi almak icin /komutlar yazabilirsin.',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('oto-cevap-kur')
    .setDescription('Hazir sablonlarla otomatik cevap ekler')
    .addStringOption(opt => opt.setName('tetikleme').setDescription('Tetikleyici kelime').setRequired(true))
    .addStringOption(opt => opt.setName('sablon').setDescription('Hazir sablon sec')
      .addChoices(
        { name: 'Hosgeldin mesaji', value: 'hosgeldin' },
        { name: 'Yeni uye yaniti', value: 'yeni' },
        { name: 'Kurallar hatirlat', value: 'kurallar' },
        { name: 'Tanitim yaniti', value: 'tanitim' },
      ).setRequired(true))
    .addStringOption(opt => opt.setName('ozel').setDescription('Kendi ozel cevabin (sablonu ezer)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: 'Bu komutu kullanmak icin **Sunucuyu Yonet** yetkisine sahip olmalisin!', ephemeral: true });
    }

    const tetikleme = interaction.options.getString('tetikleme').toLowerCase();
    const sablonAdi = interaction.options.getString('sablon');
    const ozel = interaction.options.getString('ozel');
    const cevap = ozel || sablonlar[sablonAdi];

    const otoCevapPath = path.join(__dirname, '..', 'oto-cevap.json');
    const db = loadJson(otoCevapPath);
    if (!db[interaction.guild.id]) db[interaction.guild.id] = {};
    db[interaction.guild.id][tetikleme] = cevap;
    saveJson(otoCevapPath, db);

    await interaction.reply({
      embeds: [new EmbedBuilder()
        .setTitle(':gear: Oto-Cevap Kuruldu')
        .setDescription(`Tetikleyici: **${tetikleme}**\nCevap: "${cevap}"`)
        .setColor(0x00FF00)
        .setTimestamp()],
    });
  },
};
