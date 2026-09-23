const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const otoCevapPath = path.join(__dirname, '..', 'oto-cevap.json');

function loadOtoCevap() {
  try {
    if (fs.existsSync(otoCevapPath)) return JSON.parse(fs.readFileSync(otoCevapPath, 'utf8'));
  } catch (e) {}
  return {};
}

function saveOtoCevap(db) {
  fs.writeFileSync(otoCevapPath, JSON.stringify(db, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('oto-cevap-ekle')
    .setDescription('Oto-cevap ekler')
    .addStringOption(option => option.setName('tetikleme').setDescription('Tetikleyici kelime').setRequired(true))
    .addStringOption(option => option.setName('cevap').setDescription('Otomatik cevap').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: 'Bu komutu kullanmak icin **Sunucuyu Yonet** yetkisine sahip olmalisin!', ephemeral: true });
    }

    const tetikleme = interaction.options.getString('tetikleme').toLowerCase();
    const cevap = interaction.options.getString('cevap');

    const db = loadOtoCevap();
    if (!db[interaction.guild.id]) db[interaction.guild.id] = {};
    db[interaction.guild.id][tetikleme] = cevap;

    saveOtoCevap(db);
    await interaction.reply(`:white_check_mark: "**${tetikleme}**" yazilinca "**${cevap}**" diyecek!`);
  },
};
