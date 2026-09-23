const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sunucu')
    .setDescription('Sunucu hakkinda bilgi verir'),
  async execute(interaction) {
    const guild = interaction.guild;
    await interaction.reply(
      `**Sunucu Adi:** ${guild.name}\n` +
      `**Uye Sayisi:** ${guild.memberCount}\n` +
      `**Olusturulma:** <t:${Math.floor(guild.createdTimestamp / 1000)}:R>\n` +
      `**Sahip:** ${guild.members.cache.get(guild.ownerId)?.user.username || 'Bilinmiyor'}`
    );
  },
};
