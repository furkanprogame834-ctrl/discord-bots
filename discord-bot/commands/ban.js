const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bir uyeyi sunucudan yasaklar')
    .addUserOption(option => option.setName('kisi').setDescription('Yasaklanacak kisi').setRequired(true))
    .addStringOption(option => option.setName('sebep').setDescription('Yasaklama sebebi')),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({ content: 'Bu komutu kullanmak icin **Uyeleri Yonet** yetkisine sahip olmalisin!', ephemeral: true });
    }

    const kisi = interaction.options.getUser('kisi');
    const sebep = interaction.options.getString('sebep') || 'Belirtilmedi';
    const member = interaction.guild.members.cache.get(kisi.id);

    if (!member) {
      return interaction.reply({ content: 'Kullanici sunucuda bulunamadi!', ephemeral: true });
    }

    if (!member.bannable) {
      return interaction.reply({ content: 'Bu kullaniciyi yasaklayamam! (Rolum yetersiz)', ephemeral: true });
    }

    if (member.roles.highest.position >= interaction.member.roles.highest.position) {
      return interaction.reply({ content: 'Kendi rolunle ayni veya daha yuksek rolu olan birini yasaklayamazsin!', ephemeral: true });
    }

    await member.ban({ reason: sebep });
    await interaction.reply(`:hammer: **${kisi.username}** sunucudan yasaklandi!\nSebep: ${sebep}`);
  },
};
