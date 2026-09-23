const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { loadJson, saveJson, kumarDbPath } = require('./kumar-yardimci.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kumar-ac')
    .setDescription('Kumarhane sistemini acar/kapatir')
    .addBooleanOption(opt => opt.setName('durum').setDescription('Aktif mi?').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Bu komutu sadece **Yonetici** kullanabilir!', ephemeral: true });
    }

    const durum = interaction.options.getBoolean('durum');
    const db = loadJson(kumarDbPath);
    if (!db[interaction.guild.id]) db[interaction.guild.id] = {};
    db[interaction.guild.id].kapali = !durum;
    saveJson(kumarDbPath, db);

    await interaction.reply({ content: durum ? ':white_check_mark: Kumarhane **acik**!' : ':x: Kumarhane **kapali**!' });
  },
};
