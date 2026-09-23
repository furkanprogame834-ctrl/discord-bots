const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('suv')
    .setDescription('Sunucu davet linki olusturur'),
  async execute(interaction) {
    const invite = await interaction.channel.createInvite({ maxAge: 86400, maxUses: 0 });
    await interaction.reply({
      embeds: [{
        color: 0x7289DA,
        title: ':link: Davet Linki',
        description: `[Sunucuya Katil](${invite.url})`,
        footer: { text: '24 saat gecerli' },
      }],
    });
  },
};
