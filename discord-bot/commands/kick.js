const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Bir uyeyi sunucudan atar')
    .addUserOption(option => option.setName('kisi').setDescription('Atilacak kisi').setRequired(true))
    .addStringOption(option => option.setName('sebep').setDescription('Atma sebebi')),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
      return interaction.reply({ content: 'Bu komutu kullanmak icin **Uyeleri At** yetkisine sahip olmalisin!', ephemeral: true });
    }

    const kisi = interaction.options.getUser('kisi');
    const sebep = interaction.options.getString('sebep') || 'Belirtilmedi';
    const member = interaction.guild.members.cache.get(kisi.id);

    if (!member) {
      return interaction.reply({ content: 'Kullanici sunucuda bulunamadi!', ephemeral: true });
    }

    if (!member.kickable) {
      return interaction.reply({ content: 'Bu kullaniciyi atamam! (Rolum yetersiz)', ephemeral: true });
    }

    if (member.roles.highest.position >= interaction.member.roles.highest.position) {
      return interaction.reply({ content: 'Kendi rolunle ayni veya daha yuksek rolu olan birini atamazsin!', ephemeral: true });
    }

    await member.kick(sebep);
    await interaction.reply(`:foot: **${kisi.username}** sunucudan atildi!\nSebep: ${sebep}`);
  },
};
