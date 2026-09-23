const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { loadJson, saveJson, kumarDbPath } = require('./kumar-yardimci.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kumar-yasak')
    .setDescription('Bir kullaniciyi kumarhaneden yasakla')
    .addUserOption(opt => opt.setName('kullanici').setDescription('Yasaklanacak kisi').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Bu komutu sadece **Yonetici** kullanabilir!', ephemeral: true });
    }

    const hedef = interaction.options.getUser('kullanici');
    const db = loadJson(kumarDbPath);
    if (!db[interaction.guild.id]) db[interaction.guild.id] = {};
    if (!db[interaction.guild.id].yasakli) db[interaction.guild.id].yasakli = [];
    if (!db[interaction.guild.id].yasakli.includes(hedef.id)) {
      db[interaction.guild.id].yasakli.push(hedef.id);
    }
    saveJson(kumarDbPath, db);

    await interaction.reply({ content: `:no_entry: ${hedef} kumarhaneden yasaklandi!` });
  },
};
