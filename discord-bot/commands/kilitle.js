const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kilitle')
    .setDescription('Kanal kilitle/killidini ac')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({ content: 'Bu komutu kullanmak icin **Kanallari Yonet** yetkisine sahip olmalisin!', ephemeral: true });
    }

    const kanal = interaction.channel;
    const everyone = interaction.guild.roles.everyone;

    const currentPerms = kanal.permissionFor(everyone);
    const isLocked = currentPerms?.has(PermissionFlagsBits.SendMessages) === false;

    await kanal.permissionOverwrites.edit(everyone, {
      SendMessages: isLocked,
    });

    if (isLocked) {
      await interaction.reply(`:unlock: **${kanal.name}** kilidi acildi!`);
    } else {
      await interaction.reply(`:lock: **${kanal.name}** kilitlendi!`);
    }
  },
};
