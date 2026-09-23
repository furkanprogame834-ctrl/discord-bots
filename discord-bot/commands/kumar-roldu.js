const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { loadJson, saveJson, kumarDbPath } = require('./kumar-yardimci.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kumar-roldu')
    .setDescription('50 kumar oynayinca verilecek rolu ayarla')
    .addRoleOption(opt => opt.setName('rol').setDescription('Verilecek rol').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Bu komutu sadece **Yonetici** kullanabilir!', ephemeral: true });
    }

    const rol = interaction.options.getRole('rol');
    const db = loadJson(kumarDbPath);
    if (!db[interaction.guild.id]) db[interaction.guild.id] = {};
    db[interaction.guild.id].kumarRol = {
      rolId: rol.id,
      gerekliOyun: 50,
    };
    saveJson(kumarDbPath, db);

    await interaction.reply({ content: `:white_check_mark: 50 kumar oynayan kullanicilara **${rol}** rolü otomatik verilecek!` });
  },
};
