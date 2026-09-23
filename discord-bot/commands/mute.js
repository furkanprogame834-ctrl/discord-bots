const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Bir uyeyi susturur')
    .addUserOption(option => option.setName('kisi').setDescription('Susturulacak kisi').setRequired(true))
    .addIntegerOption(option => option.setName('sure').setDescription('Susturma suresi (dakika)').setMinValue(1).setMaxValue(40320))
    .addStringOption(option => option.setName('sebep').setDescription('Susturma sebebi')),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({ content: 'Bu komutu kullanmak icin **Uyeleri Yonet** yetkisine sahip olmalisin!', ephemeral: true });
    }

    const kisi = interaction.options.getUser('kisi');
    const sure = interaction.options.getInteger('sure') || 10;
    const sebep = interaction.options.getString('sebep') || 'Belirtilmedi';
    const member = interaction.guild.members.cache.get(kisi.id);

    if (!member) {
      return interaction.reply({ content: 'Kullanici sunucuda bulunamadi!', ephemeral: true });
    }

    if (member.roles.highest.position >= interaction.member.roles.highest.position) {
      return interaction.reply({ content: 'Kendi rolunle ayni veya daha yuksek rolu olan birini sustiramazsin!', ephemeral: true });
    }

    await member.timeout(sure * 60 * 1000, sebep);
    await interaction.reply(`:mute: **${kisi.username}** ${sure} dakika susturuldu!\nSebep: ${sebep}`);
  },
};
