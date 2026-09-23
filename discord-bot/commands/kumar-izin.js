const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { loadJson, saveJson, kumarDbPath } = require('./kumar-yardimci.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kumar-izin')
    .setDescription('Kumarhane oyunlarinin oynanacagi kanali ayarla')
    .addChannelOption(opt => opt.setName('kanal').setDescription('Kumar kanali').addChannelTypes(0).setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Bu komutu sadece **Yonetici** kullanabilir!', ephemeral: true });
    }

    const kanal = interaction.options.getChannel('kanal');
    const db = loadJson(kumarDbPath);
    if (!db[interaction.guild.id]) db[interaction.guild.id] = {};
    db[interaction.guild.id].izinliKanal = kanal.id;
    saveJson(kumarDbPath, db);

    await interaction.reply({ content: `:white_check_mark: Kumar kanali ${kanal} olarak ayarlandi!` });
  },
};
