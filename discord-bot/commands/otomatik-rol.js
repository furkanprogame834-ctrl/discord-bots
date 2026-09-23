const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('otomatik-rol')
    .setDescription('Yeni uyelere otomatik rol verir')
    .addRoleOption(option => option.setName('rol').setDescription('Verilecek rol').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: 'Bu komutu kullanmak icin **Sunucuyu Yonet** yetkisine sahip olmalisin!', ephemeral: true });
    }

    const rol = interaction.options.getRole('rol');
    const fs = require('fs');
    const path = require('path');
    const configPath = path.join(__dirname, '..', 'guild-config.json');

    let config = {};
    try {
      if (fs.existsSync(configPath)) config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (e) {}

    if (!config[interaction.guild.id]) config[interaction.guild.id] = {};
    config[interaction.guild.id].autoRole = rol.id;

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    await interaction.reply(`:white_check_mark: Yeni uyelere otomatik olarak **${rol.name}** rolu verilecek!`);
  },
};
