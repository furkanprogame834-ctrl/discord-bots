const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('uye-sayim')
    .setDescription('Sunucu uye sayimlarini gosterir')
    .addRoleOption(opt => opt.setName('rol').setDescription('Belirli bir rolde kac uye var')),
  async execute(interaction) {
    const guild = interaction.guild;
    const rol = interaction.options.getRole('rol');

    const embed = new EmbedBuilder()
      .setTitle(':busts_in_silhouette: Uye Sayim')
      .setAuthor({ name: guild.name, iconURL: guild.iconURL() })
      .setColor(0x57F287)
      .setTimestamp();

    if (rol) {
      const uyeler = guild.roles.cache.get(rol.id)?.members.size || 0;
      embed
        .setDescription(`**${rol.name}** rolunde **${uyeler}** uye var.`)
        .setColor(rol.color || 0x57F287);
    } else {
      embed.addFields(
        { name: ':busts_in_silhouette: Toplam Uye', value: `**${guild.memberCount}**`, inline: true },
        { name: ':green_circle: Cevrimici', value: `**${guild.members.cache.filter(m => m.presence?.status === 'online' || m.presence?.status === 'idle' || m.presence?.status === 'dnd').size}**`, inline: true },
        { name: ':robot: Botlar', value: `**${guild.members.cache.filter(m => m.user.bot).size}**`, inline: true },
        { name: ':bust_in_silhouette: Insanlar', value: `**${guild.members.cache.filter(m => !m.user.bot).size}**`, inline: true },
      );
    }

    await interaction.reply({ embeds: [embed] });
  },
};
