const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sustur-listesi')
    .setDescription('Sunucudaki tum susturulmus (timeout) uyeleri listeler')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({ content: 'Bu komutu kullanmak icin **Uyeleri Yonet** yetkisine sahip olmalisin!', ephemeral: true });
    }

    await interaction.deferReply();

    let uyeler;
    try {
      const fetch = await interaction.guild.members.fetch();
      uyeler = [...fetch.values()].filter(m => m.isCommunicationDisabled());
    } catch (e) {
      return interaction.editReply({ content: ':x: Uyeler alinirken hata olustu. **Privileged intent** gerekli olabilir.' });
    }

    if (uyeler.length === 0) {
      return interaction.editReply({ content: ':white_check_mark: Sunucuda su an susturulmus uye yok!' });
    }

    const satirlar = uyeler.map((m, i) => {
      const bits = m.communicationDisabledUntilTimestamp;
      const kalan = bits ? Math.max(0, bits - Date.now()) : 0;
      const dk = Math.ceil(kalan / 60000);
      const tarih = `<t:${Math.floor((bits || Date.now()) / 1000)}:R>`;
      return `${i + 1}. **${m.user.username}** — biter: ${tarih} (${dk} dk)`;
    });

    const embed = new EmbedBuilder()
      .setTitle(':mute: Susturulmus Uyeler')
      .setDescription(`Toplam **${uyeler.length}** uye susturulmus.`)
      .addFields({ name: ':page_facing_up: Liste', value: satirlar.join('\n'), inline: false })
      .setColor(0xFFA500)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
