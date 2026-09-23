const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Kullanici avatarini gosterir')
    .addUserOption(option =>
      option.setName('kullanici').setDescription('Avatarini gormek istedigin kisi')
    ),
  async execute(interaction) {
    const user = interaction.options.getUser('kullanici') || interaction.user;
    await interaction.reply({
      content: `${user.username} avatar:`,
      embeds: [
        {
          image: { url: user.displayAvatarURL({ dynamic: true, size: 256 }) },
        },
      ],
    });
  },
};
