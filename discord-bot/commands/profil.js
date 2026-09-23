const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profil')
    .setDescription('Kullanici profilini gosterir')
    .addUserOption(option =>
      option.setName('kullanici').setDescription('Profili gormek istedigin kisi')
    ),
  async execute(interaction) {
    const user = interaction.options.getUser('kullanici') || interaction.user;
    const member = interaction.guild.members.cache.get(user.id);

    await interaction.reply({
      embeds: [{
        color: 0xFF69B4,
        title: `${user.username} Profili`,
        thumbnail: { url: user.displayAvatarURL({ dynamic: true, size: 256 }) },
        fields: [
          { name: 'Kullanici Adi', value: user.username, inline: true },
          { name: 'ID', value: user.id, inline: true },
          { name: 'Hesap Olusturma', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
          { name: 'Sunucuya Katilma', value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Bilinmiyor', inline: true },
          { name: 'Roller', value: member ? member.roles.cache.map(r => r.toString()).join(' ') : 'Yok', inline: false },
        ],
      }],
    });
  },
};
