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
    .setName('oto-cevap-sil')
    .setDescription('Oto-cevap siler')
    .addStringOption(option => option.setName('tetikleme').setDescription('Silinecek tetikleme').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: 'Bu komutu kullanmak icin **Sunucuyu Yonet** yetkisine sahip olmalisin!', ephemeral: true });
    }

    const tetikleme = interaction.options.getString('tetikleme').toLowerCase();
    const db = loadOtoCevap();

    if (!db[interaction.guild.id] || !db[interaction.guild.id][tetikleme]) {
      return interaction.reply({ content: 'Boyle bir oto-cevap bulunamadi!', ephemeral: true });
    }

    delete db[interaction.guild.id][tetikleme];
    saveOtoCevap(db);
    await interaction.reply(`:white_check_mark: "**${tetikleme}**" oto-cevabi silindi!`);
  },
};
