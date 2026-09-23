const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sunucu-bilgi')
    .setDescription('Detayli sunucu bilgisi gosterir'),
  async execute(interaction) {
    const guild = interaction.guild;

    const embed = new EmbedBuilder()
      .setColor(0xFF69B4)
      .setTitle(`:house: ${guild.name}`)
      .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: ':id: Sunucu ID', value: guild.id, inline: true },
        { name: ':crown: Sahip', value: `<@${guild.ownerId}>`, inline: true },
        { name: ':busts_in_silhouette: Uye Sayisi', value: `${guild.memberCount}`, inline: true },
        { name: ':speech_balloon: Kanal Sayisi', value: `${guild.channels.cache.size}`, inline: true },
        { name: ':japanese_ogre: Emoji Sayisi', value: `${guild.emojis.cache.size}`, inline: true },
        { name: ':beginner: Boost Sayisi', value: `${guild.premiumSubscriptionCount || 0}`, inline: true },
        { name: ':shield: Doğrulama', value: `${guild.verificationLevel}`, inline: true },
        { name: ':calendar: Olusturulma', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
      )
      .setTimestamp();

    if (guild.bannerURL()) embed.setImage(guild.bannerURL());

    await interaction.reply({ embeds: [embed] });
  },
};
