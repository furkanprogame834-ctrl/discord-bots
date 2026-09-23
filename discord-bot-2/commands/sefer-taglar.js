const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'guild-config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sefer-taglar')
    .setDescription('Sefer formuna eklenecek tagları ayarlar (yetkili)')
    .addStringOption(option => option.setName('taglar').setDescription('Virgülle ayrılmış taglar: @KARAKUSA, @İshak').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    const taglar = interaction.options.getString('taglar');
    let config = {};
    try { if (fs.existsSync(configPath)) config = JSON.parse(fs.readFileSync(configPath, 'utf8')); } catch (e) {}
    if (!config[interaction.guild.id]) config[interaction.guild.id] = {};
    config[interaction.guild.id].seferTaglar = taglar;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return interaction.reply({ content: `✅ Sefer tagları ayarlandı:\n${taglar}`, flags: 64 });
  },
};