const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Bir uyeyin susturmasini kaldirir')
    .addUserOption(option => option.setName('kisi').setDescription('Susturmasi kaldirilacak kisi').setRequired(true)),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({ content: 'Bu komutu kullanmak icin **Uyeleri Yonet** yetkisine sahip olmalisin!', ephemeral: true });
    }

    const kisi = interaction.options.getUser('kisi');
    const member = interaction.guild.members.cache.get(kisi.id);

    if (!member) {
      return interaction.reply({ content: 'Kullanici sunucuda bulunamadi!', ephemeral: true });
    }

    await member.timeout(null);
    await interaction.reply(`:speaker: **${kisi.username}** susturmasi kaldirildi!`);
  },
};
